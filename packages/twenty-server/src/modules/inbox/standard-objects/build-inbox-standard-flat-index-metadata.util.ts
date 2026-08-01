import { type FlatIndexMetadata } from 'src/engine/metadata-modules/flat-index-metadata/types/flat-index-metadata.type';
import { IndexType } from 'src/engine/metadata-modules/index-metadata/types/indexType.types';
import { type AllStandardObjectFieldName } from 'src/engine/workspace-manager/twenty-standard-application/types/all-standard-object-field-name.type';
import { type AllStandardObjectIndexName } from 'src/engine/workspace-manager/twenty-standard-application/types/all-standard-object-index-name.type';
import {
  type CreateStandardIndexArgs,
  createStandardIndexFlatMetadata,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/index/create-standard-index-flat-metadata.util';

const INBOX_STANDARD_INDEX_CONFIGS = {
  inboxAutomation: {
    uniqueFieldName: 'key',
    uniqueIndexName: 'keyUniqueIndex',
    isSearchable: true,
  },
  inboxConversation: {
    uniqueFieldName: 'providerThreadKey',
    uniqueIndexName: 'providerThreadKeyUniqueIndex',
    isSearchable: true,
  },
  inboxConversationEvent: {
    uniqueFieldName: 'name',
    uniqueIndexName: 'nameUniqueIndex',
    isSearchable: true,
  },
  inboxConversationLabel: {
    uniqueFieldName: 'name',
    uniqueIndexName: 'nameUniqueIndex',
    isSearchable: false,
  },
  inboxLabel: {
    uniqueFieldName: 'slug',
    uniqueIndexName: 'slugUniqueIndex',
    isSearchable: true,
  },
  inboxMacro: {
    uniqueFieldName: 'shortcut',
    uniqueIndexName: 'shortcutUniqueIndex',
    isSearchable: true,
  },
  inboxMention: {
    uniqueFieldName: 'name',
    uniqueIndexName: 'nameUniqueIndex',
    isSearchable: true,
  },
  inboxMessage: {
    uniqueFieldName: 'providerMessageKey',
    uniqueIndexName: 'providerMessageKeyUniqueIndex',
    isSearchable: true,
  },
  inboxSavedReply: {
    uniqueFieldName: 'shortcut',
    uniqueIndexName: 'shortcutUniqueIndex',
    isSearchable: true,
  },
  inboxTeam: {
    uniqueFieldName: 'key',
    uniqueIndexName: 'keyUniqueIndex',
    isSearchable: true,
  },
  inboxTeamMember: {
    uniqueFieldName: 'name',
    uniqueIndexName: 'nameUniqueIndex',
    isSearchable: false,
  },
} as const;

type InboxStandardObjectName = keyof typeof INBOX_STANDARD_INDEX_CONFIGS;

const buildInboxStandardFlatIndexMetadatas = <
  O extends InboxStandardObjectName,
>({
  objectName,
  ...args
}: Omit<CreateStandardIndexArgs<O>, 'context'>): Record<
  AllStandardObjectIndexName<O>,
  FlatIndexMetadata
> => {
  const config = INBOX_STANDARD_INDEX_CONFIGS[objectName];
  const indexes: Record<string, FlatIndexMetadata> = {
    [config.uniqueIndexName]: createStandardIndexFlatMetadata({
      ...args,
      objectName,
      context: {
        indexName: config.uniqueIndexName as AllStandardObjectIndexName<O>,
        relatedFieldNames: [
          config.uniqueFieldName as AllStandardObjectFieldName<O>,
        ],
        isUnique: true,
      },
    }),
  };

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

export const buildInboxAutomationStandardFlatIndexMetadatas = (
  args: Omit<CreateStandardIndexArgs<'inboxAutomation'>, 'context'>,
) => buildInboxStandardFlatIndexMetadatas(args);

export const buildInboxConversationStandardFlatIndexMetadatas = (
  args: Omit<CreateStandardIndexArgs<'inboxConversation'>, 'context'>,
) => buildInboxStandardFlatIndexMetadatas(args);

export const buildInboxConversationEventStandardFlatIndexMetadatas = (
  args: Omit<CreateStandardIndexArgs<'inboxConversationEvent'>, 'context'>,
) => buildInboxStandardFlatIndexMetadatas(args);

export const buildInboxConversationLabelStandardFlatIndexMetadatas = (
  args: Omit<CreateStandardIndexArgs<'inboxConversationLabel'>, 'context'>,
) => buildInboxStandardFlatIndexMetadatas(args);

export const buildInboxLabelStandardFlatIndexMetadatas = (
  args: Omit<CreateStandardIndexArgs<'inboxLabel'>, 'context'>,
) => buildInboxStandardFlatIndexMetadatas(args);

export const buildInboxMacroStandardFlatIndexMetadatas = (
  args: Omit<CreateStandardIndexArgs<'inboxMacro'>, 'context'>,
) => buildInboxStandardFlatIndexMetadatas(args);

export const buildInboxMentionStandardFlatIndexMetadatas = (
  args: Omit<CreateStandardIndexArgs<'inboxMention'>, 'context'>,
) => buildInboxStandardFlatIndexMetadatas(args);

export const buildInboxMessageStandardFlatIndexMetadatas = (
  args: Omit<CreateStandardIndexArgs<'inboxMessage'>, 'context'>,
) => buildInboxStandardFlatIndexMetadatas(args);

export const buildInboxSavedReplyStandardFlatIndexMetadatas = (
  args: Omit<CreateStandardIndexArgs<'inboxSavedReply'>, 'context'>,
) => buildInboxStandardFlatIndexMetadatas(args);

export const buildInboxTeamStandardFlatIndexMetadatas = (
  args: Omit<CreateStandardIndexArgs<'inboxTeam'>, 'context'>,
) => buildInboxStandardFlatIndexMetadatas(args);

export const buildInboxTeamMemberStandardFlatIndexMetadatas = (
  args: Omit<CreateStandardIndexArgs<'inboxTeamMember'>, 'context'>,
) => buildInboxStandardFlatIndexMetadatas(args);
