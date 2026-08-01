import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { type ObjectLiteral, IsNull, Repository } from 'typeorm';

import { SignInUpService } from 'src/engine/core-modules/auth/services/sign-in-up.service';
import { type AuthContextUser } from 'src/engine/core-modules/auth/types/auth-context.type';
import { SubdomainManagerService } from 'src/engine/core-modules/domain/subdomain-manager/services/subdomain-manager.service';
import { WorkspaceDomainsService } from 'src/engine/core-modules/domain/workspace-domains/services/workspace-domains.service';
import { UserService } from 'src/engine/core-modules/user/services/user.service';
import { WorkspaceInvitationService } from 'src/engine/core-modules/workspace-invitation/services/workspace-invitation.service';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { type WorkspaceRepository } from 'src/engine/twenty-orm/repository/workspace.repository';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { WorkspaceMemberWorkspaceEntity } from 'src/modules/workspace-member/standard-objects/workspace-member.workspace-entity';

import { type ApproveDiexAccessRequestDTO } from 'src/engine/core-modules/diex-access-request/dtos/approve-diex-access-request.dto';
import {
  type DiexAccessRequestRecord,
  DiexAccessRequestStatus,
  type DiexPublicAccessRequestInput,
  type DiexPublicAccessRequestResult,
} from 'src/engine/core-modules/diex-access-request/types/diex-access-request.types';

const ACCESS_REQUEST_FIELD_MAX_LENGTH = 200;
const ACCESS_REQUEST_GOAL_MAX_LENGTH = 1_000;
const ACCESS_REQUEST_MAX_SUBMISSIONS_PER_EMAIL = 25;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const readText = (value: unknown, maxLength: number): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed.slice(0, maxLength) : null;
};

const readEmail = (value: unknown): string | null => {
  const normalized = readText(
    value,
    ACCESS_REQUEST_FIELD_MAX_LENGTH,
  )?.toLowerCase();

  return normalized && EMAIL_PATTERN.test(normalized) ? normalized : null;
};

const readWhatsapp = (value: unknown): string | null => {
  const text = readText(value, ACCESS_REQUEST_FIELD_MAX_LENGTH);
  const digits = text?.replace(/\D/g, '') ?? '';

  if (!text || digits.length < 10 || digits.length > 15) {
    return null;
  }

  const normalized =
    digits.length <= 11 && !text.startsWith('+') ? `55${digits}` : digits;

  return `+${normalized}`;
};

const readSubdomain = (value: unknown): string | null => {
  const normalized = readText(value, 30)
    ?.toLowerCase()
    .replace(/[^a-z0-9-]/g, '');

  return normalized && normalized.length >= 3 ? normalized : null;
};

