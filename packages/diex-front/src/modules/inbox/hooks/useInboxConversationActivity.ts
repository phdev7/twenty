import { useCallback } from 'react';

import { inboxConversationEventGqlFields } from '@/inbox/graphql/inboxRecordGqlFields';
import { type InboxConversationEvent } from '@/inbox/types/inboxEntityTypes';
import { useCreateOneRecord } from '@/object-record/hooks/useCreateOneRecord';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';

type RecordConversationEventInput = {
  conversationId: string;
  eventType: string;
  summary: string;
  details?: string | null;
};

export const useInboxConversationActivity = ({
  selectedConversationId,
  currentWorkspaceMemberId,
}: {
  selectedConversationId: string | null;
  currentWorkspaceMemberId: string | null;
}) => {
  const { records: conversationEvents, refetch: refetchConversationEvents } =
    useFindManyRecords<InboxConversationEvent & { __typename: string }>({
      objectNameSingular: 'inboxConversationEvent',
      filter: selectedConversationId
        ? { inboxConversationId: { eq: selectedConversationId } }
        : undefined,
      orderBy: [{ occurredAt: 'AscNullsLast' }],
      limit: 50,
      recordGqlFields: inboxConversationEventGqlFields,
      fetchPolicy: 'network-only',
      skip: selectedConversationId === null,
    });

  const { createOneRecord: createConversationEvent } = useCreateOneRecord({
    objectNameSingular: 'inboxConversationEvent',
    recordGqlFields: inboxConversationEventGqlFields,
  });

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
      const randomPart =
        typeof globalThis.crypto?.randomUUID === 'function'
          ? globalThis.crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      try {
        const createdEvent = await createConversationEvent({
          name: `event:${eventType.toLowerCase()}:${randomPart}`,
          eventType,
          summary: normalizedSummary.slice(0, 500),
          details: details?.trim().slice(0, 2_000) || null,
          occurredAt,
          inboxConversationId: conversationId,
          actorId: currentWorkspaceMemberId,
        });

        if (!createdEvent?.id) {
          return false;
        }

        if (conversationId === selectedConversationId) {
          void refetchConversationEvents();
        }

        return true;
      } catch {
        return false;
      }
    },
    [
      createConversationEvent,
      currentWorkspaceMemberId,
      refetchConversationEvents,
      selectedConversationId,
    ],
  );

  return {
    conversationEvents,
    recordConversationEvent,
    refetchConversationEvents,
  };
};
