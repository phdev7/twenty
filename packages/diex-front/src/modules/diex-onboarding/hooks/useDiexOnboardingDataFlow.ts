import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { type OnboardingOfferSummary } from '@/diex-onboarding/types/diexOnboardingTypes';

type OnboardingOfferRecord = ObjectRecord & OnboardingOfferSummary;

// Cheap totals to show that messages are flowing: nobody needs the records
// themselves here, just how many exist.
export const useDiexOnboardingDataFlow = () => {
  const {
    totalCount: conversationCount,
    loading: isLoadingConversations,
    error: conversationError,
    refetch: refetchConversationCount,
  } = useFindManyRecords({
    objectNameSingular: 'inboxConversation',
    limit: 1,
    recordGqlFields: { id: true },
    fetchPolicy: 'network-only',
  });

  const {
    totalCount: messageCount,
    loading: isLoadingMessages,
    error: messageError,
    refetch: refetchMessageCount,
  } = useFindManyRecords({
    objectNameSingular: 'inboxMessage',
    limit: 1,
    recordGqlFields: { id: true },
    fetchPolicy: 'network-only',
  });

  const {
    totalCount: peopleCount,
    loading: isLoadingPeople,
    error: peopleError,
    refetch: refetchPeopleCount,
  } = useFindManyRecords({
    objectNameSingular: 'person',
    limit: 1,
    recordGqlFields: { id: true },
    fetchPolicy: 'network-only',
  });

  const {
    totalCount: opportunityCount,
    loading: isLoadingOpportunities,
    error: opportunityError,
    refetch: refetchOpportunityCount,
  } = useFindManyRecords({
    objectNameSingular: 'opportunity',
    limit: 1,
    recordGqlFields: { id: true },
    fetchPolicy: 'network-only',
  });

  const {
    totalCount: taskCount,
    loading: isLoadingTasks,
    error: taskError,
    refetch: refetchTaskCount,
  } = useFindManyRecords({
    objectNameSingular: 'task',
    limit: 1,
    recordGqlFields: { id: true },
    fetchPolicy: 'network-only',
  });

  const {
    records: offers,
    totalCount: offerCount,
    loading: isLoadingOffers,
    error: offerError,
    refetch: refetchOfferCount,
  } = useFindManyRecords<OnboardingOfferRecord>({
    objectNameSingular: 'offer',
    limit: 50,
    recordGqlFields: {
      id: true,
      name: true,
      status: true,
      valueProposition: { markdown: true },
    },
    fetchPolicy: 'network-only',
  });
  const offerSummaries = offers.map(
    ({ id, name, status, valueProposition }) => ({
      id,
      name,
      status,
      valueProposition,
    }),
  );
  const activeOfferCount = offerSummaries.filter(
    ({ status }) => status === 'ACTIVE',
  ).length;
  const draftOfferCount = offerSummaries.filter(
    ({ status }) => status === 'DRAFT',
  ).length;
  const sourceStates = [
    [
      'conversations',
      conversationCount,
      isLoadingConversations,
      conversationError,
    ],
    ['messages', messageCount, isLoadingMessages, messageError],
    ['people', peopleCount, isLoadingPeople, peopleError],
    [
      'opportunities',
      opportunityCount,
      isLoadingOpportunities,
      opportunityError,
    ],
    ['tasks', taskCount, isLoadingTasks, taskError],
    ['offers', offerCount, isLoadingOffers, offerError],
  ] as const;
  const unconfirmedSources = sourceStates
    .filter(
      ([, count, loading, error]) => loading || count == null || Boolean(error),
    )
    .map(([source]) => source);
  const firstError = sourceStates.find(([, , , error]) => Boolean(error))?.[3];

  const refetchDataFlow = async (): Promise<void> => {
    await Promise.allSettled([
      refetchConversationCount(),
      refetchMessageCount(),
      refetchPeopleCount(),
      refetchOpportunityCount(),
      refetchTaskCount(),
      refetchOfferCount(),
    ]);
  };

  return {
    dataFlow: {
      conversationCount: conversationCount ?? 0,
      messageCount: messageCount ?? 0,
      peopleCount: peopleCount ?? 0,
      opportunityCount: opportunityCount ?? 0,
      taskCount: taskCount ?? 0,
      offerCount: offerCount ?? 0,
      activeOfferCount,
      draftOfferCount,
      offers: offerSummaries,
      isLoading: sourceStates.some(([, , loading]) => loading),
      unconfirmedSources,
      errorMessage: firstError?.message ?? null,
    },
    refetchDataFlow,
  };
};
