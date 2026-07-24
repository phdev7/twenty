import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  RENEWAL_COMMAND_CENTER_NAVIGATION_ITEM_UNIVERSAL_IDENTIFIER,
  RENEWAL_COMMAND_CENTER_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
} from 'src/modules/renewal-command-center/constants/renewal-command-center.constants';

export default defineNavigationMenuItem({
  universalIdentifier:
    RENEWAL_COMMAND_CENTER_NAVIGATION_ITEM_UNIVERSAL_IDENTIFIER,
  name: 'Renovações',
  type: NavigationMenuItemType.PAGE_LAYOUT,
  icon: 'IconRefreshDot',
  color: 'green',
  position: -1,
  pageLayoutUniversalIdentifier:
    RENEWAL_COMMAND_CENTER_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
});
