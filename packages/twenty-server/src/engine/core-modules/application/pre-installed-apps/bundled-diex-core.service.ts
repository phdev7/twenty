import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { readFile } from 'fs/promises';
import { resolve } from 'path';

import {
  DIEX_CORE_APPLICATION_UNIVERSAL_IDENTIFIER,
  type Manifest,
} from 'twenty-shared/application';
import { type PackageJson } from 'type-fest';
import { Repository } from 'typeorm';

import {
  DIEX_CORE_BUNDLED_PACKAGE_NAME,
  resolveBundledApplicationPackagePath,
} from 'src/engine/core-modules/application/application-package/constants/bundled-application-package.constant';
import { ApplicationRegistrationEntity } from 'src/engine/core-modules/application/application-registration/application-registration.entity';
import { ApplicationRegistrationSourceType } from 'src/engine/core-modules/application/application-registration/enums/application-registration-source-type.enum';
import { PreInstalledAppsService } from 'src/engine/core-modules/application/pre-installed-apps/pre-installed-apps.service';

const DIEX_CORE_OAUTH_CLIENT_ID = 'd1e00000-0000-4000-8000-000000000002';

@Injectable()
export class BundledDiexCoreService implements OnApplicationBootstrap {
  private readonly logger = new Logger(BundledDiexCoreService.name);

  constructor(
    @InjectRepository(ApplicationRegistrationEntity)
    private readonly applicationRegistrationRepository: Repository<ApplicationRegistrationEntity>,
    private readonly preInstalledAppsService: PreInstalledAppsService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    let packagePath: string;

    try {
      packagePath = await resolveBundledApplicationPackagePath(
        DIEX_CORE_BUNDLED_PACKAGE_NAME,
      );
    } catch (error) {
      const message = `Diex CRM Core package is unavailable: ${
        error instanceof Error ? error.message : String(error)
      }`;

      if (process.env.NODE_ENV === 'production') {
        throw new Error(message);
      }

      this.logger.warn(message);

      return;
    }

    const manifest = JSON.parse(
      await readFile(resolve(packagePath, 'manifest.json'), 'utf8'),
    ) as Manifest;
    const packageJson = JSON.parse(
      await readFile(resolve(packagePath, 'package.json'), 'utf8'),
    ) as PackageJson;

    if (
      manifest.application.universalIdentifier !==
      DIEX_CORE_APPLICATION_UNIVERSAL_IDENTIFIER
    ) {
      throw new Error(
        'The bundled Diex CRM Core manifest has an unexpected universal identifier',
      );
    }

    const registration = await this.upsertRegistration({
      manifest,
      version: packageJson.version ?? '0.0.0',
    });

    await this.preInstalledAppsService.backfillApplicationOnAllWorkspaces(
      registration.id,
    );
  }

  private async upsertRegistration({
    manifest,
    version,
  }: {
    manifest: Manifest;
    version: string;
  }): Promise<ApplicationRegistrationEntity> {
    const existing = await this.applicationRegistrationRepository.findOne({
      where: {
        universalIdentifier: DIEX_CORE_APPLICATION_UNIVERSAL_IDENTIFIER,
      },
    });

    const registration =
      existing ??
      this.applicationRegistrationRepository.create({
        universalIdentifier: DIEX_CORE_APPLICATION_UNIVERSAL_IDENTIFIER,
        oAuthClientId: DIEX_CORE_OAUTH_CLIENT_ID,
        oAuthClientSecretHash: null,
        oAuthRedirectUris: [],
        oAuthScopes: [],
        createdByUserId: null,
        ownerWorkspaceId: null,
        tarballFileId: null,
        logoFileId: null,
        screenshots: [],
      });

    registration.name = 'Diex CRM Core';
    registration.sourceType = ApplicationRegistrationSourceType.BUNDLED;
    registration.sourcePackage = DIEX_CORE_BUNDLED_PACKAGE_NAME;
    registration.latestAvailableVersion = version;
    registration.isListed = false;
    registration.isVetted = true;
    registration.isPreInstalled = true;
    registration.manifest = manifest;
    registration.logo = manifest.application.logo ?? null;
    registration.description = manifest.application.description ?? null;
    registration.author = manifest.application.author ?? 'Diex';
    registration.category = manifest.application.category ?? 'Productivity';
    registration.websiteUrl = null;
    registration.aboutDescription =
      manifest.application.aboutDescription ?? null;
    registration.termsUrl = null;
    registration.emailSupport = null;
    registration.issueReportUrl = null;

    const saved =
      await this.applicationRegistrationRepository.save(registration);

    this.logger.log(
      `Diex CRM Core v${version} registered as a mandatory bundled capability`,
    );

    return saved;
  }
}
