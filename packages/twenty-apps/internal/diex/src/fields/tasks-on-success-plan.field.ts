import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  SUCCESS_PLAN_ON_TASK_FIELD_UNIVERSAL_IDENTIFIER,
  TASKS_ON_SUCCESS_PLAN_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/fields/success-plan-on-task.field';
import { SUCCESS_PLAN_UNIVERSAL_IDENTIFIER } from 'src/objects/success-plan.object';

export default defineField({
  universalIdentifier: TASKS_ON_SUCCESS_PLAN_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: SUCCESS_PLAN_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'operationalTasks',
  label: 'Tarefas operacionais',
  description: 'Trabalho de entrega e adoção vinculado a este plano.',
  icon: 'IconChecklist',
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.task.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    SUCCESS_PLAN_ON_TASK_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
