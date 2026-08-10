import { type AllFlatEntityOperationRecordByMetadataName } from 'src/engine/metadata-modules/flat-entity/types/all-flat-entity-operation-record-by-metadata-name.type';
import { type UniversalFlatFieldMetadata } from 'src/engine/workspace-manager/workspace-migration/universal-flat-entity/types/universal-flat-field-metadata.type';

export const hasUniqueFieldBackingIndexScheduledForCreate = ({
  allFlatEntityOperationRecordByMetadataName,
  flatFieldMetadata,
}: {
  allFlatEntityOperationRecordByMetadataName: AllFlatEntityOperationRecordByMetadataName;
  flatFieldMetadata: UniversalFlatFieldMetadata;
}): boolean => {
  const indexMetadatasToCreate = Object.values(
    allFlatEntityOperationRecordByMetadataName.index?.flatEntityToCreate ?? {},
  ).filter(isDefined);

  return indexMetadatasToCreate.some(
    (indexMetadata) =>
      indexMetadata.isUnique &&
      indexMetadata.isSystemSideEffect &&
      indexMetadata.objectMetadataUniversalIdentifier ===
        flatFieldMetadata.objectMetadataUniversalIdentifier &&
      indexMetadata.universalFlatIndexFieldMetadatas.length === 1 &&
      indexMetadata.universalFlatIndexFieldMetadatas[0]
        .fieldMetadataUniversalIdentifier ===
        flatFieldMetadata.universalIdentifier &&
      indexMetadata.universalFlatIndexFieldMetadatas[0].subFieldName === null,
  );
};
import { isDefined } from 'diex-shared/utils';
