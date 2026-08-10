import { AggregateOperations, ViewType, ViewKey } from 'diex-shared/types';

import { type FlatView } from 'src/engine/metadata-modules/flat-view/types/flat-view.type';

import {
  createStandardViewFlatMetadata,
  type CreateStandardViewArgs,
} from 'src/engine/workspace-manager/diex-standard-application/utils/view/create-standard-view-flat-metadata.util';

export const computeStandardOpportunityViews = (
  args: Omit<CreateStandardViewArgs<'opportunity'>, 'context'>,
): Record<string, FlatView> => {
  return {
    allOpportunities: createStandardViewFlatMetadata({
      ...args,
      objectName: 'opportunity',
      context: {
        viewName: 'allOpportunities',
        name: 'Todas as {objectLabelPlural}',
        type: ViewType.TABLE,
        key: ViewKey.INDEX,
        position: 0,
        icon: 'IconList',
      },
    }),
    byStage: createStandardViewFlatMetadata({
      ...args,
      objectName: 'opportunity',
      context: {
        viewName: 'byStage',
        name: 'Por etapa',
        type: ViewType.KANBAN,
        key: null,
        position: 2,
        icon: 'IconLayoutKanban',
        mainGroupByFieldName: 'stage',
        kanbanAggregateOperation: AggregateOperations.SUM,
        kanbanAggregateOperationFieldName: 'amount',
      },
    }),
    opportunityRecordPageFields: createStandardViewFlatMetadata({
      ...args,
      objectName: 'opportunity',
      context: {
        viewName: 'opportunityRecordPageFields',
        name: 'Campos da oportunidade',
        type: ViewType.FIELDS_WIDGET,
        key: null,
        position: 0,
        icon: 'IconList',
      },
    }),
  };
};
