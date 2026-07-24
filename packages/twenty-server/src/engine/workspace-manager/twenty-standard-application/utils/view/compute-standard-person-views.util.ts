import { ViewType, ViewKey } from 'twenty-shared/types';

import { type FlatView } from 'src/engine/metadata-modules/flat-view/types/flat-view.type';
import {
  createStandardViewFlatMetadata,
  type CreateStandardViewArgs,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/view/create-standard-view-flat-metadata.util';

export const computeStandardPersonViews = (
  args: Omit<CreateStandardViewArgs<'person'>, 'context'>,
): Record<string, FlatView> => {
  return {
    allPeople: createStandardViewFlatMetadata({
      ...args,
      objectName: 'person',
      context: {
        viewName: 'allPeople',
        name: 'Todas as {objectLabelPlural}',
        type: ViewType.TABLE,
        key: ViewKey.INDEX,
        position: 0,
        icon: 'IconList',
      },
    }),
    personRecordPageFields: createStandardViewFlatMetadata({
      ...args,
      objectName: 'person',
      context: {
        viewName: 'personRecordPageFields',
        name: 'Campos da pessoa',
        type: ViewType.FIELDS_WIDGET,
        key: null,
        position: 0,
        icon: 'IconList',
      },
    }),
  };
};
