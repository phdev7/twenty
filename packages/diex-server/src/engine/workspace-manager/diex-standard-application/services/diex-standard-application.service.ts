import { Injectable } from '@nestjs/common';

import { ApplicationService } from 'src/engine/core-modules/application/application.service';
import { DIEX_STANDARD_APPLICATION } from 'src/engine/workspace-manager/diex-standard-application/constants/diex-standard-applications';
import { MetadataFlatEntity } from 'src/engine/metadata-modules/flat-entity/types/metadata-flat-entity.type';
import { getMetadataFlatEntityMapsKey } from 'src/engine/metadata-modules/flat-entity/utils/get-metadata-flat-entity-maps-key.util';
import { getSubFlatEntityMapsByApplicationIdsOrThrow } from 'src/engine/metadata-modules/flat-entity/utils/get-sub-flat-entity-maps-by-application-ids-or-throw.util';
import { GlobalWorkspaceOrmManager } from 'src/engine/diex-orm/global-workspace-datasource/global-workspace-orm.manager';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { DIEX_STANDARD_ALL_METADATA_NAME } from 'src/engine/workspace-manager/diex-standard-application/constants/diex-standard-all-metadata-name.constant';
import { computeDiexStandardApplicationAllFlatEntityMaps } from 'src/engine/workspace-manager/diex-standard-application/utils/diex-standard-application-all-flat-entity-maps.constant';
import { WorkspaceMigrationBuilderException } from 'src/engine/workspace-manager/workspace-migration/exceptions/workspace-migration-builder-exception';
import { WorkspaceMigrationValidateBuildAndRunService } from 'src/engine/workspace-manager/workspace-migration/services/workspace-migration-validate-build-and-run-service';
import { summarizeFailedMigrationReport } from 'src/engine/workspace-manager/workspace-migration/utils/summarize-failed-migration-report.util';
import { FromToAllUniversalFlatEntityMaps } from 'src/engine/workspace-manager/workspace-migration/types/workspace-migration-orchestrator.type';

// TODO completely deprecate this file once we've created the diex-standard diex-app manifest
@Injectable()
export class DiexStandardApplicationService {
  constructor(
    private readonly applicationService: ApplicationService,
    private readonly workspaceMigrationValidateBuildAndRunService: WorkspaceMigrationValidateBuildAndRunService,
    private readonly workspaceCacheService: WorkspaceCacheService,
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {}

  async synchronizeDiexStandardApplicationOrThrow({
    workspaceId,
  }: {
    workspaceId: string;
  }) {
    const { diexStandardFlatApplication } =
      await this.applicationService.findWorkspaceDiexStandardAndCustomApplicationOrThrow(
        {
          workspaceId,
        },
      );

    if (
      diexStandardFlatApplication.name !== DIEX_STANDARD_APPLICATION.name
    ) {
      await this.applicationService.update(diexStandardFlatApplication.id, {
        name: DIEX_STANDARD_APPLICATION.name,
        workspaceId,
      });
    }
    const { featureFlagsMap, ...fromDiexStandardAllFlatEntityMaps } =
      await this.workspaceCacheService.getOrRecompute(workspaceId, [
        ...DIEX_STANDARD_ALL_METADATA_NAME.map(getMetadataFlatEntityMapsKey),
        'featureFlagsMap',
      ]);

    const {
      allFlatEntityMaps: toDiexStandardAllFlatEntityMaps,
      idByUniversalIdentifierByMetadataName,
    } = computeDiexStandardApplicationAllFlatEntityMaps({
      now: new Date().toISOString(),
      workspaceId,
      diexStandardApplicationId: diexStandardFlatApplication.id,
    });

    const fromToAllFlatEntityMaps: FromToAllUniversalFlatEntityMaps = {};

    for (const metadataName of DIEX_STANDARD_ALL_METADATA_NAME) {
      const flatEntityMapsKey = getMetadataFlatEntityMapsKey(metadataName);
      const fromFlatEntityMaps =
        fromDiexStandardAllFlatEntityMaps[flatEntityMapsKey];
      const fromTo = {
        from: getSubFlatEntityMapsByApplicationIdsOrThrow<
          MetadataFlatEntity<typeof metadataName>
        >({
          applicationIds: [diexStandardFlatApplication.id],
          flatEntityMaps: fromFlatEntityMaps,
        }),
        to: toDiexStandardAllFlatEntityMaps[flatEntityMapsKey],
      };

      // @ts-expect-error Metadata flat entity maps cache key and metadataName colliding
      fromToAllFlatEntityMaps[flatEntityMapsKey] = fromTo;
    }

    const validateAndBuildResult =
      await this.workspaceMigrationValidateBuildAndRunService.validateBuildAndRunWorkspaceMigrationFromTo(
        {
          buildOptions: {
            isSystemBuild: true,
            inferDeletionFromMissingEntities: true,
            applicationUniversalIdentifier:
              diexStandardFlatApplication.universalIdentifier,
          },
          fromToAllFlatEntityMaps,
          workspaceId,
          additionalCacheDataMaps: {
            featureFlagsMap,
          },
          idByUniversalIdentifierByMetadataName,
        },
      );

    if (validateAndBuildResult.status === 'fail') {
      throw new WorkspaceMigrationBuilderException(
        validateAndBuildResult,
        `Multiple validation errors occurred while synchronizing diex-standard application: ${summarizeFailedMigrationReport(
          validateAndBuildResult.report,
        )}`,
      );
    }
  }
}
