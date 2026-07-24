import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import { INBOX_AUTOMATIONS_VIEW_UNIVERSAL_IDENTIFIER } from 'src/modules/inbox/constants/inbox-automation.constants';
import { DIEX_FOLDER_UNIVERSAL_IDENTIFIER } from 'src/navigation-menu-items/diex-folder.navigation-menu-item';

export default defineNavigationMenuItem({
  universalIdentifier: 'd1e0fd50-0000-4000-8000-000000000001',
  type: NavigationMenuItemType.VIEW,
  icon: 'IconSettingsAutomation',
  position: 14,
  folderUniversalIdentifier: DIEX_FOLDER_UNIVERSAL_IDENTIFIER,
  viewUniversalIdentifier: INBOX_AUTOMATIONS_VIEW_UNIVERSAL_IDENTIFIER,
});
