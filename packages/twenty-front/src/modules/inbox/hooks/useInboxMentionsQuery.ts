import { useCallback, useMemo } from 'react';

import { inboxMentionGqlFields } from '@/inbox/graphql/inboxRecordGqlFields';
import { type InboxMention } from '@/inbox/types/inboxEntityTypes';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';

export const useInboxMentionsQuery = ({
  selectedConversationId,
  currentWorkspaceMemberId,
}: {
  selectedConversationId: string | null;
  currentWorkspaceMemberId: string | null;
}) => {
  const {
    records: conversationMentions,
    refetch: refetchConversationMentions,
  } = useFindManyRecords<InboxMention & { __typename: string }>({
    objectNameSingular: 'inboxMention',
    filter: selectedConversationId
      ? { inboxConversationId: { eq: selectedConversationId } }
      : undefined,
    orderBy: [{ mentionedAt: 'DescNullsLast' }],
    limit: 200,
    recordGqlFields: inboxMentionGqlFields,
    fetchPolicy: 'cache-and-network',
    skip: selectedConversationId === null,
  });

  const {
    records: memberMentions,
    loading: isLoadingMemberMentions,
    error: memberMentionsError,
    refetch: refetchMemberMentions,
  } = useFindManyRecords<InboxMention & { __typename: string }>({
    objectNameSingular: 'inboxMention',
    filter: currentWorkspaceMemberId
      ? { mentionedWorkspaceMemberId: { eq: currentWorkspaceMemberId } }
      : undefined,
    orderBy: [{ mentionedAt: 'DescNullsLast' }],
    limit: 500,
    recordGqlFields: inboxMentionGqlFields,
    fetchPolicy: 'cache-and-network',
    skip: currentWorkspaceMemberId === null,
  });

  const pendingMentions = useMemo(
    () => memberMentions.filter(({ status }) => status !== 'RESOLVED'),
    [memberMentions],
  );

  const refetchMentions = useCallback(async (): Promise<void> => {
    await Promise.all([refetchConversationMentions(), refetchMemberMentions()]);
  }, [refetchConversationMentions, refetchMemberMentions]);

  const arePendingMentionsLoaded =
    currentWorkspaceMemberId !== null &&
    !isLoadingMemberMentions &&
    memberMentionsError === undefined;

  return {
    conversationMentions,
    pendingMentions,
    arePendingMentionsLoaded,
    refetchMentions,
  };
};
