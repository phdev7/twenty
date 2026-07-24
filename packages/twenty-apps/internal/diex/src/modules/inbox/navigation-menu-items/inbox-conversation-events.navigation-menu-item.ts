import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import { INBOX_CONVERSATION_EVENTS_VIEW_UNIVERSAL_IDENTIFIER } from 'src/modules/inbox/constants/inbox-conversation-event.constants';
import { DIEX_FOLDER_UNIVERSAL_IDENTIFIER } from 'src/navigation-menu-items/diex-folder.navigation-menu-item';

export default defineNavigationMenuItem({
  universalIdentifier: 'd1e0fc50-0000-4000-8000-000000000001',
  type: NavigationMenuItemType.VIEW,
  icon: 'IconTimelineEvent',
  position: 14,
  folderUniversalIdentifier: DIEX_FOLDER_UNIVERSAL_IDENTIFIER,
  viewUniversalIdentifier: INBOX_CONVERSATION_EVENTS_VIEW_UNIVERSAL_IDENTIFIER,
});
