import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  COMMERCIAL_INTELLIGENCE_NAVIGATION_ITEM_UNIVERSAL_IDENTIFIER,
  COMMERCIAL_INTELLIGENCE_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
} from 'src/modules/commercial-intelligence/constants/commercial-intelligence.constants';

export default defineNavigationMenuItem({
  universalIdentifier:
    COMMERCIAL_INTELLIGENCE_NAVIGATION_ITEM_UNIVERSAL_IDENTIFIER,
  name: 'Inteligência Comercial',
  type: NavigationMenuItemType.PAGE_LAYOUT,
  icon: 'IconRadar',
  color: 'blue',
  position: -4,
  pageLayoutUniversalIdentifier:
    COMMERCIAL_INTELLIGENCE_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
});
