import { ViewType, ViewKey } from 'diex-shared/types';

import { type FlatView } from 'src/engine/metadata-modules/flat-view/types/flat-view.type';

import {
  createStandardViewFlatMetadata,
  type CreateStandardViewArgs,
} from 'src/engine/workspace-manager/diex-standard-application/utils/view/create-standard-view-flat-metadata.util';

export const computeStandardWorkflowViews = (
  args: Omit<CreateStandardViewArgs<'workflow'>, 'context'>,
): Record<string, FlatView> => {
  return {
    allWorkflows: createStandardViewFlatMetadata({
      ...args,
      objectName: 'workflow',
      context: {
        viewName: 'allWorkflows',
        name: 'Todas as {objectLabelPlural}',
        type: ViewType.TABLE,
        key: ViewKey.INDEX,
        position: 0,
        icon: 'IconTable',
      },
    }),
  };
};
