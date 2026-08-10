import { type FieldManifest } from 'diex-shared/application';
import { STANDARD_OBJECTS } from 'diex-shared/metadata';
import { FieldMetadataType } from 'diex-shared/types';

import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { type AllStandardObjectFieldName } from 'src/engine/workspace-manager/diex-standard-application/types/all-standard-object-field-name.type';
import { type AllStandardObjectName } from 'src/engine/workspace-manager/diex-standard-application/types/all-standard-object-name.type';
import { type CreateStandardFieldArgs } from 'src/engine/workspace-manager/diex-standard-application/utils/field-metadata/create-standard-field-flat-metadata.util';
import { createStandardRelationFieldFlatMetadata } from 'src/engine/workspace-manager/diex-standard-application/utils/field-metadata/create-standard-relation-field-flat-metadata.util';
import { DIEX_STANDARD_RELATION_DEFINITIONS } from 'src/modules/diex/standard-objects/diex-standard-relation-definitions.constant';

const STANDARD_OBJECT_ENTRIES = Object.entries(STANDARD_OBJECTS) as [
  AllStandardObjectName,
  (typeof STANDARD_OBJECTS)[AllStandardObjectName],
][];

const getStandardObjectNameByUniversalIdentifier = (
  universalIdentifier: string,
): AllStandardObjectName => {
  const objectEntry = STANDARD_OBJECT_ENTRIES.find(
    ([, objectDefinition]) =>
      objectDefinition.universalIdentifier === universalIdentifier,
  );

  if (!objectEntry) {
    throw new Error(
      `No standard object uses universal identifier ${universalIdentifier}`,
    );
  }

  return objectEntry[0];
};

const getStandardFieldNameByUniversalIdentifier = <
  O extends AllStandardObjectName,
>(
  objectName: O,
  universalIdentifier: string,
): AllStandardObjectFieldName<O> => {
  const fieldEntry = Object.entries(STANDARD_OBJECTS[objectName].fields).find(
    ([, fieldDefinition]) =>
      fieldDefinition.universalIdentifier === universalIdentifier,
  );

  if (!fieldEntry) {
    throw new Error(
      `No field on ${objectName} uses universal identifier ${universalIdentifier}`,
    );
  }

  return fieldEntry[0] as AllStandardObjectFieldName<O>;
};

export const buildDiexStandardRelationFlatFieldMetadatas = <
  O extends AllStandardObjectName,
>(
  args: Omit<CreateStandardFieldArgs<O, FieldMetadataType>, 'context'>,
): Partial<Record<AllStandardObjectFieldName<O>, FlatFieldMetadata>> => {
  const relationDefinitions = DIEX_STANDARD_RELATION_DEFINITIONS.filter(
    (definition) =>
      definition.objectUniversalIdentifier ===
      STANDARD_OBJECTS[args.objectName].universalIdentifier,
  );

  return Object.fromEntries(
    relationDefinitions.map((rawDefinition) => {
      const definition: FieldManifest<FieldMetadataType.RELATION> =
        rawDefinition;

      if (
        !definition.icon ||
        !definition.universalSettings ||
        !definition.relationTargetObjectMetadataUniversalIdentifier ||
        !definition.relationTargetFieldMetadataUniversalIdentifier
      ) {
        throw new Error(
          `Relation field ${definition.name} has incomplete native metadata`,
        );
      }

      const targetObjectName = getStandardObjectNameByUniversalIdentifier(
        definition.relationTargetObjectMetadataUniversalIdentifier,
      );
      const fieldName = getStandardFieldNameByUniversalIdentifier(
        args.objectName,
        definition.universalIdentifier,
      );
      const targetFieldName = getStandardFieldNameByUniversalIdentifier(
        targetObjectName,
        definition.relationTargetFieldMetadataUniversalIdentifier,
      );

      return [
        fieldName,
        createStandardRelationFieldFlatMetadata({
          ...args,
          context: {
            type: FieldMetadataType.RELATION,
            fieldName,
            label: definition.label,
            description: definition.description ?? null,
            icon: definition.icon,
            targetObjectName,
            targetFieldName,
            isNullable: definition.isNullable,
            isUIEditable: definition.isUIEditable,
            settings: definition.universalSettings,
            morphId: null,
          },
        }),
      ];
    }),
  ) as Partial<Record<AllStandardObjectFieldName<O>, FlatFieldMetadata>>;
};
