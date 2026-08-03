import { createEmptyFlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/constant/create-empty-flat-entity-maps.constant';
import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { addFlatEntityToFlatEntityMapsOrThrow } from 'src/engine/metadata-modules/flat-entity/utils/add-flat-entity-to-flat-entity-maps-or-throw.util';
import { type FlatViewFilter } from 'src/engine/metadata-modules/flat-view-filter/types/flat-view-filter.type';
import { STANDARD_OBJECTS } from 'twenty-shared/metadata';
import { TWENTY_STANDARD_APPLICATION } from 'src/engine/workspace-manager/twenty-standard-application/constants/twenty-standard-applications';
import { STANDARD_DIEX_VIEWS } from 'src/engine/workspace-manager/twenty-standard-application/constants/standard-diex-view.constant';
import { v4 } from 'uuid';
import { type AllStandardObjectName } from 'src/engine/workspace-manager/twenty-standard-application/types/all-standard-object-name.type';
import { computeStandardTaskViewFilters } from 'src/engine/workspace-manager/twenty-standard-application/utils/view-filter/compute-standard-task-view-filters.util';
import { type CreateStandardViewFilterArgs } from 'src/engine/workspace-manager/twenty-standard-application/utils/view-filter/create-standard-view-filter-flat-metadata.util';

type StandardViewFilterBuilder<P extends AllStandardObjectName> = (
  args: Omit<CreateStandardViewFilterArgs<P>, 'context'>,
) => Record<string, FlatViewFilter>;

const createStandardDiexViewFilterFlatMetadata = ({
  args,
  view,
  viewFilter,
}: {
  args: Omit<CreateStandardViewFilterArgs, 'context' | 'objectName'>;
  view: (typeof STANDARD_DIEX_VIEWS)[number];
  viewFilter: NonNullable<
    (typeof STANDARD_DIEX_VIEWS)[number]['filters']
  >[number];
}): FlatViewFilter => {
  const objectName = view.objectName as keyof typeof STANDARD_OBJECTS;
  const objectDefinition = STANDARD_OBJECTS[objectName] as {
    fields: Record<string, { universalIdentifier: string }>;
  };
  const fieldDefinition = objectDefinition.fields[viewFilter.fieldName];
  const fieldMetadata = fieldDefinition
    ? args.dependencyFlatEntityMaps.flatFieldMetadataMaps.byUniversalIdentifier[
        fieldDefinition.universalIdentifier
      ]
    : undefined;
  const relatedIds = args.standardObjectMetadataRelatedEntityIds[
    objectName as keyof typeof args.standardObjectMetadataRelatedEntityIds
  ] as {
    views: Record<string, { id: string }>;
  };
  const viewIds = relatedIds.views[view.viewName];

  if (!fieldDefinition || !fieldMetadata || !viewIds) {
    throw new Error(
      `Invalid standard Diex view filter ${view.objectName}.${view.viewName}.${viewFilter.fieldName}`,
    );
  }

  return {
    id: v4(),
    universalIdentifier: viewFilter.universalIdentifier,
    applicationId: args.twentyStandardApplicationId,
    applicationUniversalIdentifier:
      TWENTY_STANDARD_APPLICATION.universalIdentifier,
    workspaceId: args.workspaceId,
    viewId: viewIds.id,
    viewUniversalIdentifier: view.universalIdentifier,
    fieldMetadataId: fieldMetadata.id,
    fieldMetadataUniversalIdentifier: fieldDefinition.universalIdentifier,
    viewFilterGroupId: null,
    viewFilterGroupUniversalIdentifier: null,
    operand: viewFilter.operand,
    value: viewFilter.value,
    subFieldName: null,
    relationTargetFieldMetadataId: null,
    relationTargetFieldMetadataUniversalIdentifier: null,
    positionInViewFilterGroup: null,
    createdAt: args.now,
    updatedAt: args.now,
    deletedAt: null,
  };
};

const STANDARD_FLAT_VIEW_FILTER_METADATA_BUILDERS_BY_OBJECT_NAME = {
  task: computeStandardTaskViewFilters,
} as const satisfies {
  [P in AllStandardObjectName]?: StandardViewFilterBuilder<P>;
};

export const buildStandardFlatViewFilterMetadataMaps = (
  args: Omit<CreateStandardViewFilterArgs, 'context' | 'objectName'>,
): FlatEntityMaps<FlatViewFilter> => {
  const standardViewFilterMetadatas: FlatViewFilter[] = (
    Object.keys(
      STANDARD_FLAT_VIEW_FILTER_METADATA_BUILDERS_BY_OBJECT_NAME,
    ) as (keyof typeof STANDARD_FLAT_VIEW_FILTER_METADATA_BUILDERS_BY_OBJECT_NAME)[]
  ).flatMap((objectName) => {
    const builder: StandardViewFilterBuilder<typeof objectName> =
      STANDARD_FLAT_VIEW_FILTER_METADATA_BUILDERS_BY_OBJECT_NAME[objectName];

    const result = builder({
      ...args,
      objectName,
    });

    return Object.values(result);
  });

  const diexViewFilterMetadatas = STANDARD_DIEX_VIEWS.flatMap((view) =>
    (view.filters ?? []).map((viewFilter) =>
      createStandardDiexViewFilterFlatMetadata({ args, view, viewFilter }),
    ),
  );

  const allViewFilterMetadatas = [
    ...standardViewFilterMetadatas,
    ...diexViewFilterMetadatas,
  ];

  let flatViewFilterMaps = createEmptyFlatEntityMaps();

  for (const viewFilterMetadata of allViewFilterMetadatas) {
    flatViewFilterMaps = addFlatEntityToFlatEntityMapsOrThrow({
      flatEntity: viewFilterMetadata,
      flatEntityMaps: flatViewFilterMaps,
    });
  }

  return flatViewFilterMaps;
};
