import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import { DIEX_FOLDER_UNIVERSAL_IDENTIFIER } from 'src/navigation-menu-items/diex-folder.navigation-menu-item';
import { AI_ACTION_GOVERNANCE_VIEW_UNIVERSAL_IDENTIFIER } from 'src/views/ai-action-governance.view';

export default defineNavigationMenuItem({
  universalIdentifier: 'd1e08000-0000-4000-8000-000000000006',
  type: NavigationMenuItemType.VIEW,
  icon: 'IconShieldCheck',
  position: 4,
  folderUniversalIdentifier: DIEX_FOLDER_UNIVERSAL_IDENTIFIER,
  viewUniversalIdentifier: AI_ACTION_GOVERNANCE_VIEW_UNIVERSAL_IDENTIFIER,
});
