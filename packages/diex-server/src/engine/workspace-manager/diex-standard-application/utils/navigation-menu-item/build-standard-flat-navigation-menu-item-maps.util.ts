import { v4 } from 'uuid';

import { createEmptyFlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/constant/create-empty-flat-entity-maps.constant';
import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { findFlatEntityByUniversalIdentifier } from 'src/engine/metadata-modules/flat-entity/utils/find-flat-entity-by-universal-identifier.util';
import { type FlatNavigationMenuItemMaps } from 'src/engine/metadata-modules/flat-navigation-menu-item/types/flat-navigation-menu-item-maps.type';
import { type FlatNavigationMenuItem } from 'src/engine/metadata-modules/flat-navigation-menu-item/types/flat-navigation-menu-item.type';
import { addFlatNavigationMenuItemToMapsAndUpdateIndex } from 'src/engine/metadata-modules/flat-navigation-menu-item/utils/add-flat-navigation-menu-item-to-maps-and-update-index.util';
import { type FlatPageLayout } from 'src/engine/metadata-modules/flat-page-layout/types/flat-page-layout.type';
import { NavigationMenuItemType } from 'src/engine/metadata-modules/navigation-menu-item/enums/navigation-menu-item-type.enum';
import { type FlatView } from 'src/engine/metadata-modules/flat-view/types/flat-view.type';
import {
  STANDARD_NAVIGATION_MENU_ITEMS,
  type StandardNavigationMenuItemDefinition,
} from 'src/engine/workspace-manager/diex-standard-application/constants/standard-navigation-menu-item.constant';
import { DIEX_STANDARD_APPLICATION } from 'src/engine/workspace-manager/diex-standard-application/constants/diex-standard-applications';
import { createStandardNavigationMenuItemFlatMetadata } from 'src/engine/workspace-manager/diex-standard-application/utils/navigation-menu-item/create-standard-navigation-menu-item-flat-metadata.util';
import {
  createStandardNavigationMenuItemFolderFlatMetadata,
  createStandardNavigationMenuItemFolderItemFlatMetadata,
} from 'src/engine/workspace-manager/diex-standard-application/utils/navigation-menu-item/create-standard-navigation-menu-item-folder-flat-metadata.util';

const FLAT_NAVIGATION_MENU_ITEM_NAMES = [
  'allCompanies',
  'allDashboards',
  'allNotes',
  'allOpportunities',
  'allPeople',
  'allTasks',
] as const;

const WORKFLOWS_FOLDER_ITEM_NAMES = [
  'workflowsFolderAllWorkflows',
  'workflowsFolderAllWorkflowRuns',
  'workflowsFolderAllWorkflowVersions',
] as const;

const DIEX_NAVIGATION_MENU_ITEM_NAMES = [
  'diexFolder',
  'offers',
  'commercialSignals',
  'customerSuccess',
  'successMilestones',
  'aiGovernance',
  'commercialTasks',
  'operationalTasks',
  'workspaceContext',
  'inboxSavedReplies',
  'inboxLabels',
  'inboxTeams',
  'inboxTeamMembers',
  'inboxMentions',
  'inboxMacros',
  'inboxAutomations',
  'inboxConversationEvents',
  'accessRequests',
  'aiCommandCenter',
  'commercialIntelligence',
  'customerSuccessCommandCenter',
  'inbox',
  'onboarding',
  'renewalCommandCenter',
  'diexFormsMenu',
] as const;

const createStandardDiexNavigationMenuItemFlatMetadata = ({
  definition,
  workspaceId,
  diexStandardApplicationId,
  flatViewMaps,
  flatPageLayoutMaps,
  folderId,
  now,
}: {
  definition: StandardNavigationMenuItemDefinition;
  workspaceId: string;
  diexStandardApplicationId: string;
  flatViewMaps: FlatEntityMaps<FlatView>;
  flatPageLayoutMaps: FlatEntityMaps<FlatPageLayout>;
  folderId: string | null;
  now: string;
}): FlatNavigationMenuItem => {
  const flatView = definition.viewUniversalIdentifier
    ? findFlatEntityByUniversalIdentifier({
        flatEntityMaps: flatViewMaps,
        universalIdentifier: definition.viewUniversalIdentifier,
      })
    : undefined;
  const flatPageLayout = definition.pageLayoutUniversalIdentifier
    ? findFlatEntityByUniversalIdentifier({
        flatEntityMaps: flatPageLayoutMaps,
        universalIdentifier: definition.pageLayoutUniversalIdentifier,
      })
    : undefined;

  if (definition.viewUniversalIdentifier && !flatView) {
    throw new Error(
      `View not found for universal identifier ${definition.viewUniversalIdentifier}`,
    );
  }

  if (definition.pageLayoutUniversalIdentifier && !flatPageLayout) {
    throw new Error(
      `Page layout not found for universal identifier ${definition.pageLayoutUniversalIdentifier}`,
    );
  }

  return {
    id: v4(),
    type: definition.type,
    universalIdentifier: definition.universalIdentifier,
    applicationId: diexStandardApplicationId,
    applicationUniversalIdentifier:
      DIEX_STANDARD_APPLICATION.universalIdentifier,
    workspaceId,
    userWorkspaceId: null,
    targetRecordId: null,
    targetObjectMetadataId: null,
    targetObjectMetadataUniversalIdentifier: null,
    viewId:
      definition.type === NavigationMenuItemType.VIEW
        ? (flatView?.id ?? null)
        : null,
    viewUniversalIdentifier:
      definition.type === NavigationMenuItemType.VIEW
        ? (flatView?.universalIdentifier ?? null)
        : null,
    folderId: definition.folderUniversalIdentifier ? folderId : null,
    folderUniversalIdentifier: definition.folderUniversalIdentifier ?? null,
    pageLayoutId:
      definition.type === NavigationMenuItemType.PAGE_LAYOUT
        ? (flatPageLayout?.id ?? null)
        : null,
    pageLayoutUniversalIdentifier:
      definition.type === NavigationMenuItemType.PAGE_LAYOUT
        ? (flatPageLayout?.universalIdentifier ?? null)
        : null,
    name: definition.name ?? null,
    link: definition.link ?? null,
    icon: definition.icon ?? null,
    color: definition.color ?? null,
    position: definition.position,
    createdAt: now,
    updatedAt: now,
  };
};

export const buildStandardFlatNavigationMenuItemMaps = ({
  now,
  workspaceId,
  diexStandardApplicationId,
  dependencyFlatEntityMaps: { flatPageLayoutMaps, flatViewMaps },
}: {
  now: string;
  workspaceId: string;
  diexStandardApplicationId: string;
  dependencyFlatEntityMaps: {
    flatViewMaps: FlatEntityMaps<FlatView>;
    flatPageLayoutMaps: FlatEntityMaps<FlatPageLayout>;
  };
}): FlatNavigationMenuItemMaps => {
  const flatNavigationMenuItemMaps: FlatNavigationMenuItemMaps = {
    ...createEmptyFlatEntityMaps(),
    byUserWorkspaceIdAndFolderId: {},
  };

  for (const navigationMenuItemName of FLAT_NAVIGATION_MENU_ITEM_NAMES) {
    const navigationMenuItemDefinition =
      STANDARD_NAVIGATION_MENU_ITEMS[navigationMenuItemName];

    const flatNavigationMenuItem = createStandardNavigationMenuItemFlatMetadata(
      {
        workspaceId,
        navigationMenuItemName,
        viewUniversalIdentifier:
          navigationMenuItemDefinition.viewUniversalIdentifier,
        position: navigationMenuItemDefinition.position,
        navigationMenuItemId: v4(),
        dependencyFlatEntityMaps: {
          flatViewMaps,
        },
        diexStandardApplicationId,
        now,
      },
    );

    addFlatNavigationMenuItemToMapsAndUpdateIndex({
      flatNavigationMenuItem,
      flatNavigationMenuItemMaps,
    });
  }

  const diexFolderDefinition = STANDARD_NAVIGATION_MENU_ITEMS.diexFolder;
  const diexFolder = createStandardDiexNavigationMenuItemFlatMetadata({
    definition: diexFolderDefinition,
    workspaceId,
    diexStandardApplicationId,
    flatViewMaps,
    flatPageLayoutMaps,
    folderId: null,
    now,
  });

  const diexFolderId = diexFolder.id;

  addFlatNavigationMenuItemToMapsAndUpdateIndex({
    flatNavigationMenuItem: diexFolder,
    flatNavigationMenuItemMaps,
  });

  for (const navigationMenuItemName of DIEX_NAVIGATION_MENU_ITEM_NAMES) {
    if (navigationMenuItemName === 'diexFolder') {
      continue;
    }

    const navigationMenuItemDefinition =
      STANDARD_NAVIGATION_MENU_ITEMS[navigationMenuItemName];

    const flatNavigationMenuItem =
      createStandardDiexNavigationMenuItemFlatMetadata({
        definition: navigationMenuItemDefinition,
        workspaceId,
        diexStandardApplicationId,
        flatViewMaps,
        flatPageLayoutMaps,
        folderId: diexFolderId,
        now,
      });

    addFlatNavigationMenuItemToMapsAndUpdateIndex({
      flatNavigationMenuItem,
      flatNavigationMenuItemMaps,
    });
  }

  const workflowsFolderDefinition =
    STANDARD_NAVIGATION_MENU_ITEMS.workflowsFolder;
  const workflowsFolderId = v4();
  const workflowsFolder = createStandardNavigationMenuItemFolderFlatMetadata({
    universalIdentifier: workflowsFolderDefinition.universalIdentifier,
    name: workflowsFolderDefinition.name,
    icon: workflowsFolderDefinition.icon,
    position: workflowsFolderDefinition.position,
    navigationMenuItemId: workflowsFolderId,
    workspaceId,
    diexStandardApplicationId,
    now,
  });

  addFlatNavigationMenuItemToMapsAndUpdateIndex({
    flatNavigationMenuItem: workflowsFolder,
    flatNavigationMenuItemMaps,
  });

  for (const folderItemName of WORKFLOWS_FOLDER_ITEM_NAMES) {
    const folderItemDefinition = STANDARD_NAVIGATION_MENU_ITEMS[folderItemName];

    const folderItem = createStandardNavigationMenuItemFolderItemFlatMetadata({
      universalIdentifier: folderItemDefinition.universalIdentifier,
      viewUniversalIdentifier: folderItemDefinition.viewUniversalIdentifier,
      folderId: workflowsFolderId,
      folderUniversalIdentifier: folderItemDefinition.folderUniversalIdentifier,
      position: folderItemDefinition.position,
      navigationMenuItemId: v4(),
      workspaceId,
      diexStandardApplicationId,
      dependencyFlatEntityMaps: {
        flatViewMaps,
      },
      now,
    });

    addFlatNavigationMenuItemToMapsAndUpdateIndex({
      flatNavigationMenuItem: folderItem,
      flatNavigationMenuItemMaps,
    });
  }

  return flatNavigationMenuItemMaps;
};
