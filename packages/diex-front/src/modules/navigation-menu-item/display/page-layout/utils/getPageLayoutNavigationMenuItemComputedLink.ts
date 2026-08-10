import { AppPath } from 'diex-shared/types';
import { getAppPath, isDefined } from 'diex-shared/utils';
import { type NavigationMenuItem } from '~/generated-metadata/graphql';

export const getPageLayoutNavigationMenuItemComputedLink = (
  item: Pick<NavigationMenuItem, 'pageLayoutId' | 'name'>,
): string => {
  if (item.name === 'Primeiros passos') {
    return '/diex/pages/first-steps';
  }

  if (!isDefined(item.pageLayoutId)) {
    return '';
  }

  return getAppPath(AppPath.PageLayoutPage, {
    pageLayoutId: item.pageLayoutId,
  });
};
