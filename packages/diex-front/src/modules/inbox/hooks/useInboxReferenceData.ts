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

// Reference data is queried from the workspace when the inbox opens so a role,
// team or macro changed by another operator is never silently reused from an
// older Apollo cache entry.
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
    fetchPolicy: 'network-only',
  });

  const { records: macros } = useFindManyRecords<
    InboxMacro & { __typename: string }
  >({
    objectNameSingular: 'inboxMacro',
    filter: { status: { eq: 'ACTIVE' } },
    orderBy: [{ usageCount: 'DescNullsLast' }, { name: 'AscNullsLast' }],
    limit: 100,
    recordGqlFields: inboxMacroGqlFields,
    fetchPolicy: 'network-only',
  });

  const { records: labels } = useFindManyRecords<
    InboxLabel & { __typename: string }
  >({
    objectNameSingular: 'inboxLabel',
    filter: { status: { eq: 'ACTIVE' } },
    orderBy: [{ usageCount: 'DescNullsLast' }, { name: 'AscNullsLast' }],
    limit: 100,
    recordGqlFields: inboxLabelGqlFields,
    fetchPolicy: 'network-only',
  });

  const { records: workspaceMembers } = useFindManyRecords<
    InboxWorkspaceMember & { __typename: string }
  >({
    objectNameSingular: 'workspaceMember',
    limit: 100,
    recordGqlFields: inboxWorkspaceMemberGqlFields,
    fetchPolicy: 'network-only',
  });

  const { records: teams } = useFindManyRecords<
    InboxTeam & { __typename: string }
  >({
    objectNameSingular: 'inboxTeam',
    filter: { status: { eq: 'ACTIVE' } },
    orderBy: [{ name: 'AscNullsLast' }],
    limit: 100,
    recordGqlFields: inboxTeamGqlFields,
    fetchPolicy: 'network-only',
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
