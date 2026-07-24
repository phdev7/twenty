import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import { INBOX_LABELS_VIEW_UNIVERSAL_IDENTIFIER } from 'src/modules/inbox/constants/inbox-label.constants';
import { DIEX_FOLDER_UNIVERSAL_IDENTIFIER } from 'src/navigation-menu-items/diex-folder.navigation-menu-item';

export default defineNavigationMenuItem({
  universalIdentifier: 'd1e0e300-0000-4000-8000-000000000001',
  type: NavigationMenuItemType.VIEW,
  icon: 'IconTags',
  position: 9,
  folderUniversalIdentifier: DIEX_FOLDER_UNIVERSAL_IDENTIFIER,
  viewUniversalIdentifier: INBOX_LABELS_VIEW_UNIVERSAL_IDENTIFIER,
});
