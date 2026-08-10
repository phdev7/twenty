import { v4 } from 'uuid';
import { STANDARD_OBJECTS } from 'diex-shared/metadata';

import { STANDARD_DIEX_VIEWS } from 'src/engine/workspace-manager/diex-standard-application/constants/standard-diex-view.constant';
import { type AllStandardObjectFieldName } from 'src/engine/workspace-manager/diex-standard-application/types/all-standard-object-field-name.type';
import { type AllStandardObjectName } from 'src/engine/workspace-manager/diex-standard-application/types/all-standard-object-name.type';
import { type AllStandardObjectViewFieldName } from 'src/engine/workspace-manager/diex-standard-application/types/all-standard-object-view-field-name.type';
import { type AllStandardObjectViewFieldGroupName } from 'src/engine/workspace-manager/diex-standard-application/types/all-standard-object-view-field-group-name.type';
import { type AllStandardObjectViewGroupName } from 'src/engine/workspace-manager/diex-standard-application/types/all-standard-object-view-group-name.type';
import { type AllStandardObjectViewName } from 'src/engine/workspace-manager/diex-standard-application/types/all-standard-object-view-name.type';

type StandardObjectViewIds<O extends AllStandardObjectName> = {
  [V in AllStandardObjectViewName<O>]: {
    id: string;
    viewGroups: Record<AllStandardObjectViewGroupName<O, V>, { id: string }>;
    viewFields: Record<AllStandardObjectViewFieldName<O, V>, { id: string }>;
    viewFieldGroups: Record<
      AllStandardObjectViewFieldGroupName<O, V>,
      { id: string }
    >;
  };
};

export type StandardObjectMetadataRelatedEntityIds = {
  [O in AllStandardObjectName]: {
    id: string;
    fields: Record<AllStandardObjectFieldName<O>, { id: string }>;
    views: StandardObjectViewIds<O>;
  };
};

const computeStandardViewObjectIds = <O extends AllStandardObjectName>({
  objectName,
}: {
  objectName: O;
}): StandardObjectViewIds<O> | undefined => {
  const objectDefinition = STANDARD_OBJECTS[objectName];

  if (!('views' in objectDefinition)) {
    return undefined;
  }

  const viewDefinitions = objectDefinition.views as Record<
    string,
    {
      viewFields: Record<string, unknown>;
      viewGroups?: Record<string, unknown>;
      viewFieldGroups?: Record<string, unknown>;
    }
  >;
  const viewNames = Object.keys(
    viewDefinitions,
  ) as AllStandardObjectViewName<O>[];

  const viewIds = {} as StandardObjectViewIds<O>;

  for (const viewName of viewNames) {
    const viewDefinition = viewDefinitions[viewName as string];

    const viewFieldNames = Object.keys(viewDefinition.viewFields);
    const viewFieldIds = {} as Record<
      AllStandardObjectViewFieldName<O, typeof viewName>,
      { id: string }
    >;

    for (const viewFieldName of viewFieldNames) {
      viewFieldIds[
        viewFieldName as AllStandardObjectViewFieldName<O, typeof viewName>
      ] = {
        id: v4(),
      };
    }

    const viewGroupIds = {} as Record<
      AllStandardObjectViewGroupName<O, typeof viewName>,
      { id: string }
    >;

    if (Object.prototype.hasOwnProperty.call(viewDefinition, 'viewGroups')) {
      const viewGroupNames = Object.keys(
        (viewDefinition as { viewGroups: Record<string, unknown> }).viewGroups,
      );

      for (const viewGroupName of viewGroupNames) {
        viewGroupIds[
          viewGroupName as AllStandardObjectViewGroupName<O, typeof viewName>
        ] = {
          id: v4(),
        };
      }
    }

    const viewFieldGroupIds = {} as Record<
      AllStandardObjectViewFieldGroupName<O, typeof viewName>,
      { id: string }
    >;

    if (
      Object.prototype.hasOwnProperty.call(viewDefinition, 'viewFieldGroups')
    ) {
      const viewFieldGroupNames = Object.keys(
        (viewDefinition as { viewFieldGroups: Record<string, unknown> })
          .viewFieldGroups,
      );

      for (const viewFieldGroupName of viewFieldGroupNames) {
        viewFieldGroupIds[
          viewFieldGroupName as AllStandardObjectViewFieldGroupName<
            O,
            typeof viewName
          >
        ] = {
          id: v4(),
        };
      }
    }

    viewIds[viewName] = {
      id: v4(),
      viewFields: viewFieldIds,
      viewGroups: viewGroupIds,
      viewFieldGroups: viewFieldGroupIds,
    };
  }

  return viewIds;
};

const addStandardDiexViewObjectIds = ({
  objectName,
  viewIds,
}: {
  objectName: string;
  viewIds: Record<
    string,
    {
      id: string;
      viewFields: Record<string, { id: string }>;
      viewGroups: Record<string, { id: string }>;
      viewFieldGroups: Record<string, { id: string }>;
    }
  >;
}) => {
  for (const view of STANDARD_DIEX_VIEWS.filter(
    (candidate) => candidate.objectName === objectName,
  )) {
    viewIds[view.viewName] = {
      id: v4(),
      viewFields: Object.fromEntries(
        view.fields.map((viewField) => [viewField.fieldName, { id: v4() }]),
      ),
      viewGroups: Object.fromEntries(
        (view.groups ?? []).map((viewGroup) => [
          viewGroup.fieldValue,
          { id: v4() },
        ]),
      ),
      viewFieldGroups: {},
    };
  }
};

// TODO remove once we have refactored the builder to iterate over universalIdentifier only
export const getStandardObjectMetadataRelatedEntityIds =
  (): StandardObjectMetadataRelatedEntityIds => {
    const result = {} as StandardObjectMetadataRelatedEntityIds;

    for (const objectName of Object.keys(
      STANDARD_OBJECTS,
    ) as AllStandardObjectName[]) {
      const fieldNames = Object.keys(
        STANDARD_OBJECTS[objectName].fields,
      ) as AllStandardObjectFieldName<typeof objectName>[];

      const fieldIds = {} as Record<
        AllStandardObjectFieldName<typeof objectName>,
        { id: string }
      >;

      for (const fieldName of fieldNames) {
        fieldIds[fieldName] = { id: v4() };
      }

      const standardViewIds = computeStandardViewObjectIds({
        objectName,
      });

      const viewIds = (standardViewIds ?? {}) as Record<
        string,
        {
          id: string;
          viewFields: Record<string, { id: string }>;
          viewGroups: Record<string, { id: string }>;
          viewFieldGroups: Record<string, { id: string }>;
        }
      >;

      addStandardDiexViewObjectIds({
        objectName,
        viewIds,
      });

      result[objectName] = {
        // @ts-expect-error ignore this
        fields: fieldIds,
        id: v4(),
        // @ts-expect-error ignore this
        views: viewIds,
      };
    }

    return result;
  };
