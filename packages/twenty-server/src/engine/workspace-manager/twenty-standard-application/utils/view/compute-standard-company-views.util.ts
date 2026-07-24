import { ViewType, ViewKey } from 'twenty-shared/types';

import { type FlatView } from 'src/engine/metadata-modules/flat-view/types/flat-view.type';

import {
  createStandardViewFlatMetadata,
  type CreateStandardViewArgs,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/view/create-standard-view-flat-metadata.util';

export const computeStandardCompanyViews = (
  args: Omit<CreateStandardViewArgs<'company'>, 'context'>,
): Record<string, FlatView> => {
  return {
    allCompanies: createStandardViewFlatMetadata({
      ...args,
      objectName: 'company',
      context: {
        viewName: 'allCompanies',
        name: 'Todas as {objectLabelPlural}',
        type: ViewType.TABLE,
        key: ViewKey.INDEX,
        position: 0,
        icon: 'IconList',
      },
    }),
    companyRecordPageFields: createStandardViewFlatMetadata({
      ...args,
      objectName: 'company',
      context: {
        viewName: 'companyRecordPageFields',
        name: 'Campos da empresa',
        type: ViewType.FIELDS_WIDGET,
        key: null,
        position: 0,
        icon: 'IconList',
      },
    }),
  };
};
