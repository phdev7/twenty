import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  ACCESS_REQUESTS_NAVIGATION_ITEM_UNIVERSAL_IDENTIFIER,
  ACCESS_REQUESTS_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/modules/access-requests/constants/access-request.constants';

// Top level rather than inside the Diex folder: this is the queue that decides
// who becomes a customer, and it only matters on the operator's own workspace.
export default defineNavigationMenuItem({
  universalIdentifier: ACCESS_REQUESTS_NAVIGATION_ITEM_UNIVERSAL_IDENTIFIER,
  name: 'Solicitações de acesso',
  type: NavigationMenuItemType.VIEW,
  icon: 'IconUserQuestion',
  color: 'yellow',
  position: -4,
  viewUniversalIdentifier: ACCESS_REQUESTS_VIEW_UNIVERSAL_IDENTIFIER,
});
