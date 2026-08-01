import { DIEX_CORE_APPLICATION_UNIVERSAL_IDENTIFIER } from 'twenty-shared/application';

import { type AllStandardObjectName } from 'src/engine/workspace-manager/twenty-standard-application/types/all-standard-object-name.type';

export const METADATA_IDENTITY_APPLICATION_UNIVERSAL_IDENTIFIER_BY_STANDARD_OBJECT_NAME =
  {
    inboxAutomation: DIEX_CORE_APPLICATION_UNIVERSAL_IDENTIFIER,
    inboxConversation: DIEX_CORE_APPLICATION_UNIVERSAL_IDENTIFIER,
    inboxConversationEvent: DIEX_CORE_APPLICATION_UNIVERSAL_IDENTIFIER,
    inboxConversationLabel: DIEX_CORE_APPLICATION_UNIVERSAL_IDENTIFIER,
    inboxLabel: DIEX_CORE_APPLICATION_UNIVERSAL_IDENTIFIER,
    inboxMacro: DIEX_CORE_APPLICATION_UNIVERSAL_IDENTIFIER,
    inboxMention: DIEX_CORE_APPLICATION_UNIVERSAL_IDENTIFIER,
    inboxMessage: DIEX_CORE_APPLICATION_UNIVERSAL_IDENTIFIER,
    inboxSavedReply: DIEX_CORE_APPLICATION_UNIVERSAL_IDENTIFIER,
    inboxTeam: DIEX_CORE_APPLICATION_UNIVERSAL_IDENTIFIER,
    inboxTeamMember: DIEX_CORE_APPLICATION_UNIVERSAL_IDENTIFIER,
  } as const satisfies Partial<Record<AllStandardObjectName, string>>;
