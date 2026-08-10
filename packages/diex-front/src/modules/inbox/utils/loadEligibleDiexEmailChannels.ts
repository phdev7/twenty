import { type ApolloClient } from '@apollo/client';

import { FIND_ELIGIBLE_DIEX_EMAIL_CHANNELS } from '@/inbox/graphql/inboxEmailSyncQueries';
import { type DiexEmailChannel } from '@/inbox/types/diexEmailSyncTypes';

export const loadEligibleDiexEmailChannels = async (
  apolloClient: ApolloClient,
): Promise<DiexEmailChannel[]> => {
  const { data } = await apolloClient.query<{
    myMessageChannels?: DiexEmailChannel[];
  }>({
    query: FIND_ELIGIBLE_DIEX_EMAIL_CHANNELS,
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
