import { currentUserState } from '@/auth/states/currentUserState';
import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { type DiexPageCatalogState } from '@/diex-onboarding/types/diexOnboardingTypes';
import { getDiexOnboardingRoute } from '@/diex-onboarding/utils/diexOnboardingApi';
import { metadataStoreState } from '@/metadata-store/states/metadataStoreState';
import { metadataStoreStatusFamilySelector } from '@/metadata-store/states/metadataStoreStatusFamilySelector';
import { useNavigationMenuItemSectionItems } from '@/navigation-menu-item/display/hooks/useNavigationMenuItemSectionItems';
import { type ObjectPathInfo } from '@/navigation/types/ObjectPathInfo';
import { getFirstNavigationMenuItemLink } from '@/navigation/utils/getFirstNavigationMenuItemLink';
import { useFilteredObjectMetadataItems } from '@/object-metadata/hooks/useFilteredObjectMetadataItems';
import { objectMetadataItemsSelector } from '@/object-metadata/states/objectMetadataItemsSelector';
import { filterReadableActiveObjectMetadataItems } from '@/object-metadata/utils/filterReadableActiveObjectMetadataItems';
import { useObjectPermissions } from '@/object-record/hooks/useObjectPermissions';
import { useAtomFamilySelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilySelectorValue';
import { useAtomFamilyStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilyStateValue';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { viewsSelector } from '@/views/states/selectors/viewsSelector';
import isEmpty from 'lodash.isempty';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppPath, SettingsPath } from 'diex-shared/types';
import { getAppPath, getSettingsPath, isDefined } from 'diex-shared/utils';
import { OnboardingStatus } from '~/generated-metadata/graphql';

const DIEX_PAGE_CATALOG_PATH = '/diex/pages';

export const useDefaultHomePagePath = () => {
  const currentUser = useAtomStateValue(currentUserState);
  const currentWorkspace = useAtomStateValue(currentWorkspaceState);
  const [adaptiveHomePath, setAdaptiveHomePath] = useState<
    string | null | undefined
  >(undefined);
  const { objectPermissionsByObjectMetadataId } = useObjectPermissions();
  const metadataStore = useAtomFamilyStateValue(
    metadataStoreState,
    'objectMetadataItems',
  );
  const areObjectMetadataItemsLoaded = metadataStore.status === 'up-to-date';
  const navigationMenuItemsStatus = useAtomFamilySelectorValue(
    metadataStoreStatusFamilySelector,
    'navigationMenuItems',
  );
  const areNavigationMenuItemsLoaded =
    navigationMenuItemsStatus === 'up-to-date';

  const { activeObjectMetadataItems } = useFilteredObjectMetadataItems();
  const objectMetadataItems = useAtomStateValue(objectMetadataItemsSelector);
  const views = useAtomStateValue(viewsSelector);
  const navigationMenuItemsInDisplayOrder = useNavigationMenuItemSectionItems();

  useEffect(() => {
    if (currentUser?.onboardingStatus !== OnboardingStatus.COMPLETED) {
      setAdaptiveHomePath(null);
      return;
    }

    if (!areObjectMetadataItemsLoaded || !areNavigationMenuItemsLoaded) {
      setAdaptiveHomePath(undefined);
      return;
    }

    let cancelled = false;

    const loadAdaptiveHome = async () => {
      try {
        const catalog = await getDiexOnboardingRoute<DiexPageCatalogState>(
          '/rest/diex/onboarding/pages',
        );
        const activePages = catalog.items
          .filter(
            ({ key, showInNavigation, status, route }) =>
              key !== 'first-steps' &&
              showInNavigation &&
              status === 'ACTIVE' &&
              route.startsWith('/') &&
              !route.startsWith('//'),
          )
          .sort((left, right) => left.position - right.position);
        const homePage =
          activePages.find(({ renderer }) => renderer === 'DASHBOARD') ??
          activePages[0];

        if (!cancelled) {
          setAdaptiveHomePath(homePage?.route ?? DIEX_PAGE_CATALOG_PATH);
        }
      } catch {
        if (!cancelled) {
          setAdaptiveHomePath(DIEX_PAGE_CATALOG_PATH);
        }
      }
    };
    const handleCatalogUpdate = () => {
      void loadAdaptiveHome();
    };

    setAdaptiveHomePath(undefined);
    void loadAdaptiveHome();
    window.addEventListener('diex-onboarding-updated', handleCatalogUpdate);

    return () => {
      cancelled = true;
      window.removeEventListener(
        'diex-onboarding-updated',
        handleCatalogUpdate,
      );
    };
  }, [
    areNavigationMenuItemsLoaded,
    areObjectMetadataItemsLoaded,
    currentUser?.onboardingStatus,
    currentWorkspace?.id,
  ]);

  const readableNonSystemObjectMetadataItems = useMemo(
    () =>
      filterReadableActiveObjectMetadataItems(
        activeObjectMetadataItems,
        objectPermissionsByObjectMetadataId,
      )
        .filter((item) => !item.isSystem)
        .sort((a, b) => a.nameSingular.localeCompare(b.nameSingular)),
    [activeObjectMetadataItems, objectPermissionsByObjectMetadataId],
  );

  const getFirstView = useCallback(
    (objectMetadataItemId: string | undefined | null) => {
      return views.find(
        (view) => view.objectMetadataId === objectMetadataItemId,
      );
    },
    [views],
  );

  const firstNavigationMenuItemLink = useMemo(
    () =>
      getFirstNavigationMenuItemLink({
        navigationMenuItemsInDisplayOrder,
        objectMetadataItems,
        views,
        objectPermissionsByObjectMetadataId,
      }),
    [
      objectMetadataItems,
      objectPermissionsByObjectMetadataId,
      views,
      navigationMenuItemsInDisplayOrder,
    ],
  );

  const firstObjectPathInfo = useMemo<ObjectPathInfo | null>(() => {
    const [firstObjectMetadataItem] = readableNonSystemObjectMetadataItems;

    if (!isDefined(firstObjectMetadataItem)) {
      return null;
    }

    const view = getFirstView(firstObjectMetadataItem.id);

    return { objectMetadataItem: firstObjectMetadataItem, view };
  }, [getFirstView, readableNonSystemObjectMetadataItems]);

  const defaultHomePagePath = useMemo(() => {
    if (!isDefined(currentUser)) {
      return AppPath.SignInUp;
    }

    // Both stores are transiently empty during the post-login window;
    // deciding the redirect before they are loaded could strand users on a
    // wrong fallback (/settings/profile or the alphabetically-first object).
    if (!areObjectMetadataItemsLoaded || !areNavigationMenuItemsLoaded) {
      return AppPath.Index;
    }

    if (currentUser.onboardingStatus === OnboardingStatus.COMPLETED) {
      return adaptiveHomePath === undefined
        ? AppPath.Index
        : (adaptiveHomePath ?? DIEX_PAGE_CATALOG_PATH);
    }

    if (isEmpty(readableNonSystemObjectMetadataItems)) {
      return getSettingsPath(SettingsPath.ProfilePage);
    }

    if (isDefined(firstNavigationMenuItemLink)) {
      return firstNavigationMenuItemLink;
    }

    if (!isDefined(firstObjectPathInfo)) {
      return AppPath.NotFound;
    }

    return getAppPath(
      AppPath.RecordIndexPage,
      { objectNamePlural: firstObjectPathInfo.objectMetadataItem?.namePlural },
      firstObjectPathInfo.view?.id
        ? { viewId: firstObjectPathInfo.view.id }
        : undefined,
    );
  }, [
    currentUser,
    adaptiveHomePath,
    readableNonSystemObjectMetadataItems,
    areObjectMetadataItemsLoaded,
    areNavigationMenuItemsLoaded,
    firstNavigationMenuItemLink,
    firstObjectPathInfo,
  ]);

  return { defaultHomePagePath };
};
