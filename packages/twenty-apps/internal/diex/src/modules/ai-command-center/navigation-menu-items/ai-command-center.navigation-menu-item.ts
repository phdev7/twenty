import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  AI_COMMAND_CENTER_NAVIGATION_ITEM_UNIVERSAL_IDENTIFIER,
  AI_COMMAND_CENTER_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
} from 'src/modules/ai-command-center/constants/ai-command-center.constants';
import { DIEX_FOLDER_UNIVERSAL_IDENTIFIER } from 'src/navigation-menu-items/diex-folder.navigation-menu-item';

export default defineNavigationMenuItem({
  universalIdentifier: AI_COMMAND_CENTER_NAVIGATION_ITEM_UNIVERSAL_IDENTIFIER,
  name: 'Centro de IA',
  type: NavigationMenuItemType.PAGE_LAYOUT,
  icon: 'IconRobot',
  color: 'blue',
  position: 3,
  folderUniversalIdentifier: DIEX_FOLDER_UNIVERSAL_IDENTIFIER,
  pageLayoutUniversalIdentifier:
    AI_COMMAND_CENTER_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
});
