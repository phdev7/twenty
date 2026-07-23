import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import { AI_ACTION_UNIVERSAL_IDENTIFIER } from 'src/objects/ai-action.object';
import { COMMERCIAL_SIGNAL_UNIVERSAL_IDENTIFIER } from 'src/objects/commercial-signal.object';

export const COMMERCIAL_SIGNAL_ON_AI_ACTION_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e06000-0000-4000-8000-000000000032';
export const AI_ACTIONS_ON_COMMERCIAL_SIGNAL_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e06000-0000-4000-8000-000000000033';

export default defineField({
  universalIdentifier:
    COMMERCIAL_SIGNAL_ON_AI_ACTION_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: AI_ACTION_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'commercialSignal',
  label: 'Sinal comercial',
  icon: 'IconRadar',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier:
    COMMERCIAL_SIGNAL_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    AI_ACTIONS_ON_COMMERCIAL_SIGNAL_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'commercialSignalId',
  },
});
