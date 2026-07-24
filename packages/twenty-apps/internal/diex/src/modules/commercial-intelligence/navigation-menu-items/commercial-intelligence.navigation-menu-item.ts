import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  COMMERCIAL_INTELLIGENCE_NAVIGATION_ITEM_UNIVERSAL_IDENTIFIER,
  COMMERCIAL_INTELLIGENCE_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
} from 'src/modules/commercial-intelligence/constants/commercial-intelligence.constants';
import { DIEX_FOLDER_UNIVERSAL_IDENTIFIER } from 'src/navigation-menu-items/diex-folder.navigation-menu-item';

export default defineNavigationMenuItem({
  universalIdentifier:
    COMMERCIAL_INTELLIGENCE_NAVIGATION_ITEM_UNIVERSAL_IDENTIFIER,
  name: 'Inteligência',
  type: NavigationMenuItemType.PAGE_LAYOUT,
  icon: 'IconRadar',
  color: 'blue',
  position: 0,
  folderUniversalIdentifier: DIEX_FOLDER_UNIVERSAL_IDENTIFIER,
  pageLayoutUniversalIdentifier:
    COMMERCIAL_INTELLIGENCE_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
});
