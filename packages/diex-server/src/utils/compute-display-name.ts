import { isDefined } from 'diex-shared/utils';
import { type FullNameMetadata } from 'diex-shared/types';

export const computeDisplayName = (
  name: FullNameMetadata | null | undefined,
) => {
  if (!name) {
    return '';
  }

  return Object.values(name).filter(isDefined).join(' ');
};
