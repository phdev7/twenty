import {
  defineView,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
  ViewFilterOperand,
  ViewType,
} from 'twenty-sdk/define';

import {
  TASK_CATEGORY_FIELD_UNIVERSAL_IDENTIFIER,
  TASK_CATEGORY_OPERATIONAL,
} from 'src/fields/task-category.field';

export const OPERATIONAL_TASKS_VIEW_UNIVERSAL_IDENTIFIER =
  'd1e07000-0000-4000-8000-000000000011';

export default defineView({
  universalIdentifier: OPERATIONAL_TASKS_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Tarefas operacionais',
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.task.universalIdentifier,
  type: ViewType.KANBAN,
  icon: 'IconChecklist',
  position: 11,
  mainGroupByFieldMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.task.fields.status
      .universalIdentifier,
  filters: [
    {
      universalIdentifier: 'd1e07610-0000-4000-8000-000000000002',
      fieldMetadataUniversalIdentifier:
        TASK_CATEGORY_FIELD_UNIVERSAL_IDENTIFIER,
      operand: ViewFilterOperand.IS,
      value: [TASK_CATEGORY_OPERATIONAL],
    },
  ],
});
