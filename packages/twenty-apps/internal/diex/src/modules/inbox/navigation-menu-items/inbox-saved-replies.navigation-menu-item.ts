import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import { DIEX_FOLDER_UNIVERSAL_IDENTIFIER } from 'src/navigation-menu-items/diex-folder.navigation-menu-item';
import { INBOX_SAVED_REPLIES_VIEW_UNIVERSAL_IDENTIFIER } from 'src/modules/inbox/views/inbox-saved-replies.view';

export default defineNavigationMenuItem({
  universalIdentifier: 'd1e0d300-0000-4000-8000-000000000001',
  type: NavigationMenuItemType.VIEW,
  icon: 'IconBolt',
  position: 0,
  folderUniversalIdentifier: DIEX_FOLDER_UNIVERSAL_IDENTIFIER,
  viewUniversalIdentifier: INBOX_SAVED_REPLIES_VIEW_UNIVERSAL_IDENTIFIER,
});
