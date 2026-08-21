import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import {
  capitalize,
  getSubdomainSlugFromDisplayName,
  isDefined,
} from 'diex-shared/utils';
import { In, Repository } from 'typeorm';

import { type SubdomainAvailabilityDTO } from 'src/engine/core-modules/domain/subdomain-manager/dtos/subdomain-availability.dto';
import { type WorkspaceCreationDefaultsDTO } from 'src/engine/core-modules/domain/subdomain-manager/dtos/workspace-creation-defaults.dto';
import { generateRandomSubdomain } from 'src/engine/core-modules/domain/subdomain-manager/utils/generate-random-subdomain.util';
import { getSubdomainFromEmail } from 'src/engine/core-modules/domain/subdomain-manager/utils/get-subdomain-from-email.util';
import { isSubdomainValid } from 'src/engine/core-modules/domain/subdomain-manager/utils/is-subdomain-valid.util';
import { DiexConfigService } from 'src/engine/core-modules/diex-config/diex-config.service';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import {
  WorkspaceException,
  WorkspaceExceptionCode,
} from 'src/engine/core-modules/workspace/workspace.exception';

const SUBDOMAIN_MAX_LENGTH = 30;
const MAX_NUMBERED_SUFFIX_ATTEMPTS = 50;
const MAX_RANDOM_FALLBACK_ATTEMPTS = 10;
const SUBDOMAIN_SUGGESTIONS_COUNT = 3;

@Injectable()
export class SubdomainManagerService {
  constructor(
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
    private readonly diexConfigService: DiexConfigService,
  ) {}

  async generateSubdomain({
    userEmail,
    workspaceDisplayName,
  }: {
    userEmail?: string;
    workspaceDisplayName?: string;
  }) {
    const extractedSubdomain =
      getSubdomainFromEmail(userEmail) ||
      getSubdomainSlugFromDisplayName(workspaceDisplayName);

    return this.findAvailableSubdomain(extractedSubdomain ?? '');
  }

  async getWorkspaceCreationDefaults(
    email?: string,
  ): Promise<WorkspaceCreationDefaultsDTO> {
    const subdomainBase = getSubdomainFromEmail(email);

    if (!isDefined(subdomainBase)) {
      return { displayName: '', subdomain: '' };
    }

    return {
      displayName: capitalize(subdomainBase),
      subdomain: await this.findAvailableSubdomain(subdomainBase),
    };
  }

  async findAvailableSubdomain(desired: string): Promise<string> {
    const [availableSubdomain] = await this.findAvailableSubdomains(desired, 1);

    return availableSubdomain;
  }

  async findAvailableSubdomains(
    desired: string,
    count: number,
  ): Promise<string[]> {
    const derivedBase = isSubdomainValid(desired)
      ? desired
      : getSubdomainSlugFromDisplayName(desired);

    const base =
      isDefined(derivedBase) && isSubdomainValid(derivedBase)
        ? derivedBase
        : generateRandomSubdomain();

    const candidates = this.buildSubdomainCandidates(base);

    const availableSubdomains =
      await this.filterFreeToUseSubdomains(candidates);

    if (availableSubdomains.length === 0) {
      return [generateRandomSubdomain()];
    }

    return availableSubdomains.slice(0, count);
  }

  private buildSubdomainCandidates(base: string): string[] {
    const numberedCandidates = Array.from(
      { length: MAX_NUMBERED_SUFFIX_ATTEMPTS - 1 },
      (_, index) => this.appendNumberedSuffix(base, index + 2),
    );

    const randomCandidates = Array.from(
      { length: MAX_RANDOM_FALLBACK_ATTEMPTS },
      () => generateRandomSubdomain(),
    );

    return [...new Set([base, ...numberedCandidates, ...randomCandidates])];
  }

  private async filterFreeToUseSubdomains(
    candidates: string[],
  ): Promise<string[]> {
    const defaultSubdomain = this.diexConfigService.get('DEFAULT_SUBDOMAIN');

    const validCandidates = candidates.filter(
      (candidate) =>
        isSubdomainValid(candidate) && candidate !== defaultSubdomain,
    );

    if (validCandidates.length === 0) {
      return [];
    }

    // O banco tem índice único em subdomain e em formsSubdomain. Workspace
    // renomeado mantém o formsSubdomain antigo, então olhar só subdomain
    // sugere um nome que o INSERT vai recusar depois.
    const existingWorkspaces = await this.workspaceRepository.find({
      where: [
        { subdomain: In(validCandidates) },
        { formsSubdomain: In(validCandidates) },
      ],
      withDeleted: true,
      select: { subdomain: true, formsSubdomain: true },
    });

    const takenSubdomains = new Set(
      existingWorkspaces.flatMap((workspace) =>
        [workspace.subdomain, workspace.formsSubdomain].filter(
          (value): value is string => isDefined(value),
        ),
      ),
    );

    return validCandidates.filter(
      (candidate) => !takenSubdomains.has(candidate),
    );
  }

  async getSubdomainAvailability(
    subdomain: string,
  ): Promise<SubdomainAvailabilityDTO> {
    const isValid = isSubdomainValid(subdomain);
    const available = isValid && (await this.isSubdomainFreeToUse(subdomain));

    // Autofill adopts the first suggestion directly, so never echo an invalid
    // input back.
    const suggestedSubdomains = available
      ? [subdomain]
      : await this.findAvailableSubdomains(
          subdomain,
          SUBDOMAIN_SUGGESTIONS_COUNT,
        );

    return {
      isValid,
      available,
      suggestedSubdomain: suggestedSubdomains[0],
      suggestedSubdomains,
    };
  }

  async isSubdomainAvailable(subdomain: string) {
    // Precisa cobrir as duas colunas com índice único, senão o passo de
    // subdomínio aprova o nome e o erro só aparece ao finalizar o cadastro.
    const existingWorkspace = await this.workspaceRepository.findOne({
      where: [{ subdomain }, { formsSubdomain: subdomain }],
      withDeleted: true,
    });

    return !existingWorkspace;
  }

  async validateSubdomainOrThrow(subdomain: string) {
    const isValid = isSubdomainValid(subdomain);

    if (!isValid) {
      throw new WorkspaceException(
        'Subdomain is not valid',
        WorkspaceExceptionCode.SUBDOMAIN_NOT_VALID,
      );
    }

    const isAvailable = await this.isSubdomainAvailable(subdomain);

    if (
      !isAvailable ||
      this.diexConfigService.get('DEFAULT_SUBDOMAIN') === subdomain
    ) {
      throw new WorkspaceException(
        'Subdomain already taken',
        WorkspaceExceptionCode.SUBDOMAIN_ALREADY_TAKEN,
      );
    }
  }

  private async isSubdomainFreeToUse(subdomain: string): Promise<boolean> {
    return (
      isSubdomainValid(subdomain) &&
      this.diexConfigService.get('DEFAULT_SUBDOMAIN') !== subdomain &&
      (await this.isSubdomainAvailable(subdomain))
    );
  }

  private appendNumberedSuffix(base: string, suffix: number): string {
    const suffixPart = `-${suffix}`;
    const maxBaseLength = SUBDOMAIN_MAX_LENGTH - suffixPart.length;
    const trimmedBase =
      base.length > maxBaseLength
        ? base.slice(0, maxBaseLength).replace(/-+$/g, '')
        : base;

    return `${trimmedBase}${suffixPart}`;
  }
}
