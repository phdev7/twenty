import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import { DIEX_FOLDER_UNIVERSAL_IDENTIFIER } from 'src/navigation-menu-items/diex-folder.navigation-menu-item';
import { COMMERCIAL_SIGNAL_TRIAGE_VIEW_UNIVERSAL_IDENTIFIER } from 'src/views/commercial-signal-triage.view';

export default defineNavigationMenuItem({
  universalIdentifier: 'd1e08000-0000-4000-8000-000000000003',
  type: NavigationMenuItemType.VIEW,
  icon: 'IconRadar',
  position: 2,
  folderUniversalIdentifier: DIEX_FOLDER_UNIVERSAL_IDENTIFIER,
  viewUniversalIdentifier:
    COMMERCIAL_SIGNAL_TRIAGE_VIEW_UNIVERSAL_IDENTIFIER,
});
