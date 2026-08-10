import { type ObjectManifest } from 'diex-shared/application';
import { FieldMetadataType } from 'diex-shared/types';

import {
  INBOX_MENTION_FIELD_IDS,
  INBOX_MENTION_OPTION_IDS,
  INBOX_MENTION_UNIVERSAL_IDENTIFIER,
} from 'src/modules/inbox/constants/inbox-mention.constants';

export enum InboxMentionStatus {
  UNREAD = 'UNREAD',
  READ = 'READ',
  RESOLVED = 'RESOLVED',
}

export const InboxMentionStandardObjectDefinition = {
  universalIdentifier: INBOX_MENTION_UNIVERSAL_IDENTIFIER,
  nameSingular: 'inboxMention' as const,
  namePlural: 'inboxMentions',
  labelSingular: 'Menção da inbox',
  labelPlural: 'Menções da inbox',
  description:
    'Alerta estruturado de colaboração criado por uma nota interna da Inbox.',
  icon: 'IconAt',
  isSearchable: true,
  labelIdentifierFieldMetadataUniversalIdentifier: INBOX_MENTION_FIELD_IDS.name,
  fields: [
    {
      universalIdentifier: INBOX_MENTION_FIELD_IDS.name,
      type: FieldMetadataType.TEXT,
      name: 'name',
      label: 'Chave da menção',
      icon: 'IconHash',
      isUnique: true,
    },
    {
      universalIdentifier: INBOX_MENTION_FIELD_IDS.excerpt,
      type: FieldMetadataType.TEXT,
      name: 'excerpt',
      label: 'Contexto',
      icon: 'IconNotes',
      isNullable: true,
    },
    {
      universalIdentifier: INBOX_MENTION_FIELD_IDS.status,
      type: FieldMetadataType.SELECT,
      name: 'status',
      label: 'Status',
      icon: 'IconProgress',
      defaultValue: `'${InboxMentionStatus.UNREAD}'`,
      options: [
        {
          id: INBOX_MENTION_OPTION_IDS.status.unread,
          value: InboxMentionStatus.UNREAD,
          label: 'Não lida',
          position: 0,
          color: 'red',
        },
        {
          id: INBOX_MENTION_OPTION_IDS.status.read,
          value: InboxMentionStatus.READ,
          label: 'Lida',
          position: 1,
          color: 'blue',
        },
        {
          id: INBOX_MENTION_OPTION_IDS.status.resolved,
          value: InboxMentionStatus.RESOLVED,
          label: 'Resolvida',
          position: 2,
          color: 'green',
        },
      ],
    },
    {
      universalIdentifier: INBOX_MENTION_FIELD_IDS.mentionedAt,
      type: FieldMetadataType.DATE_TIME,
      name: 'mentionedAt',
      label: 'Mencionado em',
      icon: 'IconClock',
    },
    {
      universalIdentifier: INBOX_MENTION_FIELD_IDS.readAt,
      type: FieldMetadataType.DATE_TIME,
      name: 'readAt',
      label: 'Lida em',
      icon: 'IconEye',
      isNullable: true,
    },
    {
      universalIdentifier: INBOX_MENTION_FIELD_IDS.resolvedAt,
      type: FieldMetadataType.DATE_TIME,
      name: 'resolvedAt',
      label: 'Resolvida em',
      icon: 'IconCircleCheck',
      isNullable: true,
    },
  ],
} satisfies ObjectManifest;
