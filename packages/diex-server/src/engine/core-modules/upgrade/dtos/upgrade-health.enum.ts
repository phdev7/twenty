import { registerEnumType } from '@nestjs/graphql';

import { UpgradeHealthEnum } from 'diex-shared/types';

export { UpgradeHealthEnum };

registerEnumType(UpgradeHealthEnum, {
  name: 'UpgradeHealth',
});
