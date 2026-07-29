import { useCallback, useEffect, useRef, useState } from 'react';
import { CoreApiClient } from 'twenty-client-sdk/core';

import {
  type InboxConversationEvent,
  type InboxRecordReference,
} from 'src/modules/inbox/front-components/types/inbox.types';

type ConversationEventQueryResult = {
  inboxConversationEvents?: {
    edges?: Array<{
      node: InboxConversationEvent;
    }>;
  };
};

type CreateConversationEventResult = {
  createInboxConversationEvent?: InboxConversationEvent | null;
};

type RecordConversationEventInput = {
  conversationId: string;
  eventType: string;
  summary: string;
  details?: string | null;
};

const createEventKey = (eventType: string): string => {
  const randomPart =
    typeof globalThis.crypto?.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `event:${eventType.toLowerCase()}:${randomPart}`;
};

export const useInboxConversationActivity = ({
  selectedConversationId,
  currentWorkspaceMemberId,
}: {
  selectedConversationId: string | null;
  currentWorkspaceMemberId: string | null;
}) => {
  const [conversationEvents, setConversationEvents] = useState<
    InboxConversationEvent[]
  >([]);
  const requestVersionRef = useRef(0);

  const loadConversationEvents = useCallback(
    async (conversationId: string): Promise<void> => {
      const requestVersion = requestVersionRef.current + 1;

      requestVersionRef.current = requestVersion;

      try {
        const queryResult = (await new CoreApiClient().query({
          inboxConversationEvents: {
            __args: {
              filter: {
                inboxConversationId: {
                  eq: conversationId,
                },
              },
              first: 50,
              orderBy: [{ occurredAt: 'AscNullsLast' }],
            },
            edges: {
              node: {
                id: true,
                name: true,
                eventType: true,
                summary: true,
                details: true,
                occurredAt: true,
                inboxConversation: {
                  id: true,
                  name: true,
                },
                actor: {
                  id: true,
                  name: {
                    firstName: true,
                    lastName: true,
                  },
                  avatarUrl: true,
                },
              },
            },
          },
        } as never)) as unknown as ConversationEventQueryResult;

        if (requestVersion === requestVersionRef.current) {
          setConversationEvents(
            queryResult.inboxConversationEvents?.edges?.map(
              ({ node }) => node,
            ) ?? [],
          );
        }
      } catch {
        if (requestVersion === requestVersionRef.current) {
          setConversationEvents([]);
        }
      }
    },
    [],
  );

  useEffect(() => {
    if (selectedConversationId === null) {
      requestVersionRef.current += 1;
      setConversationEvents([]);
      return;
    }

    void loadConversationEvents(selectedConversationId);
  }, [loadConversationEvents, selectedConversationId]);

  const recordConversationEvent = useCallback(
    async ({
      conversationId,
      eventType,
      summary,
      details = null,
    }: RecordConversationEventInput): Promise<boolean> => {
      const normalizedSummary = summary.trim();

      if (!normalizedSummary) {
        return false;
      }

      const occurredAt = new Date().toISOString();

      try {
        const result = (await new CoreApiClient().mutation({
          createInboxConversationEvent: {
            __args: {
              data: {
                name: createEventKey(eventType),
                eventType,
                summary: normalizedSummary.slice(0, 500),
                details: details?.trim().slice(0, 2_000) || null,
                occurredAt,
                inboxConversationId: conversationId,
                actorId: currentWorkspaceMemberId,
              },
            },
            id: true,
            name: true,
            eventType: true,
            summary: true,
            details: true,
            occurredAt: true,
            actor: {
              id: true,
              name: {
                firstName: true,
                lastName: true,
              },
              avatarUrl: true,
            },
          },
        } as never)) as unknown as CreateConversationEventResult;
        const createdEvent = result.createInboxConversationEvent;

        if (!createdEvent?.id) {
          return false;
        }

        if (conversationId === selectedConversationId) {
          const conversationReference: InboxRecordReference = {
            id: conversationId,
          };

          setConversationEvents((current) =>
            [
              ...current,
              {
                ...createdEvent,
                inboxConversation: conversationReference,
              },
            ].sort(
              (left, right) =>
                new Date(left.occurredAt ?? 0).getTime() -
                new Date(right.occurredAt ?? 0).getTime(),
            ),
          );
        }

        return true;
      } catch {
        return false;
      }
    },
    [currentWorkspaceMemberId, selectedConversationId],
  );

  return {
    conversationEvents,
    loadConversationEvents,
    recordConversationEvent,
  };
};
