import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import { INBOX_MACROS_VIEW_UNIVERSAL_IDENTIFIER } from 'src/modules/inbox/constants/inbox-macro.constants';
import { DIEX_FOLDER_UNIVERSAL_IDENTIFIER } from 'src/navigation-menu-items/diex-folder.navigation-menu-item';

export default defineNavigationMenuItem({
  universalIdentifier: 'd1e0fb50-0000-4000-8000-000000000001',
  type: NavigationMenuItemType.VIEW,
  icon: 'IconWand',
  position: 13,
  folderUniversalIdentifier: DIEX_FOLDER_UNIVERSAL_IDENTIFIER,
  viewUniversalIdentifier: INBOX_MACROS_VIEW_UNIVERSAL_IDENTIFIER,
});
