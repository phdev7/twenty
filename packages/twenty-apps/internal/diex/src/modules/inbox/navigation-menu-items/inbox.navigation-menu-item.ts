import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  INBOX_NAVIGATION_ITEM_UNIVERSAL_IDENTIFIER,
  INBOX_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
} from 'src/modules/inbox/constants/inbox-universal-identifiers';
import { DIEX_FOLDER_UNIVERSAL_IDENTIFIER } from 'src/navigation-menu-items/diex-folder.navigation-menu-item';

export default defineNavigationMenuItem({
  universalIdentifier: INBOX_NAVIGATION_ITEM_UNIVERSAL_IDENTIFIER,
  name: 'Inbox',
  type: NavigationMenuItemType.PAGE_LAYOUT,
  icon: 'IconInbox',
  color: 'green',
  position: -1,
  folderUniversalIdentifier: DIEX_FOLDER_UNIVERSAL_IDENTIFIER,
  pageLayoutUniversalIdentifier: INBOX_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
});
