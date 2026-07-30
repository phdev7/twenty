import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  ONBOARDING_NAVIGATION_ITEM_UNIVERSAL_IDENTIFIER,
  ONBOARDING_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
} from 'src/modules/onboarding/constants/onboarding.constants';

// Sits above the inbox: on a fresh workspace the inbox is empty and says
// nothing about why, and this is the page that explains it.
export default defineNavigationMenuItem({
  universalIdentifier: ONBOARDING_NAVIGATION_ITEM_UNIVERSAL_IDENTIFIER,
  name: 'Primeiros passos',
  type: NavigationMenuItemType.PAGE_LAYOUT,
  icon: 'IconRocket',
  color: 'purple',
  position: -6,
  pageLayoutUniversalIdentifier: ONBOARDING_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
});
