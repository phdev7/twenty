import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import { DIEX_FOLDER_UNIVERSAL_IDENTIFIER } from 'src/navigation-menu-items/diex-folder.navigation-menu-item';
import { OFFERS_VIEW_UNIVERSAL_IDENTIFIER } from 'src/views/offers.view';

export default defineNavigationMenuItem({
  universalIdentifier: 'd1e08000-0000-4000-8000-000000000002',
  type: NavigationMenuItemType.VIEW,
  icon: 'IconPackage',
  position: 2,
  folderUniversalIdentifier: DIEX_FOLDER_UNIVERSAL_IDENTIFIER,
  viewUniversalIdentifier: OFFERS_VIEW_UNIVERSAL_IDENTIFIER,
});
