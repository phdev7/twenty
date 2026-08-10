import { useCallback, useEffect, useMemo, useState } from 'react';

import { inboxMessageGqlFields } from '@/inbox/graphql/inboxRecordGqlFields';
import { INBOX_MESSAGE_PAGE_SIZE } from '@/inbox/constants/INBOX_MESSAGE_PAGE_SIZE';
import { type InboxMessage } from '@/inbox/types/inboxEntityTypes';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';

export const useInboxMessagesQuery = (
  selectedConversationId: string | null,
) => {
  const [messageLimit, setMessageLimit] = useState(INBOX_MESSAGE_PAGE_SIZE);

  // Changing conversation starts the thread at its newest page again.
  useEffect(() => {
    setMessageLimit(INBOX_MESSAGE_PAGE_SIZE);
  }, [selectedConversationId]);

  const {
    records: newestFirstMessages,
    loading: isLoadingMessages,
    refetch: refetchMessages,
  } = useFindManyRecords<InboxMessage & { __typename: string }>({
    objectNameSingular: 'inboxMessage',
    filter: selectedConversationId
      ? { inboxConversationId: { eq: selectedConversationId } }
      : undefined,
    orderBy: [{ sentAt: 'DescNullsLast' }],
    limit: messageLimit,
    recordGqlFields: inboxMessageGqlFields,
    fetchPolicy: 'cache-and-network',
    skip: selectedConversationId === null,
  });

  const messages = useMemo(
    () => [...newestFirstMessages].reverse(),
    [newestFirstMessages],
  );
  const hasOlderMessages = newestFirstMessages.length >= messageLimit;

  const loadOlderMessages = useCallback(() => {
    setMessageLimit((currentLimit) => currentLimit + INBOX_MESSAGE_PAGE_SIZE);
  }, []);

  return {
    messages,
    isLoadingMessages: selectedConversationId !== null && isLoadingMessages,
    hasOlderMessages,
    loadOlderMessages,
    refetchMessages,
  };
};
