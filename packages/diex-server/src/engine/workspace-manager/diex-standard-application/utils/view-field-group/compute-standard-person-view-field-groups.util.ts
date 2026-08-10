import { type FlatViewFieldGroup } from 'src/engine/metadata-modules/flat-view-field-group/types/flat-view-field-group.type';
import {
  createStandardViewFieldGroupFlatMetadata,
  type CreateStandardViewFieldGroupArgs,
} from 'src/engine/workspace-manager/diex-standard-application/utils/view-field-group/create-standard-view-field-group-flat-metadata.util';

export const computeStandardPersonViewFieldGroups = (
  args: Omit<CreateStandardViewFieldGroupArgs<'person'>, 'context'>,
): Record<string, FlatViewFieldGroup> => {
  return {
    personRecordPageFieldsGeneral: createStandardViewFieldGroupFlatMetadata({
      ...args,
      objectName: 'person',
      context: {
        viewName: 'personRecordPageFields',
        viewFieldGroupName: 'general',
        name: 'Geral',
        position: 0,
        isVisible: true,
      },
    }),
    personRecordPageFieldsWork: createStandardViewFieldGroupFlatMetadata({
      ...args,
      objectName: 'person',
      context: {
        viewName: 'personRecordPageFields',
        viewFieldGroupName: 'work',
        name: 'Trabalho',
        position: 1,
        isVisible: true,
      },
    }),
    personRecordPageFieldsSocial: createStandardViewFieldGroupFlatMetadata({
      ...args,
      objectName: 'person',
      context: {
        viewName: 'personRecordPageFields',
        viewFieldGroupName: 'social',
        name: 'Social',
        position: 2,
        isVisible: true,
      },
    }),
    personRecordPageFieldsSystem: createStandardViewFieldGroupFlatMetadata({
      ...args,
      objectName: 'person',
      context: {
        viewName: 'personRecordPageFields',
        viewFieldGroupName: 'system',
        name: 'Sistema',
        position: 3,
        isVisible: true,
      },
    }),
  };
};
