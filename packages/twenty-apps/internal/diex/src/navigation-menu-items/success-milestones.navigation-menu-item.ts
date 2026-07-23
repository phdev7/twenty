import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import { DIEX_FOLDER_UNIVERSAL_IDENTIFIER } from 'src/navigation-menu-items/diex-folder.navigation-menu-item';
import { SUCCESS_MILESTONES_VIEW_UNIVERSAL_IDENTIFIER } from 'src/views/success-milestones.view';

export default defineNavigationMenuItem({
  universalIdentifier: 'd1e08000-0000-4000-8000-000000000005',
  type: NavigationMenuItemType.VIEW,
  icon: 'IconFlag3',
  position: 4,
  folderUniversalIdentifier: DIEX_FOLDER_UNIVERSAL_IDENTIFIER,
  viewUniversalIdentifier: SUCCESS_MILESTONES_VIEW_UNIVERSAL_IDENTIFIER,
});
