import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';

// Cheap totals to show that messages are flowing: nobody needs the records
// themselves here, just how many exist.
export const useDiexOnboardingDataFlow = () => {
  const { totalCount: conversationCount, refetch: refetchConversationCount } =
    useFindManyRecords({
      objectNameSingular: 'inboxConversation',
      limit: 1,
      recordGqlFields: { id: true },
    });

  const { totalCount: messageCount, refetch: refetchMessageCount } =
    useFindManyRecords({
      objectNameSingular: 'inboxMessage',
      limit: 1,
      recordGqlFields: { id: true },
    });

  const { totalCount: peopleCount, refetch: refetchPeopleCount } =
    useFindManyRecords({
      objectNameSingular: 'person',
      limit: 1,
      recordGqlFields: { id: true },
    });

  const refetchDataFlow = async (): Promise<void> => {
    await Promise.all([
      refetchConversationCount(),
      refetchMessageCount(),
      refetchPeopleCount(),
    ]);
  };

  return {
    dataFlow: {
      conversationCount: conversationCount ?? 0,
      messageCount: messageCount ?? 0,
      peopleCount: peopleCount ?? 0,
    },
    refetchDataFlow,
  };
};
