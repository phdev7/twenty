import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import { COMMERCIAL_TASKS_VIEW_UNIVERSAL_IDENTIFIER } from 'src/views/commercial-tasks.view';

// Commercial work sits outside the Diex folder on purpose: it is the daily
// queue for the sales team, not a back-office area.
export default defineNavigationMenuItem({
  universalIdentifier: 'd1e08000-0000-4000-8000-000000000020',
  type: NavigationMenuItemType.VIEW,
  icon: 'IconTargetArrow',
  position: 12,
  viewUniversalIdentifier: COMMERCIAL_TASKS_VIEW_UNIVERSAL_IDENTIFIER,
});
