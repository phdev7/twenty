import { type ObjectRecord } from 'diex-shared/types';
import { fastDeepEqual } from 'diex-shared/utils';

import { type BaseWorkspaceEntity } from 'src/engine/diex-orm/base.workspace-entity';

export const objectRecordChangedProperties = <
  PRecord extends Partial<ObjectRecord | BaseWorkspaceEntity> =
    Partial<ObjectRecord>,
>(
  oldRecord: PRecord,
  newRecord: PRecord,
) => {
  const changedProperties = Object.keys(newRecord).filter(
    // @ts-expect-error legacy noImplicitAny
    (key) => !fastDeepEqual(oldRecord[key], newRecord[key]),
  );

  return changedProperties;
};
