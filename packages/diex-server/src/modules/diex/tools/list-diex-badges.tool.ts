import { z } from 'zod';

import { DIEX_STANDARD_OBJECT_EXTENSION_FIELDS } from 'diex-shared/metadata';
import { isDefined } from 'diex-shared/utils';

import { type WorkspaceManyOrAllFlatEntityMapsCacheService } from 'src/engine/metadata-modules/flat-entity/services/workspace-many-or-all-flat-entity-maps-cache.service';

const BADGE_FIELD_UNIVERSAL_IDENTIFIERS = {
  person:
    DIEX_STANDARD_OBJECT_EXTENSION_FIELDS.person.diexBadges.universalIdentifier,
  company:
    DIEX_STANDARD_OBJECT_EXTENSION_FIELDS.company.diexBadges
      .universalIdentifier,
} as const;

const schema = z.object({
  recordType: z.enum(['person', 'company']).optional(),
});

export const createListDiexBadgesTool = (
  flatEntityMapsCacheService: WorkspaceManyOrAllFlatEntityMapsCacheService,
  workspaceId: string,
) => ({
  name: 'list_diex_badges' as const,
  description:
    'Lista as badges disponíveis em pessoas e empresas. As opções são lidas do metadata do workspace, então refletem as badges que o operador criou ou renomeou.',
  inputSchema: schema,
  execute: async (parameters: z.infer<typeof schema>) => {
    const { flatFieldMetadataMaps } =
      await flatEntityMapsCacheService.getOrRecomputeManyOrAllFlatEntityMaps({
        workspaceId,
        flatMapsKeys: ['flatFieldMetadataMaps'],
      });

    const requestedTypes = isDefined(parameters.recordType)
      ? [parameters.recordType]
      : (['person', 'company'] as const);

    const badgesByRecordType = requestedTypes.map((recordType) => {
      const field =
        flatFieldMetadataMaps.byUniversalIdentifier[
          BADGE_FIELD_UNIVERSAL_IDENTIFIERS[recordType]
        ];

      // A workspace that has not synced the field yet reports it as
      // unavailable rather than falling back to the shipped defaults, so the
      // caller never writes a value the column cannot store.
      if (!isDefined(field) || !field.isActive) {
        return { recordType, available: false, badges: [] };
      }

      const options = (field.options ?? []) as {
        value: string;
        label: string;
        color: string;
        position: number;
      }[];

      return {
        recordType,
        available: true,
        badges: [...options]
          .sort((a, b) => a.position - b.position)
          .map((option) => ({
            value: option.value,
            label: option.label,
            color: option.color,
          })),
      };
    });

    return {
      badgesByRecordType,
      guidance:
        'Use exatamente os valores em `value` ao chamar set_diex_badges. Um registro pode carregar várias badges ao mesmo tempo.',
    };
  },
});
