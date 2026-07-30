import { CoreApiClient } from 'twenty-client-sdk/core';

// A breach is a fact about one conversation, so a run that finds many still has
// to finish inside the minute it shares with the rest of the cycle.
const MAX_CONVERSATIONS_PER_RUN = 50;

export type MarkBreachedResponseSlasResult = {
  marked: number;
};

type BreachedConversation = {
  id: string;
  firstResponseDueAt: string | null;
};

const readBreachedConversations = async (
  client: CoreApiClient,
): Promise<BreachedConversation[]> => {
  const result = (await client.query({
    inboxConversations: {
      __args: {
        filter: {
          and: [
            { status: { in: ['OPEN', 'PENDING'] } },
            { firstRespondedAt: { is: 'NULL' } },
            { slaBreachedAt: { is: 'NULL' } },
            { firstResponseDueAt: { lte: new Date().toISOString() } },
          ],
        },
        first: MAX_CONVERSATIONS_PER_RUN,
        orderBy: [{ firstResponseDueAt: 'AscNullsLast' }],
      },
      edges: { node: { id: true, firstResponseDueAt: true } },
    },
  } as never)) as unknown as {
    inboxConversations?: {
      edges?: Array<{ node?: BreachedConversation | null }>;
    };
  };

  return (result.inboxConversations?.edges ?? [])
    .map((edge) => edge?.node)
    .filter((node): node is BreachedConversation => Boolean(node?.id));
};

// The deadline was set when the message arrived and the reply never came, but
// nothing ever wrote the breach down: the inbox filter for it matched nothing and
// the copilot read every overdue conversation as still inside its SLA.
export const markBreachedResponseSlas =
  async (): Promise<MarkBreachedResponseSlasResult> => {
    const client = new CoreApiClient();
    const breached = await readBreachedConversations(client);

    await Promise.all(
      breached.map((conversation) =>
        client.mutation({
          updateInboxConversation: {
            __args: {
              id: conversation.id,
              data: {
                // The moment the promise was broken, not the moment this cycle
                // noticed, so the record does not depend on cron timing.
                slaBreachedAt: conversation.firstResponseDueAt,
              },
            },
            id: true,
          },
        }),
      ),
    );

    return { marked: breached.length };
  };
