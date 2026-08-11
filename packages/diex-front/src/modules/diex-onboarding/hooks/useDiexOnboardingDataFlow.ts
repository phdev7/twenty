import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { type OnboardingOfferSummary } from '@/diex-onboarding/types/diexOnboardingTypes';

type OnboardingOfferRecord = ObjectRecord & OnboardingOfferSummary;

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

  const {
    records: offers,
    totalCount: offerCount,
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
  });
  const offerSummaries = offers.map(({ id, name, status, valueProposition }) => ({
    id,
    name,
    status,
    valueProposition,
  }));
  const activeOfferCount = offerSummaries.filter(
    ({ status }) => status === 'ACTIVE',
  ).length;
  const draftOfferCount = offerSummaries.filter(
    ({ status }) => status === 'DRAFT',
  ).length;

  const refetchDataFlow = async (): Promise<void> => {
    await Promise.all([
      refetchConversationCount(),
      refetchMessageCount(),
      refetchPeopleCount(),
      refetchOfferCount(),
    ]);
  };

  return {
    dataFlow: {
      conversationCount: conversationCount ?? 0,
      messageCount: messageCount ?? 0,
      peopleCount: peopleCount ?? 0,
      offerCount: offerCount ?? 0,
      activeOfferCount,
      draftOfferCount,
      offers: offerSummaries,
    },
    refetchDataFlow,
  };
};
