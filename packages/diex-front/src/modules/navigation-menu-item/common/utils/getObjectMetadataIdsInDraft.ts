import { NavigationMenuItemType } from 'diex-shared/types';
import { isDefined } from 'diex-shared/utils';
import { type NavigationMenuItem } from '~/generated-metadata/graphql';

export const getObjectMetadataIdsInDraft = (
  draft: Pick<NavigationMenuItem, 'type' | 'targetObjectMetadataId'>[],
): Set<string> =>
  draft.reduce<Set<string>>((ids, item) => {
    if (item.type !== NavigationMenuItemType.OBJECT) {
      return ids;
    }

    if (isDefined(item.targetObjectMetadataId)) {
      ids.add(item.targetObjectMetadataId);
    }

    return ids;
  }, new Set<string>());
