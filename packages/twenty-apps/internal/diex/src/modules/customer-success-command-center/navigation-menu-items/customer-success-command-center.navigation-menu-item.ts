import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  CUSTOMER_SUCCESS_COMMAND_CENTER_NAVIGATION_ITEM_UNIVERSAL_IDENTIFIER,
  CUSTOMER_SUCCESS_COMMAND_CENTER_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
} from 'src/modules/customer-success-command-center/constants/customer-success-command-center.constants';

export default defineNavigationMenuItem({
  universalIdentifier:
    CUSTOMER_SUCCESS_COMMAND_CENTER_NAVIGATION_ITEM_UNIVERSAL_IDENTIFIER,
  name: 'Customer Success',
  type: NavigationMenuItemType.PAGE_LAYOUT,
  icon: 'IconHeartHandshake',
  color: 'blue',
  position: -2,
  pageLayoutUniversalIdentifier:
    CUSTOMER_SUCCESS_COMMAND_CENTER_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
});
