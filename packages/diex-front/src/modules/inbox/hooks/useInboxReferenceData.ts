import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import {
  inboxLabelGqlFields,
  inboxMacroGqlFields,
  inboxSavedReplyGqlFields,
  inboxTeamGqlFields,
  inboxWorkspaceMemberGqlFields,
} from '@/inbox/graphql/inboxRecordGqlFields';
import {
  type InboxLabel,
  type InboxSavedReply,
  type InboxTeam,
  type InboxWorkspaceMember,
} from '@/inbox/types/inboxEntityTypes';
import { type InboxMacro } from '@/inbox/types/inboxMacroTypes';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';

// Reference data an operator picks from while working a conversation: it
// changes rarely, so it loads once per session rather than per conversation.
export const useInboxReferenceData = () => {
  const currentWorkspaceMember = useAtomStateValue(currentWorkspaceMemberState);

  const { records: savedReplies } = useFindManyRecords<
    InboxSavedReply & { __typename: string }
  >({
    objectNameSingular: 'inboxSavedReply',
    filter: { status: { eq: 'ACTIVE' } },
    orderBy: [{ usageCount: 'DescNullsLast' }, { name: 'AscNullsLast' }],
    limit: 100,
    recordGqlFields: inboxSavedReplyGqlFields,
  });

  const { records: macros } = useFindManyRecords<
    InboxMacro & { __typename: string }
  >({
    objectNameSingular: 'inboxMacro',
    filter: { status: { eq: 'ACTIVE' } },
    orderBy: [{ usageCount: 'DescNullsLast' }, { name: 'AscNullsLast' }],
    limit: 100,
    recordGqlFields: inboxMacroGqlFields,
  });

  const { records: labels } = useFindManyRecords<
    InboxLabel & { __typename: string }
  >({
    objectNameSingular: 'inboxLabel',
    filter: { status: { eq: 'ACTIVE' } },
    orderBy: [{ usageCount: 'DescNullsLast' }, { name: 'AscNullsLast' }],
    limit: 100,
    recordGqlFields: inboxLabelGqlFields,
  });

  const { records: workspaceMembers } = useFindManyRecords<
    InboxWorkspaceMember & { __typename: string }
  >({
    objectNameSingular: 'workspaceMember',
    limit: 100,
    recordGqlFields: inboxWorkspaceMemberGqlFields,
  });

  const { records: teams } = useFindManyRecords<
    InboxTeam & { __typename: string }
  >({
    objectNameSingular: 'inboxTeam',
    filter: { status: { eq: 'ACTIVE' } },
    orderBy: [{ name: 'AscNullsLast' }],
    limit: 100,
    recordGqlFields: inboxTeamGqlFields,
  });

  return {
    savedReplies,
    macros,
    labels,
    workspaceMembers,
    teams,
    currentWorkspaceMemberId: currentWorkspaceMember?.id ?? null,
  };
};
