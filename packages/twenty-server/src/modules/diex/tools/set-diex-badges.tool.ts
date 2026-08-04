import { z } from 'zod';

import { DIEX_STANDARD_OBJECT_EXTENSION_FIELDS } from 'twenty-shared/metadata';
import { isDefined } from 'twenty-shared/utils';

import { type WorkspaceManyOrAllFlatEntityMapsCacheService } from 'src/engine/metadata-modules/flat-entity/services/workspace-many-or-all-flat-entity-maps-cache.service';
import { type GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { CompanyWorkspaceEntity } from 'src/modules/company/standard-objects/company.workspace-entity';
import { PersonWorkspaceEntity } from 'src/modules/person/standard-objects/person.workspace-entity';

const BADGE_FIELD_UNIVERSAL_IDENTIFIERS = {
  person:
    DIEX_STANDARD_OBJECT_EXTENSION_FIELDS.person.diexBadges.universalIdentifier,
  company:
    DIEX_STANDARD_OBJECT_EXTENSION_FIELDS.company.diexBadges
      .universalIdentifier,
} as const;

const schema = z.object({
  recordType: z.enum(['person', 'company']),
  recordId: z.string().uuid(),
  badges: z.array(z.string()).max(20),
  mode: z.enum(['replace', 'add', 'remove']).optional(),
});

export const createSetDiexBadgesTool = (
  globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  flatEntityMapsCacheService: WorkspaceManyOrAllFlatEntityMapsCacheService,
  workspaceId: string,
) => ({
  name: 'set_diex_badges' as const,
  description:
    'Aplica badges em uma pessoa ou empresa. Aceita modo replace (padrão), add ou remove. Só grava valores que existem nas opções do campo.',
  inputSchema: schema,
  execute: async (parameters: z.infer<typeof schema>) => {
    const { recordType, recordId, badges } = parameters;
    const mode = parameters.mode ?? 'replace';

    const { flatFieldMetadataMaps } =
      await flatEntityMapsCacheService.getOrRecomputeManyOrAllFlatEntityMaps({
        workspaceId,
        flatMapsKeys: ['flatFieldMetadataMaps'],
      });

    const field =
      flatFieldMetadataMaps.byUniversalIdentifier[
        BADGE_FIELD_UNIVERSAL_IDENTIFIERS[recordType]
      ];

    if (!isDefined(field) || !field.isActive) {
      return {
        applied: false,
        reason: `O campo de badges ainda não está disponível para ${recordType} neste workspace.`,
      };
    }

    const allowedValues = new Set(
      ((field.options ?? []) as { value: string }[]).map(
        (option) => option.value,
      ),
    );
    const unknownBadges = badges.filter((badge) => !allowedValues.has(badge));

    // Refusing the whole call keeps the record consistent: a partial write
    // would leave the caller believing every badge landed.
    if (unknownBadges.length > 0) {
      return {
        applied: false,
        reason: 'Badge inexistente para este objeto.',
        unknownBadges,
        allowedBadges: [...allowedValues],
      };
    }

    const authContext = buildSystemAuthContext(workspaceId);

    return globalWorkspaceOrmManager.executeInWorkspaceContext(async () => {
      const repository =
        recordType === 'person'
          ? await globalWorkspaceOrmManager.getRepository<PersonWorkspaceEntity>(
              workspaceId,
              PersonWorkspaceEntity,
            )
          : await globalWorkspaceOrmManager.getRepository<CompanyWorkspaceEntity>(
              workspaceId,
              CompanyWorkspaceEntity,
            );

      const record = await repository.findOne({ where: { id: recordId } });

      if (!isDefined(record)) {
        return {
          applied: false,
          reason: `Nenhum registro de ${recordType} com o id informado.`,
        };
      }

      const currentBadges = record.diexBadges ?? [];
      const nextBadges =
        mode === 'replace'
          ? [...new Set(badges)]
          : mode === 'add'
            ? [...new Set([...currentBadges, ...badges])]
            : currentBadges.filter((badge) => !badges.includes(badge));

      await repository.update(recordId, { diexBadges: nextBadges });

      return {
        applied: true,
        recordType,
        recordId,
        mode,
        previousBadges: currentBadges,
        badges: nextBadges,
      };
    }, authContext);
  },
});
