import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import { DIEX_FOLDER_UNIVERSAL_IDENTIFIER } from 'src/navigation-menu-items/diex-folder.navigation-menu-item';
import { WORKSPACE_CONTEXT_VIEW_UNIVERSAL_IDENTIFIER } from 'src/views/workspace-context.view';

export default defineNavigationMenuItem({
  universalIdentifier: 'd1e08000-0000-4000-8000-000000000022',
  type: NavigationMenuItemType.VIEW,
  icon: 'IconBook2',
  position: 14,
  folderUniversalIdentifier: DIEX_FOLDER_UNIVERSAL_IDENTIFIER,
  viewUniversalIdentifier: WORKSPACE_CONTEXT_VIEW_UNIVERSAL_IDENTIFIER,
});