@Injectable()
export class DiexAccessRequestService {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    private readonly signInUpService: SignInUpService,
    private readonly userService: UserService,
    private readonly subdomainManagerService: SubdomainManagerService,
    private readonly workspaceDomainsService: WorkspaceDomainsService,
    private readonly workspaceInvitationService: WorkspaceInvitationService,
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
  ) {}

  private async withRepository<T>(
    workspaceId: string,
    operation: (
      repository: WorkspaceRepository<DiexAccessRequestRecord & ObjectLiteral>,
    ) => Promise<T>,
  ): Promise<T> {
    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const repository = await this.globalWorkspaceOrmManager.getRepository<
          DiexAccessRequestRecord & ObjectLiteral
        >(workspaceId, 'diexAccessRequest', {
          shouldBypassPermissionChecks: true,
        });

        return operation(repository);
      },
      buildSystemAuthContext(workspaceId),
    );
  }

  async submitPublicRequest(
    workspaceId: string,
    input: DiexPublicAccessRequestInput,
  ): Promise<DiexPublicAccessRequestResult> {
    if (readText(input.website, 10) !== null) {
      return { accepted: true, message: 'Recebemos sua solicitação.' };
    }

    const companyName = readText(
      input.companyName,
      ACCESS_REQUEST_FIELD_MAX_LENGTH,
    );
    const email = readEmail(input.email);
    const whatsapp = readWhatsapp(input.whatsapp);

    if (!companyName || !email || !whatsapp) {
      return {
        accepted: false,
        message:
          'Informe o nome da empresa, um e-mail válido e um WhatsApp com DDD.',
      };
    }

    const contactName = readText(
      input.contactName,
      ACCESS_REQUEST_FIELD_MAX_LENGTH,
    );
    const teamSize = readText(input.teamSize, ACCESS_REQUEST_FIELD_MAX_LENGTH);
    const desiredSubdomain = readSubdomain(input.desiredSubdomain);
    const goal = readText(input.goal, ACCESS_REQUEST_GOAL_MAX_LENGTH);
    const requestedAt = new Date().toISOString();

    return this.withRepository(workspaceId, async (repository) => {
      const existing = await repository.findOne({ where: { email } });

      if (existing) {
        const submissionCount = (existing.submissionCount ?? 1) + 1;

        if (submissionCount > ACCESS_REQUEST_MAX_SUBMISSIONS_PER_EMAIL) {
          return { accepted: true, message: 'Recebemos sua solicitação.' };
        }

        const shouldPreserveDecision =
          existing.status === DiexAccessRequestStatus.APPROVED ||
          existing.status === DiexAccessRequestStatus.REJECTED;

        await repository.update(existing.id, {
          name: companyName,
          contactName,
          whatsapp,
          teamSize,
          desiredSubdomain,
          goal,
          submissionCount,
          ...(shouldPreserveDecision ? {} : { requestedAt }),
        });

        return {
          accepted: true,
          message:
            'Atualizamos sua solicitação. Entraremos em contato pelo WhatsApp.',
        };
      }

      await repository.save({
        name: companyName,
        status: DiexAccessRequestStatus.NEW,
        contactName,
        email,
        whatsapp,
        teamSize,
        desiredSubdomain,
        goal,
        submissionCount: 1,
        requestedAt,
      });

      return {
        accepted: true,
        message: 'Solicitação recebida. Entraremos em contato pelo WhatsApp.',
      };
    });
  }

  async approveRequest({
    requestId,
    requestedSubdomain,
    operatorWorkspaceId,
    operator,
  }: {
    requestId: string;
    requestedSubdomain: string;
    operatorWorkspaceId: string;
    operator: AuthContextUser;
  }): Promise<ApproveDiexAccessRequestDTO> {
    const normalizedSubdomain = requestedSubdomain.trim().toLowerCase();
    let request = await this.withRepository(operatorWorkspaceId, (repository) =>
      repository.findOne({ where: { id: requestId } }),
    );

    if (!request) {
      throw new NotFoundException('Solicitação de acesso não encontrada.');
    }

    if (!request.provisionedSubdomain) {
      const availability =
        await this.subdomainManagerService.getSubdomainAvailability(
          normalizedSubdomain,
        );

      if (!availability.available) {
        throw new BadRequestException(
          `O endereço ${normalizedSubdomain} não está disponível.`,
        );
      }

      await this.withRepository(operatorWorkspaceId, (repository) =>
        repository.update(
          { id: requestId, provisionedSubdomain: IsNull() },
          {
            provisionedSubdomain: normalizedSubdomain,
            status: DiexAccessRequestStatus.NEGOTIATING,
          },
        ),
      );

      request = await this.withRepository(operatorWorkspaceId, (repository) =>
        repository.findOne({ where: { id: requestId } }),
      );
    }

    if (!request?.provisionedSubdomain) {
      throw new BadRequestException(
        'Não foi possível reservar o endereço para esta solicitação.',
      );
    }

    const reservedSubdomain = request.provisionedSubdomain;
    let workspace = await this.workspaceRepository.findOne({
      where: { id: requestId },
    });

    if (
      !workspace &&
      request.status === DiexAccessRequestStatus.APPROVED
    ) {
      workspace = await this.workspaceRepository.findOne({
        where: { subdomain: reservedSubdomain },
      });

      if (!workspace) {
        throw new BadRequestException(
          'A solicitação consta como aprovada, mas o workspace entregue não foi encontrado.',
        );
      }
    }

    if (workspace && workspace.subdomain !== reservedSubdomain) {
      throw new BadRequestException(
        'A recuperação encontrou um workspace incompatível com a solicitação.',
      );
    }

    if (!workspace) {
      const fullUser = await this.userService.findUserByIdOrThrow(operator.id);

      try {
        const creation = await this.signInUpService.signUpOnNewWorkspace(
          { type: 'existingUser', existingUser: fullUser },
          {
            displayName: request.name ?? reservedSubdomain,
            subdomain: reservedSubdomain,
            // A stable core ID makes a retry recover the exact workspace even
            // if the request update or response failed after creation.
            workspaceId: requestId,
          },
        );

        workspace = creation.workspace;
      } catch (error) {
        workspace = await this.workspaceRepository.findOne({
          where: { id: requestId },
        });

        if (!workspace) {
          throw error;
        }
      }
    }

    await this.withRepository(operatorWorkspaceId, (repository) =>
      repository.update(requestId, {
        status: DiexAccessRequestStatus.APPROVED,
        provisionedSubdomain: reservedSubdomain,
        reviewedAt: new Date().toISOString(),
      }),
    );

    const invitation =
      request.status === DiexAccessRequestStatus.APPROVED
        ? null
        : await this.sendInvitationBestEffort({
            workspace,
            operator,
            email: request.email,
          });
    const workspaceUrl = this.workspaceDomainsService
      .getWorkspaceUrls(workspace)
      .subdomainUrl.replace(/\/+$/, '');

    return {
      workspaceUrl,
      subdomain: reservedSubdomain,
      wasInvitationSent: invitation?.success === true,
      invitationMessage:
        invitation?.success === true
          ? `Convite enviado para ${request.email}.`
          : 'Workspace criado. Convide o cliente por Membros caso ele ainda não tenha recebido o acesso.',
    };
  }

  private async sendInvitationBestEffort({
    workspace,
    operator,
    email,
  }: {
    workspace: WorkspaceEntity;
    operator: AuthContextUser;
    email: string | null;
  }): Promise<{ success: boolean } | null> {
    if (!email) {
      return null;
    }

    try {
      const sender =
        await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
          async () => {
            const repository =
              await this.globalWorkspaceOrmManager.getRepository<WorkspaceMemberWorkspaceEntity>(
                workspace.id,
                'workspaceMember',
                { shouldBypassPermissionChecks: true },
              );

            return repository.findOneOrFail({ where: { userId: operator.id } });
          },
          buildSystemAuthContext(workspace.id),
        );

      return await this.workspaceInvitationService.sendInvitations(
        [email],
        workspace,
        sender,
      );
    } catch {
      return null;
    }
  }
}
