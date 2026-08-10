import { Injectable } from '@nestjs/common';

import { isDefined } from 'diex-shared/utils';

import { type MetadataUniversalFlatEntity } from 'src/engine/metadata-modules/flat-entity/types/metadata-universal-flat-entity.type';
import {
  type BuildSideEffectsArgs,
  MetadataSideEffectHandler,
} from 'src/engine/metadata-modules/metadata-side-effect/interfaces/base-metadata-side-effect-handler.service';
import { type MetadataSideEffectResult } from 'src/engine/metadata-modules/metadata-side-effect/types/metadata-side-effect-result.type';
import { buildReservedSystemFlatFieldMetadatasForCustomObject } from 'src/engine/metadata-modules/object-metadata/utils/build-reserved-system-flat-field-metadatas-for-custom-object.util';

@Injectable()
export class ObjectSystemFieldsOnCreateSideEffectHandlerService extends MetadataSideEffectHandler(
  {
    operation: 'create',
    metadataName: 'objectMetadata',
    name: 'objectSystemFieldsOnCreate',
    description:
      'When an object is created, generate its 7 reserved system fields (id, createdAt, updatedAt, deletedAt, createdBy, updatedBy, position). The searchVector field is provisioned by the self-contained objectSearchVectorOnCreate handler alongside its GIN index and searchFieldMetadata. The default name field is NOT synthesized here: it is a caller-provided default field (SDK auto-complete on the manifest path, input transpiler on the API path).',
  },
) {
  buildSideEffects({
    flatEntity: flatObjectMetadata,
    allFlatEntityOperationRecordByMetadataName,
  }: BuildSideEffectsArgs<'objectMetadata'>): MetadataSideEffectResult {
    const { applicationUniversalIdentifier, universalIdentifier } =
      flatObjectMetadata;

    const reservedSystemFlatFieldMetadatas =
      buildReservedSystemFlatFieldMetadatasForCustomObject({
        flatObjectMetadata: {
          applicationUniversalIdentifier,
          universalIdentifier,
        },
      });

    const flatEntityToCreate: Record<
      string,
      MetadataUniversalFlatEntity<'fieldMetadata'>
    > = {};
    const pendingFieldMetadatas = Object.values(
      allFlatEntityOperationRecordByMetadataName.fieldMetadata
        ?.flatEntityToCreate ?? {},
    ).filter(isDefined);

    for (const flatFieldMetadata of Object.values(
      reservedSystemFlatFieldMetadatas,
    )) {
      const pendingFieldMetadata = pendingFieldMetadatas.find(
        (candidate) =>
          candidate.objectMetadataUniversalIdentifier ===
            flatObjectMetadata.universalIdentifier &&
          candidate.name === flatFieldMetadata.name,
      );

      if (
        isDefined(pendingFieldMetadata) &&
        pendingFieldMetadata.universalIdentifier !==
          flatFieldMetadata.universalIdentifier
      ) {
        continue;
      }

      flatEntityToCreate[flatFieldMetadata.universalIdentifier] =
        flatFieldMetadata;
    }

    if (Object.keys(flatEntityToCreate).length === 0) {
      return { status: 'noop' };
    }

    return {
      status: 'success',
      operations: {
        fieldMetadata: {
          flatEntityToCreate,
        },
      },
    };
  }
}
