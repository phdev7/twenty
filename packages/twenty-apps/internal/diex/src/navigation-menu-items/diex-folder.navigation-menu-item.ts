import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

export const DIEX_FOLDER_UNIVERSAL_IDENTIFIER =
  'd1e08000-0000-4000-8000-000000000001';

export default defineNavigationMenuItem({
  universalIdentifier: DIEX_FOLDER_UNIVERSAL_IDENTIFIER,
  type: NavigationMenuItemType.FOLDER,
  name: 'Cadastros Diex',
  icon: 'IconSparkles',
  color: 'purple',
  position: 20,
});
