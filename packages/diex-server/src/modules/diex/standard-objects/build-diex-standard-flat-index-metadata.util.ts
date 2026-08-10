import { type FlatIndexMetadata } from 'src/engine/metadata-modules/flat-index-metadata/types/flat-index-metadata.type';
import { IndexType } from 'src/engine/metadata-modules/index-metadata/types/indexType.types';
import { type AllStandardObjectFieldName } from 'src/engine/workspace-manager/diex-standard-application/types/all-standard-object-field-name.type';
import { type AllStandardObjectIndexName } from 'src/engine/workspace-manager/diex-standard-application/types/all-standard-object-index-name.type';
import {
  type CreateStandardIndexArgs,
  createStandardIndexFlatMetadata,
} from 'src/engine/workspace-manager/diex-standard-application/utils/index/create-standard-index-flat-metadata.util';

const DIEX_STANDARD_INDEX_CONFIGS = {
  aiAction: {
    uniqueIndexes: [
      {
        fieldName: 'idempotencyKey',
        indexName: 'idempotencyKeyUniqueIndex',
      },
    ],
    isSearchable: true,
  },
  commercialSignal: {
    uniqueIndexes: [
      {
        fieldName: 'sourceReference',
        indexName: 'sourceReferenceUniqueIndex',
      },
      {
        fieldName: 'legacyDiexId',
        indexName: 'legacyDiexIdUniqueIndex',
      },
    ],
    isSearchable: true,
  },
  customerRenewal: {
    uniqueIndexes: [
      {
        fieldName: 'legacyDiexId',
        indexName: 'legacyDiexIdUniqueIndex',
      },
    ],
    isSearchable: true,
  },
  customerRenewalEvent: {
    uniqueIndexes: [],
    isSearchable: true,
  },
  diexAccessRequest: {
    uniqueIndexes: [],
    isSearchable: true,
  },
  diexWorkspaceContext: {
    uniqueIndexes: [],
    isSearchable: true,
  },
  workspaceArchitectureArtifact: {
    uniqueIndexes: [
      {
        fieldName: 'artifactKey',
        indexName: 'artifactKeyUniqueIndex',
      },
      {
        fieldName: 'idempotencyKey',
        indexName: 'idempotencyKeyUniqueIndex',
      },
    ],
    isSearchable: true,
  },
  offer: {
    uniqueIndexes: [
      {
        fieldName: 'legacyDiexId',
        indexName: 'legacyDiexIdUniqueIndex',
      },
    ],
    isSearchable: true,
  },
  successMilestone: {
    uniqueIndexes: [
      {
        fieldName: 'legacyDiexId',
        indexName: 'legacyDiexIdUniqueIndex',
      },
    ],
    isSearchable: true,
  },
  successPlan: {
    uniqueIndexes: [
      {
        fieldName: 'legacyDiexId',
        indexName: 'legacyDiexIdUniqueIndex',
      },
    ],
    isSearchable: true,
  },
} as const;

type DiexIndexedStandardObjectName = keyof typeof DIEX_STANDARD_INDEX_CONFIGS;

const buildDiexStandardFlatIndexMetadatas = <
  O extends DiexIndexedStandardObjectName,
>({
  objectName,
  ...args
}: Omit<CreateStandardIndexArgs<O>, 'context'>): Record<
  AllStandardObjectIndexName<O>,
  FlatIndexMetadata
> => {
  const config = DIEX_STANDARD_INDEX_CONFIGS[objectName];
  const indexes = Object.fromEntries(
    config.uniqueIndexes.map(({ fieldName, indexName }) => [
      indexName,
      createStandardIndexFlatMetadata({
        ...args,
        objectName,
        context: {
          indexName: indexName as AllStandardObjectIndexName<O>,
          relatedFieldNames: [fieldName as AllStandardObjectFieldName<O>],
          isUnique: true,
        },
      }),
    ]),
  ) as Record<string, FlatIndexMetadata>;

  if (config.isSearchable) {
    indexes.searchVectorGinIndex = createStandardIndexFlatMetadata({
      ...args,
      objectName,
      context: {
        indexName: 'searchVectorGinIndex' as AllStandardObjectIndexName<O>,
        relatedFieldNames: ['searchVector' as AllStandardObjectFieldName<O>],
        indexType: IndexType.GIN,
      },
    });
  }

  return indexes as Record<AllStandardObjectIndexName<O>, FlatIndexMetadata>;
};

export const buildAiActionStandardFlatIndexMetadatas = (
  args: Omit<CreateStandardIndexArgs<'aiAction'>, 'context'>,
) => buildDiexStandardFlatIndexMetadatas(args);

export const buildCommercialSignalStandardFlatIndexMetadatas = (
  args: Omit<CreateStandardIndexArgs<'commercialSignal'>, 'context'>,
) => buildDiexStandardFlatIndexMetadatas(args);

export const buildCustomerRenewalStandardFlatIndexMetadatas = (
  args: Omit<CreateStandardIndexArgs<'customerRenewal'>, 'context'>,
) => buildDiexStandardFlatIndexMetadatas(args);

export const buildCustomerRenewalEventStandardFlatIndexMetadatas = (
  args: Omit<CreateStandardIndexArgs<'customerRenewalEvent'>, 'context'>,
) => buildDiexStandardFlatIndexMetadatas(args);

export const buildDiexAccessRequestStandardFlatIndexMetadatas = (
  args: Omit<CreateStandardIndexArgs<'diexAccessRequest'>, 'context'>,
) => buildDiexStandardFlatIndexMetadatas(args);

export const buildDiexWorkspaceContextStandardFlatIndexMetadatas = (
  args: Omit<CreateStandardIndexArgs<'diexWorkspaceContext'>, 'context'>,
) => buildDiexStandardFlatIndexMetadatas(args);

export const buildWorkspaceArchitectureArtifactStandardFlatIndexMetadatas = (
  args: Omit<
    CreateStandardIndexArgs<'workspaceArchitectureArtifact'>,
    'context'
  >,
) => buildDiexStandardFlatIndexMetadatas(args);

export const buildOfferStandardFlatIndexMetadatas = (
  args: Omit<CreateStandardIndexArgs<'offer'>, 'context'>,
) => buildDiexStandardFlatIndexMetadatas(args);

export const buildSuccessMilestoneStandardFlatIndexMetadatas = (
  args: Omit<CreateStandardIndexArgs<'successMilestone'>, 'context'>,
) => buildDiexStandardFlatIndexMetadatas(args);

export const buildSuccessPlanStandardFlatIndexMetadatas = (
  args: Omit<CreateStandardIndexArgs<'successPlan'>, 'context'>,
) => buildDiexStandardFlatIndexMetadatas(args);
