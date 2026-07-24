import {
  defineApplicationRole,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
  SystemPermissionFlag,
} from 'twenty-sdk/define';

import {
  INBOX_CONVERSATION_UNIVERSAL_IDENTIFIER,
  INBOX_MESSAGE_UNIVERSAL_IDENTIFIER,
} from 'src/modules/inbox/constants/inbox-universal-identifiers';
import {
  INBOX_CONVERSATION_LABEL_UNIVERSAL_IDENTIFIER,
  INBOX_LABEL_UNIVERSAL_IDENTIFIER,
} from 'src/modules/inbox/constants/inbox-label.constants';
import { INBOX_CONVERSATION_EVENT_UNIVERSAL_IDENTIFIER } from 'src/modules/inbox/constants/inbox-conversation-event.constants';
import { INBOX_MACRO_UNIVERSAL_IDENTIFIER } from 'src/modules/inbox/constants/inbox-macro.constants';
import { INBOX_MENTION_UNIVERSAL_IDENTIFIER } from 'src/modules/inbox/constants/inbox-mention.constants';
import {
  INBOX_TEAM_MEMBER_UNIVERSAL_IDENTIFIER,
  INBOX_TEAM_UNIVERSAL_IDENTIFIER,
} from 'src/modules/inbox/constants/inbox-team.constants';
import { INBOX_SAVED_REPLY_UNIVERSAL_IDENTIFIER } from 'src/modules/inbox/objects/inbox-saved-reply.object';
import { AI_ACTION_UNIVERSAL_IDENTIFIER } from 'src/objects/ai-action.object';
import { COMMERCIAL_SIGNAL_UNIVERSAL_IDENTIFIER } from 'src/objects/commercial-signal.object';
import { CUSTOMER_RENEWAL_EVENT_UNIVERSAL_IDENTIFIER } from 'src/objects/customer-renewal-event.object';
import { CUSTOMER_RENEWAL_UNIVERSAL_IDENTIFIER } from 'src/objects/customer-renewal.object';
import { OFFER_UNIVERSAL_IDENTIFIER } from 'src/objects/offer.object';
import { SUCCESS_MILESTONE_UNIVERSAL_IDENTIFIER } from 'src/objects/success-milestone.object';
import { SUCCESS_PLAN_UNIVERSAL_IDENTIFIER } from 'src/objects/success-plan.object';

export const DEFAULT_FUNCTION_ROLE_UNIVERSAL_IDENTIFIER =
  'd1e09000-0000-4000-8000-000000000001';

const readWrite = {
  canReadObjectRecords: true,
  canUpdateObjectRecords: true,
  canSoftDeleteObjectRecords: false,
  canDestroyObjectRecords: false,
};

const readOnly = {
  canReadObjectRecords: true,
  canUpdateObjectRecords: false,
  canSoftDeleteObjectRecords: false,
  canDestroyObjectRecords: false,
};

export default defineApplicationRole({
  universalIdentifier: DEFAULT_FUNCTION_ROLE_UNIVERSAL_IDENTIFIER,
  label: 'Diex CRM function role',
  description:
    'Acesso mínimo para Inbox, inteligência comercial e Customer Success, sem exclusão, configurações ou ferramentas arbitrárias.',
  canReadAllObjectRecords: false,
  canUpdateAllObjectRecords: false,
  canSoftDeleteAllObjectRecords: false,
  canDestroyAllObjectRecords: false,
  canUpdateAllSettings: false,
  canAccessAllTools: false,
  canBeAssignedToAgents: false,
  canBeAssignedToUsers: false,
  canBeAssignedToApiKeys: false,
  permissionFlagUniversalIdentifiers: [SystemPermissionFlag.AI],
  objectPermissions: [
    {
      objectUniversalIdentifier:
        STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
      ...readWrite,
    },
    {
      objectUniversalIdentifier:
        STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company.universalIdentifier,
      ...readWrite,
    },
    {
      objectUniversalIdentifier:
        STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
      ...readWrite,
    },
    {
      objectUniversalIdentifier:
        STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.task.universalIdentifier,
      ...readWrite,
    },
    {
      objectUniversalIdentifier:
        STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.taskTarget.universalIdentifier,
      ...readWrite,
    },
    {
      objectUniversalIdentifier:
        STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.note.universalIdentifier,
      ...readWrite,
    },
    {
      objectUniversalIdentifier:
        STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.noteTarget.universalIdentifier,
      ...readWrite,
    },
    {
      objectUniversalIdentifier:
        STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember
          .universalIdentifier,
      ...readOnly,
    },
    {
      objectUniversalIdentifier: INBOX_CONVERSATION_UNIVERSAL_IDENTIFIER,
      ...readWrite,
    },
    {
      objectUniversalIdentifier: INBOX_CONVERSATION_EVENT_UNIVERSAL_IDENTIFIER,
      ...readWrite,
    },
    {
      objectUniversalIdentifier: INBOX_MESSAGE_UNIVERSAL_IDENTIFIER,
      ...readWrite,
    },
    {
      objectUniversalIdentifier: INBOX_SAVED_REPLY_UNIVERSAL_IDENTIFIER,
      ...readWrite,
    },
    {
      objectUniversalIdentifier: INBOX_LABEL_UNIVERSAL_IDENTIFIER,
      ...readWrite,
    },
    {
      objectUniversalIdentifier: INBOX_CONVERSATION_LABEL_UNIVERSAL_IDENTIFIER,
      ...readWrite,
    },
    {
      objectUniversalIdentifier: INBOX_TEAM_UNIVERSAL_IDENTIFIER,
      ...readWrite,
    },
    {
      objectUniversalIdentifier: INBOX_TEAM_MEMBER_UNIVERSAL_IDENTIFIER,
      ...readWrite,
    },
    {
      objectUniversalIdentifier: INBOX_MENTION_UNIVERSAL_IDENTIFIER,
      ...readWrite,
    },
    {
      objectUniversalIdentifier: INBOX_MACRO_UNIVERSAL_IDENTIFIER,
      ...readWrite,
    },
    {
      objectUniversalIdentifier: COMMERCIAL_SIGNAL_UNIVERSAL_IDENTIFIER,
      ...readWrite,
    },
    {
      objectUniversalIdentifier: SUCCESS_PLAN_UNIVERSAL_IDENTIFIER,
      ...readWrite,
    },
    {
      objectUniversalIdentifier: SUCCESS_MILESTONE_UNIVERSAL_IDENTIFIER,
      ...readWrite,
    },
    {
      objectUniversalIdentifier: CUSTOMER_RENEWAL_UNIVERSAL_IDENTIFIER,
      ...readWrite,
    },
    {
      objectUniversalIdentifier: CUSTOMER_RENEWAL_EVENT_UNIVERSAL_IDENTIFIER,
      ...readWrite,
    },
    {
      objectUniversalIdentifier: AI_ACTION_UNIVERSAL_IDENTIFIER,
      ...readWrite,
    },
    {
      objectUniversalIdentifier: OFFER_UNIVERSAL_IDENTIFIER,
      ...readWrite,
    },
  ],
});
