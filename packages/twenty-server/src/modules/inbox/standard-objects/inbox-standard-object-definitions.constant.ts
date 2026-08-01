import { type ObjectManifest } from 'twenty-shared/application';

import { InboxAutomationStandardObjectDefinition } from 'src/modules/inbox/standard-objects/inbox-automation.standard-object-definition';
import { InboxConversationEventStandardObjectDefinition } from 'src/modules/inbox/standard-objects/inbox-conversation-event.standard-object-definition';
import { InboxConversationLabelStandardObjectDefinition } from 'src/modules/inbox/standard-objects/inbox-conversation-label.standard-object-definition';
import { InboxConversationStandardObjectDefinition } from 'src/modules/inbox/standard-objects/inbox-conversation.standard-object-definition';
import { InboxLabelStandardObjectDefinition } from 'src/modules/inbox/standard-objects/inbox-label.standard-object-definition';
import { InboxMacroStandardObjectDefinition } from 'src/modules/inbox/standard-objects/inbox-macro.standard-object-definition';
import { InboxMentionStandardObjectDefinition } from 'src/modules/inbox/standard-objects/inbox-mention.standard-object-definition';
import { InboxMessageStandardObjectDefinition } from 'src/modules/inbox/standard-objects/inbox-message.standard-object-definition';
import { InboxSavedReplyStandardObjectDefinition } from 'src/modules/inbox/standard-objects/inbox-saved-reply.standard-object-definition';
import { InboxTeamMemberStandardObjectDefinition } from 'src/modules/inbox/standard-objects/inbox-team-member.standard-object-definition';
import { InboxTeamStandardObjectDefinition } from 'src/modules/inbox/standard-objects/inbox-team.standard-object-definition';

export const INBOX_STANDARD_OBJECT_DEFINITIONS = [
  InboxConversationStandardObjectDefinition,
  InboxMessageStandardObjectDefinition,
  InboxConversationEventStandardObjectDefinition,
  InboxLabelStandardObjectDefinition,
  InboxConversationLabelStandardObjectDefinition,
  InboxTeamStandardObjectDefinition,
  InboxTeamMemberStandardObjectDefinition,
  InboxMacroStandardObjectDefinition,
  InboxSavedReplyStandardObjectDefinition,
  InboxMentionStandardObjectDefinition,
  InboxAutomationStandardObjectDefinition,
] satisfies ObjectManifest[];
