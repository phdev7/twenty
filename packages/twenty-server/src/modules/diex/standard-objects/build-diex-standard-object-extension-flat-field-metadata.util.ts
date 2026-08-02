import {
  TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
  type FieldManifest,
} from 'twenty-shared/application';
import {
  DIEX_STANDARD_OBJECT_EXTENSION_FIELDS,
  STANDARD_OBJECTS,
} from 'twenty-shared/metadata';
import { type FieldMetadataType as FieldMetadataTypeValue } from 'twenty-shared/types';

import { fromFieldManifestToUniversalFlatFieldMetadata } from 'src/engine/core-modules/application/application-manifest/converters/from-field-manifest-to-universal-flat-field-metadata.util';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { type AllStandardObjectFieldName } from 'src/engine/workspace-manager/twenty-standard-application/types/all-standard-object-field-name.type';
import { type CreateStandardFieldArgs } from 'src/engine/workspace-manager/twenty-standard-application/utils/field-metadata/create-standard-field-flat-metadata.util';
import { buildDiexStandardRelationFlatFieldMetadatas } from 'src/modules/diex/standard-objects/build-diex-standard-flat-relation-metadata.util';
import { DIEX_STANDARD_OBJECT_EXTENSION_FIELD_DEFINITIONS } from 'src/modules/diex/standard-objects/diex-standard-object-extension-field-definitions.constant';

type DiexExtendedStandardObjectName =
  keyof typeof DIEX_STANDARD_OBJECT_EXTENSION_FIELDS;

type DiexStandardObjectExtensionFieldName<
  O extends DiexExtendedStandardObjectName,
> = keyof (typeof DIEX_STANDARD_OBJECT_EXTENSION_FIELDS)[O] &
  AllStandardObjectFieldName<O>;

const getStandardFieldMetadataId = <O extends DiexExtendedStandardObjectName>({
  fieldName,
  objectName,
  standardObjectMetadataRelatedEntityIds,
}: Pick<
  CreateStandardFieldArgs<O, FieldMetadataTypeValue>,
  'standardObjectMetadataRelatedEntityIds'
> & {
  fieldName: AllStandardObjectFieldName<O>;
  objectName: O;
}): string => {
  const fieldMetadata = standardObjectMetadataRelatedEntityIds[objectName]
    .fields[fieldName] as { id: string } | undefined;

  if (!fieldMetadata) {
    throw new Error(
      `Standard object ${String(objectName)} does not define the ${String(fieldName)} field`,
    );
  }

  return fieldMetadata.id;
};

export const buildDiexStandardObjectExtensionFlatFieldMetadatas = <
  O extends DiexExtendedStandardObjectName,
>(
  args: Omit<CreateStandardFieldArgs<O, FieldMetadataTypeValue>, 'context'>,
): Record<DiexStandardObjectExtensionFieldName<O>, FlatFieldMetadata> => {
  const fieldDefinitions =
    DIEX_STANDARD_OBJECT_EXTENSION_FIELD_DEFINITIONS.filter(
      (definition) =>
        definition.objectUniversalIdentifier ===
        STANDARD_OBJECTS[args.objectName].universalIdentifier,
    );

  const scalarFieldMetadatas = Object.fromEntries(
    fieldDefinitions.map((rawDefinition) => {
      const definition: FieldManifest = rawDefinition;
      const fieldName = definition.name as AllStandardObjectFieldName<O>;
      const universalFieldMetadata =
        fromFieldManifestToUniversalFlatFieldMetadata({
          fieldManifest: definition,
          applicationUniversalIdentifier:
            TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
          now: args.now,
        });

      return [
        fieldName,
        {
          ...universalFieldMetadata,
          id: getStandardFieldMetadataId({
            fieldName,
            objectName: args.objectName,
            standardObjectMetadataRelatedEntityIds:
              args.standardObjectMetadataRelatedEntityIds,
          }),
          applicationId: args.twentyStandardApplicationId,
          workspaceId: args.workspaceId,
          objectMetadataId:
            args.standardObjectMetadataRelatedEntityIds[args.objectName].id,
          settings: universalFieldMetadata.universalSettings,
          relationTargetFieldMetadataId: null,
          relationTargetObjectMetadataId: null,
          viewFieldIds: [],
          viewFilterIds: [],
          fieldPermissionIds: [],
          kanbanAggregateOperationViewIds: [],
          calendarViewIds: [],
          calendarEndViewIds: [],
          mainGroupByFieldMetadataViewIds: [],
          viewSortIds: [],
          searchFieldMetadataIds: [],
        } satisfies FlatFieldMetadata,
      ];
    }),
  ) as unknown as Record<
    DiexStandardObjectExtensionFieldName<O>,
    FlatFieldMetadata
  >;

  return {
    ...scalarFieldMetadatas,
    ...buildDiexStandardRelationFlatFieldMetadatas({
      ...args,
      objectName: args.objectName,
    }),
  } as Record<DiexStandardObjectExtensionFieldName<O>, FlatFieldMetadata>;
};
