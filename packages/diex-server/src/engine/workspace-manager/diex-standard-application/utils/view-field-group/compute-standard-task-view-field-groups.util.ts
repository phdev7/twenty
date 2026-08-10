import { type FlatViewFieldGroup } from 'src/engine/metadata-modules/flat-view-field-group/types/flat-view-field-group.type';
import {
  createStandardViewFieldGroupFlatMetadata,
  type CreateStandardViewFieldGroupArgs,
} from 'src/engine/workspace-manager/diex-standard-application/utils/view-field-group/create-standard-view-field-group-flat-metadata.util';

export const computeStandardTaskViewFieldGroups = (
  args: Omit<CreateStandardViewFieldGroupArgs<'task'>, 'context'>,
): Record<string, FlatViewFieldGroup> => {
  return {
    taskRecordPageFieldsGeneral: createStandardViewFieldGroupFlatMetadata({
      ...args,
      objectName: 'task',
      context: {
        viewName: 'taskRecordPageFields',
        viewFieldGroupName: 'general',
        name: 'Geral',
        position: 0,
        isVisible: true,
      },
    }),
    taskRecordPageFieldsSystem: createStandardViewFieldGroupFlatMetadata({
      ...args,
      objectName: 'task',
      context: {
        viewName: 'taskRecordPageFields',
        viewFieldGroupName: 'system',
        name: 'Sistema',
        position: 1,
        isVisible: true,
      },
    }),
  };
};
