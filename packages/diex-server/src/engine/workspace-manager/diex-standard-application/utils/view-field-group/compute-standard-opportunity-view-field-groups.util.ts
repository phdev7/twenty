import { type FlatViewFieldGroup } from 'src/engine/metadata-modules/flat-view-field-group/types/flat-view-field-group.type';
import {
  createStandardViewFieldGroupFlatMetadata,
  type CreateStandardViewFieldGroupArgs,
} from 'src/engine/workspace-manager/diex-standard-application/utils/view-field-group/create-standard-view-field-group-flat-metadata.util';

export const computeStandardOpportunityViewFieldGroups = (
  args: Omit<CreateStandardViewFieldGroupArgs<'opportunity'>, 'context'>,
): Record<string, FlatViewFieldGroup> => {
  return {
    opportunityRecordPageFieldsDeal: createStandardViewFieldGroupFlatMetadata({
      ...args,
      objectName: 'opportunity',
      context: {
        viewName: 'opportunityRecordPageFields',
        viewFieldGroupName: 'deal',
        name: 'Negócio',
        position: 0,
        isVisible: true,
      },
    }),
    opportunityRecordPageFieldsRelations:
      createStandardViewFieldGroupFlatMetadata({
        ...args,
        objectName: 'opportunity',
        context: {
          viewName: 'opportunityRecordPageFields',
          viewFieldGroupName: 'relations',
          name: 'Relações',
          position: 1,
          isVisible: true,
        },
      }),
    opportunityRecordPageFieldsSystem: createStandardViewFieldGroupFlatMetadata(
      {
        ...args,
        objectName: 'opportunity',
        context: {
          viewName: 'opportunityRecordPageFields',
          viewFieldGroupName: 'system',
          name: 'Sistema',
          position: 2,
          isVisible: true,
        },
      },
    ),
  };
};
