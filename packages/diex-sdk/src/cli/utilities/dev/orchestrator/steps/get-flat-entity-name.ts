import { type SyncAction } from 'diex-shared/metadata';

export const getFlatEntityName = (
  flatEntity: SyncAction['flatEntity'],
): string | null => {
  const universalIdentifier = flatEntity?.universalIdentifier;

  return (
    flatEntity?.name ??
    flatEntity?.nameSingular ??
    (typeof universalIdentifier === 'string' ? universalIdentifier : null)
  );
};
