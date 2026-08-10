import { type ObjectRecord as SharedObjectRecord } from 'diex-shared/types';

export type BaseObjectRecord = SharedObjectRecord & {
  __typename: string;
};
