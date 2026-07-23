import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import { DIEX_FOLDER_UNIVERSAL_IDENTIFIER } from 'src/navigation-menu-items/diex-folder.navigation-menu-item';
import { CUSTOMER_SUCCESS_PORTFOLIO_VIEW_UNIVERSAL_IDENTIFIER } from 'src/views/customer-success-portfolio.view';

export default defineNavigationMenuItem({
  universalIdentifier: 'd1e08000-0000-4000-8000-000000000004',
  type: NavigationMenuItemType.VIEW,
  icon: 'IconHeartHandshake',
  position: 3,
  folderUniversalIdentifier: DIEX_FOLDER_UNIVERSAL_IDENTIFIER,
  viewUniversalIdentifier:
    CUSTOMER_SUCCESS_PORTFOLIO_VIEW_UNIVERSAL_IDENTIFIER,
});
