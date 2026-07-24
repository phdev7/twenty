import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  INBOX_NAVIGATION_ITEM_UNIVERSAL_IDENTIFIER,
  INBOX_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
} from 'src/modules/inbox/constants/inbox-universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: INBOX_NAVIGATION_ITEM_UNIVERSAL_IDENTIFIER,
  name: 'Inbox Comercial',
  type: NavigationMenuItemType.PAGE_LAYOUT,
  icon: 'IconInbox',
  color: 'green',
  position: -5,
  pageLayoutUniversalIdentifier: INBOX_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
});
