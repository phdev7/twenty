import { registerEnumType } from '@nestjs/graphql';

import { EventLogTable } from 'diex-shared/types';

export const registerEventLogTableEnum = () => {
  registerEnumType(EventLogTable, {
    name: 'EventLogTable',
  });
};
