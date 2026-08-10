import { createEmptyFlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/constant/create-empty-flat-entity-maps.constant';
import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { addFlatEntityToFlatEntityMapsOrThrow } from 'src/engine/metadata-modules/flat-entity/utils/add-flat-entity-to-flat-entity-maps-or-throw.util';
import { type FlatViewGroup } from 'src/engine/metadata-modules/flat-view-group/types/flat-view-group.type';
import { DIEX_STANDARD_APPLICATION } from 'src/engine/workspace-manager/diex-standard-application/constants/diex-standard-applications';
import { STANDARD_DIEX_VIEWS } from 'src/engine/workspace-manager/diex-standard-application/constants/standard-diex-view.constant';
import { type AllStandardObjectName } from 'src/engine/workspace-manager/diex-standard-application/types/all-standard-object-name.type';
import { computeStandardOpportunityViewGroups } from 'src/engine/workspace-manager/diex-standard-application/utils/view-group/compute-standard-opportunity-view-groups.util';
import { type CreateStandardViewGroupArgs } from 'src/engine/workspace-manager/diex-standard-application/utils/view-group/create-standard-view-group-flat-metadata.util';
import { computeStandardTaskViewGroups } from 'src/engine/workspace-manager/diex-standard-application/utils/view-group/compute-standard-task-view-groups.util';

type StandardViewGroupBuilder<P extends AllStandardObjectName> = (
  args: Omit<CreateStandardViewGroupArgs<P>, 'context'>,
) => Record<string, FlatViewGroup>;

const createStandardDiexViewGroupFlatMetadata = ({
  args,
  view,
  viewGroup,
}: {
  args: Omit<CreateStandardViewGroupArgs, 'context' | 'objectName'>;
  view: (typeof STANDARD_DIEX_VIEWS)[number];
  viewGroup: NonNullable<
    (typeof STANDARD_DIEX_VIEWS)[number]['groups']
  >[number];
}): FlatViewGroup => {
  const relatedIds = args.standardObjectMetadataRelatedEntityIds[
    view.objectName as keyof typeof args.standardObjectMetadataRelatedEntityIds
  ] as {
    views: Record<
      string,
      {
        id: string;
        viewGroups: Record<string, { id: string }>;
      }
    >;
  };
  const viewIds = relatedIds.views[view.viewName];

  if (!viewIds?.viewGroups?.[viewGroup.fieldValue]) {
    throw new Error(
      `Invalid standard Diex view group ${view.objectName}.${view.viewName}.${viewGroup.fieldValue}`,
    );
  }

  return {
    id: viewIds.viewGroups[viewGroup.fieldValue].id,
    universalIdentifier: viewGroup.universalIdentifier,
    applicationId: args.diexStandardApplicationId,
    applicationUniversalIdentifier:
      DIEX_STANDARD_APPLICATION.universalIdentifier,
    workspaceId: args.workspaceId,
    viewId: viewIds.id,
    viewUniversalIdentifier: view.universalIdentifier,
    isVisible: viewGroup.isVisible,
    fieldValue: viewGroup.fieldValue,
    position: viewGroup.position,
    createdAt: args.now,
    updatedAt: args.now,
    deletedAt: null,
  };
};

const STANDARD_FLAT_VIEW_GROUP_METADATA_BUILDERS_BY_OBJECT_NAME = {
  opportunity: computeStandardOpportunityViewGroups,
  task: computeStandardTaskViewGroups,
} as const satisfies {
  [P in AllStandardObjectName]?: StandardViewGroupBuilder<P>;
};

export const buildStandardFlatViewGroupMetadataMaps = (
  args: Omit<CreateStandardViewGroupArgs, 'context' | 'objectName'>,
): FlatEntityMaps<FlatViewGroup> => {
  const standardViewGroupMetadatas: FlatViewGroup[] = (
    Object.keys(
      STANDARD_FLAT_VIEW_GROUP_METADATA_BUILDERS_BY_OBJECT_NAME,
    ) as (keyof typeof STANDARD_FLAT_VIEW_GROUP_METADATA_BUILDERS_BY_OBJECT_NAME)[]
  ).flatMap((objectName) => {
    const builder: StandardViewGroupBuilder<typeof objectName> =
      STANDARD_FLAT_VIEW_GROUP_METADATA_BUILDERS_BY_OBJECT_NAME[objectName];

    const result = builder({
      ...args,
      objectName,
    });

    return Object.values(result);
  });

  const diexViewGroupMetadatas = STANDARD_DIEX_VIEWS.flatMap((view) =>
    (view.groups ?? []).map((viewGroup) =>
      createStandardDiexViewGroupFlatMetadata({ args, view, viewGroup }),
    ),
  );

  const allViewGroupMetadatas = [
    ...standardViewGroupMetadatas,
    ...diexViewGroupMetadatas,
  ];

  let flatViewGroupMaps = createEmptyFlatEntityMaps();

  for (const viewGroupMetadata of allViewGroupMetadatas) {
    flatViewGroupMaps = addFlatEntityToFlatEntityMapsOrThrow({
      flatEntity: viewGroupMetadata,
      flatEntityMaps: flatViewGroupMaps,
    });
  }

  return flatViewGroupMaps;
};
