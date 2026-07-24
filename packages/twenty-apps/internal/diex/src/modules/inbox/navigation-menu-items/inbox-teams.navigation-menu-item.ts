import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import { INBOX_TEAMS_VIEW_UNIVERSAL_IDENTIFIER } from 'src/modules/inbox/constants/inbox-team.constants';
import { DIEX_FOLDER_UNIVERSAL_IDENTIFIER } from 'src/navigation-menu-items/diex-folder.navigation-menu-item';

export default defineNavigationMenuItem({
  universalIdentifier: 'd1e0f730-0000-4000-8000-000000000001',
  type: NavigationMenuItemType.VIEW,
  icon: 'IconUsersGroup',
  position: 10,
  folderUniversalIdentifier: DIEX_FOLDER_UNIVERSAL_IDENTIFIER,
  viewUniversalIdentifier: INBOX_TEAMS_VIEW_UNIVERSAL_IDENTIFIER,
});
