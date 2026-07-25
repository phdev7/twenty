import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import { OPERATIONAL_TASKS_VIEW_UNIVERSAL_IDENTIFIER } from 'src/views/operational-tasks.view';

export default defineNavigationMenuItem({
  universalIdentifier: 'd1e08000-0000-4000-8000-000000000021',
  type: NavigationMenuItemType.VIEW,
  icon: 'IconChecklist',
  position: 13,
  viewUniversalIdentifier: OPERATIONAL_TASKS_VIEW_UNIVERSAL_IDENTIFIER,
});
