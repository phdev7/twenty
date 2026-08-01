import { type ApolloClient } from '@apollo/client';

import { FIND_ELIGIBLE_TWENTY_EMAIL_CHANNELS } from '@/inbox/graphql/inboxEmailSyncQueries';
import { type TwentyEmailChannel } from '@/inbox/types/twentyEmailSyncTypes';

export const loadEligibleTwentyEmailChannels = async (
  apolloClient: ApolloClient,
): Promise<TwentyEmailChannel[]> => {
  const { data } = await apolloClient.query<{
    myMessageChannels?: TwentyEmailChannel[];
  }>({
    query: FIND_ELIGIBLE_TWENTY_EMAIL_CHANNELS,
    fetchPolicy: 'network-only',
  });

  return (data?.myMessageChannels ?? []).filter(
    (channel) =>
      (channel.type === 'EMAIL' || channel.type === 'EMAIL_GROUP') &&
      channel.isSyncEnabled &&
      channel.connectedAccount?.archivedAt == null &&
      (channel.visibility === 'SHARE_EVERYTHING' ||
        channel.type === 'EMAIL_GROUP'),
  );
};
