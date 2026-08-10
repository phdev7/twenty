import { registerEnumType } from '@nestjs/graphql';

import { NavigationMenuItemType } from 'diex-shared/types';

registerEnumType(NavigationMenuItemType, {
  name: 'NavigationMenuItemType',
});

export { NavigationMenuItemType };
