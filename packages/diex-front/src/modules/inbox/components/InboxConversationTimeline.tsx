import { useState } from 'react';
import { styled } from '@linaria/react';
import {
  IconAt,
  IconCheck,
  IconMessage,
  IconNotes,
  IconTimelineEvent,
} from 'diex-ui/icon';
import { themeCssVariables } from 'diex-ui/theme-constants';

import {
  InboxMessageMedia,
  InboxMessageTranscription,
} from '@/inbox/components/InboxMessageMedia';
import {
  type InboxConversationEvent,
  type InboxMention,
  type InboxMessage,
} from '@/inbox/types/inboxEntityTypes';
import { type EvolutionMediaPayload } from '@/inbox/types/inboxExternalMessageTypes';
import { getRecordName } from '@/inbox/utils/getRecordName';
import {
  formatMessageTime,
  getMessageTypeLabel,
} from '@/inbox/utils/inboxFormatters';

const StyledMessageList = styled.div`
  background: ${themeCssVariables.background.secondary};
  display: flex;
  flex: 1;
  flex-direction: column-reverse;
  gap: ${themeCssVariables.spacing[3]};
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledEmptyState = styled.div`
  align-items: center;
  color: ${themeCssVariables.font.color.tertiary};
  display: flex;
  flex: 1;
  flex-direction: column;
  font-size: ${themeCssVariables.font.size.sm};
  gap: ${themeCssVariables.spacing[2]};
  justify-content: center;
  padding: ${themeCssVariables.spacing[6]};
  text-align: center;
`;

const StyledActivityEventRow = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
`;

const StyledActivityEvent = styled.article`
  align-items: flex-start;
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.pill};
  color: ${themeCssVariables.font.color.secondary};
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  max-width: 86%;
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
`;

const StyledActivityEventIcon = styled.div`
  align-items: center;
  background: ${themeCssVariables.background.tertiary};
  border-radius: ${themeCssVariables.border.radius.rounded};
  color: ${themeCssVariables.color.blue};
  display: flex;
  flex-shrink: 0;
  height: ${themeCssVariables.spacing[6]};
  justify-content: center;
  width: ${themeCssVariables.spacing[6]};
`;

const StyledActivityEventSummary = styled.strong`
  color: ${themeCssVariables.font.color.primary};
  display: block;
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledActivityEventDetails = styled.p`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.xxs};
  line-height: 1.45;
  margin: ${themeCssVariables.spacing[1]} 0 0;
  white-space: pre-wrap;
`;

const StyledActivityEventMeta = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xxs};
  margin-top: ${themeCssVariables.spacing[1]};
`;

const StyledMessageRow = styled.div`
  display: flex;
  width: 100%;
`;

const StyledMessageBubble = styled.article<{
  kind: 'internal' | 'outgoing' | 'incoming';
}>`
  background: ${({ kind }) =>
    kind === 'internal'
      ? themeCssVariables.color.yellow2
      : kind === 'outgoing'
        ? themeCssVariables.background.transparent.blue
        : themeCssVariables.background.primary};
  border: 1px solid
    ${({ kind }) =>
      kind === 'internal'
        ? themeCssVariables.color.yellow6
        : themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  box-sizing: border-box;
  margin-left: ${({ kind }) => (kind === 'incoming' ? '0' : 'auto')};
  margin-right: ${({ kind }) => (kind === 'outgoing' ? '0' : 'auto')};
  max-width: ${({ kind }) => (kind === 'internal' ? '86%' : '76%')};
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
`;

const StyledMessageSender = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.xxs};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  margin-bottom: ${themeCssVariables.spacing[1]};
`;

const StyledMessageText = styled.p`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.5;
  margin: 0;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
`;

const StyledMessageMeta = styled.div`
  align-items: center;
  color: ${themeCssVariables.font.color.tertiary};
  display: flex;
  font-size: ${themeCssVariables.font.size.xxs};
  gap: ${themeCssVariables.spacing[1]};
  justify-content: flex-end;
  margin-top: ${themeCssVariables.spacing[1]};
`;

const StyledMentionChips = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[1]};
  margin-top: ${themeCssVariables.spacing[2]};
`;

const StyledMentionChip = styled.span<{ isPending: boolean }>`
  align-items: center;
  background: ${({ isPending }) =>
    isPending
      ? themeCssVariables.tag.background.blue
      : themeCssVariables.tag.background.gray};
  border: 1px solid
    ${({ isPending }) =>
      isPending
        ? themeCssVariables.border.color.blue
        : themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.pill};
  color: ${({ isPending }) =>
    isPending
      ? themeCssVariables.tag.text.blue
      : themeCssVariables.tag.text.gray};
  display: inline-flex;
  font-size: ${themeCssVariables.font.size.xxs};
  font-weight: ${themeCssVariables.font.weight.medium};
  gap: ${themeCssVariables.spacing[1]};
  min-height: ${themeCssVariables.spacing[6]};
  padding: 0 ${themeCssVariables.spacing[2]};
`;

const StyledMentionResolveButton = styled.button`
  align-items: center;
  background: transparent;
  border: 0;
  color: inherit;
  cursor: pointer;
  display: inline-flex;
  font-family: ${themeCssVariables.font.family};
  font-size: ${themeCssVariables.font.size.xxs};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  gap: ${themeCssVariables.spacing['0.5']};
  padding: 0;
`;

const StyledLoadMoreButton = styled.button`
  background: transparent;
  border: 0;
  border-top: 1px solid ${themeCssVariables.border.color.light};
  color: ${themeCssVariables.font.color.secondary};
  cursor: pointer;
  font-family: ${themeCssVariables.font.family};
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.medium};
  padding: ${themeCssVariables.spacing[3]};
  width: 100%;
`;

const StyledActivityToggle = styled.button`
  align-items: center;
  align-self: center;
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.pill};
  color: ${themeCssVariables.font.color.tertiary};
  cursor: pointer;
  display: inline-flex;
  font-family: ${themeCssVariables.font.family};
  font-size: ${themeCssVariables.font.size.xxs};
  font-weight: ${themeCssVariables.font.weight.medium};
  gap: ${themeCssVariables.spacing[1]};
  padding: ${themeCssVariables.spacing[1]} ${themeCssVariables.spacing[3]};
`;

const MEDIA_MESSAGE_TYPES = ['IMAGE', 'AUDIO', 'VIDEO', 'DOCUMENT'];

const getDeliveryStatusLabel = (status: string): string =>
  ({
    RECEIVED: 'recebida',
    QUEUED: 'na fila',
    SENT: 'enviada',
    DELIVERED: 'entregue',
    READ: 'lida',
    FAILED: 'falhou',
  })[status] ?? status.toLowerCase();

type TimelineEntry =
  | { kind: 'MESSAGE'; occurredAt?: string | null; message: InboxMessage }
  | {
      kind: 'EVENT';
      occurredAt?: string | null;
      event: InboxConversationEvent;
    };

type InboxConversationTimelineProps = {
  conversationName: string;
  messages: InboxMessage[];
  events: InboxConversationEvent[];
  mentions: InboxMention[];
  currentWorkspaceMemberId: string | null;
  isLoading: boolean;
  hasOlderMessages: boolean;
  onLoadOlderMessages: () => void;
  onLoadMessageMedia: (
    inboxMessageId: string,
  ) => Promise<EvolutionMediaPayload | null>;
  isBusy: boolean;
  onResolveMention: (mentionId: string) => void;
};

export const InboxConversationTimeline = ({
  conversationName,
  messages,
  events,
  mentions,
  currentWorkspaceMemberId,
  isLoading,
  hasOlderMessages,
  onLoadOlderMessages,
  onLoadMessageMedia,
  isBusy,
  onResolveMention,
}: InboxConversationTimelineProps) => {
  const [isActivityVisible, setIsActivityVisible] = useState(false);
  const [mediaByMessageId, setMediaByMessageId] = useState<
    Record<string, EvolutionMediaPayload | 'loading'>
  >({});

  const timelineEntries: TimelineEntry[] = [
    ...messages.map(
      (message): TimelineEntry => ({
        kind: 'MESSAGE',
        occurredAt: message.sentAt,
        message,
      }),
    ),
    ...(isActivityVisible
      ? events.map(
          (event): TimelineEntry => ({
            kind: 'EVENT',
            occurredAt: event.occurredAt,
            event,
          }),
        )
      : []),
  ].sort((left, right) => {
    const timeDifference =
      new Date(left.occurredAt ?? 0).getTime() -
      new Date(right.occurredAt ?? 0).getTime();

    return timeDifference !== 0
      ? timeDifference
      : left.kind.localeCompare(right.kind);
  });

  const handleLoadMedia = async (messageId: string) => {
    setMediaByMessageId((current) => ({ ...current, [messageId]: 'loading' }));

    const loaded = await onLoadMessageMedia(messageId);

    setMediaByMessageId((current) => {
      const next = { ...current };

      if (loaded) {
        next[messageId] = loaded;
      } else {
        delete next[messageId];
      }

      return next;
    });
  };

  return (
    <StyledMessageList>
      {isLoading ? (
        <StyledEmptyState>Carregando mensagens...</StyledEmptyState>
      ) : timelineEntries.length === 0 ? (
        <StyledEmptyState>
          <IconMessage
            size={themeCssVariables.icon.size.xl}
            stroke={themeCssVariables.icon.stroke.sm}
          />
          Esta conversa ainda não possui mensagens ou eventos.
        </StyledEmptyState>
      ) : (
        [...timelineEntries].reverse().map((entry) => {
          if (entry.kind === 'EVENT') {
            const event = entry.event;

            return (
              <StyledActivityEventRow key={`event:${event.id}`}>
                <StyledActivityEvent>
                  <StyledActivityEventIcon>
                    <IconTimelineEvent
                      size={themeCssVariables.icon.size.sm}
                      stroke={themeCssVariables.icon.stroke.md}
                    />
                  </StyledActivityEventIcon>
                  <div>
                    <StyledActivityEventSummary>
                      {event.summary}
                    </StyledActivityEventSummary>
                    {event.details ? (
                      <StyledActivityEventDetails>
                        {event.details}
                      </StyledActivityEventDetails>
                    ) : null}
                    <StyledActivityEventMeta>
                      {getRecordName(event.actor) || 'Automação Diex'} ·{' '}
                      {formatMessageTime(event.occurredAt)}
                    </StyledActivityEventMeta>
                  </div>
                </StyledActivityEvent>
              </StyledActivityEventRow>
            );
          }

          const message = entry.message;
          const isOutgoing = message.direction === 'OUTBOUND';
          const isInternal = message.isInternalNote;
          const senderName = isInternal
            ? 'Nota interna'
            : message.senderDisplayName ||
              (isOutgoing ? 'Equipe comercial' : conversationName);
          const messageMentions = mentions.filter(
            (mention) => mention.inboxMessage?.id === message.id,
          );

          return (
            <StyledMessageRow key={`message:${message.id}`}>
              <StyledMessageBubble
                kind={
                  isInternal ? 'internal' : isOutgoing ? 'outgoing' : 'incoming'
                }
              >
                <StyledMessageSender>
                  {isInternal ? (
                    <IconNotes
                      size={themeCssVariables.icon.size.sm}
                      stroke={themeCssVariables.icon.stroke.sm}
                    />
                  ) : isOutgoing ? (
                    <IconMessage
                      size={themeCssVariables.icon.size.sm}
                      stroke={themeCssVariables.icon.stroke.sm}
                    />
                  ) : null}{' '}
                  {senderName}
                </StyledMessageSender>
                <StyledMessageText>
                  {message.body || getMessageTypeLabel(message.messageType)}
                </StyledMessageText>
                {messageMentions.length > 0 ? (
                  <StyledMentionChips>
                    {messageMentions.map((mention) => {
                      const isCurrentMemberMention =
                        mention.mentionedWorkspaceMember?.id ===
                        currentWorkspaceMemberId;
                      const isPending =
                        isCurrentMemberMention && mention.status !== 'RESOLVED';

                      return (
                        <StyledMentionChip
                          key={mention.id}
                          isPending={isPending}
                        >
                          <IconAt
                            size={themeCssVariables.icon.size.sm}
                            stroke={themeCssVariables.icon.stroke.md}
                          />
                          {getRecordName(mention.mentionedWorkspaceMember) ||
                            'Usuário removido'}
                          {isPending ? (
                            <StyledMentionResolveButton
                              type="button"
                              disabled={isBusy}
                              onClick={() => onResolveMention(mention.id)}
                            >
                              <IconCheck
                                size={themeCssVariables.icon.size.sm}
                                stroke={themeCssVariables.icon.stroke.md}
                              />
                              Resolver
                            </StyledMentionResolveButton>
                          ) : null}
                        </StyledMentionChip>
                      );
                    })}
                  </StyledMentionChips>
                ) : null}
                {message.messageType === 'AUDIO' ? (
                  <InboxMessageTranscription
                    transcription={message.transcription}
                    status={message.transcriptionStatus}
                  />
                ) : null}
                {MEDIA_MESSAGE_TYPES.includes(message.messageType) &&
                !isInternal ? (
                  <InboxMessageMedia
                    media={mediaByMessageId[message.id]}
                    messageType={message.messageType}
                    onLoad={() => void handleLoadMedia(message.id)}
                  />
                ) : null}
                <StyledMessageMeta>
                  {formatMessageTime(message.sentAt)}
                  {!isInternal && isOutgoing ? (
                    <span>
                      · {getDeliveryStatusLabel(message.deliveryStatus)}
                    </span>
                  ) : null}
                </StyledMessageMeta>
              </StyledMessageBubble>
            </StyledMessageRow>
          );
        })
      )}
      {hasOlderMessages && !isLoading ? (
        <StyledLoadMoreButton type="button" onClick={onLoadOlderMessages}>
          Carregar mensagens anteriores
        </StyledLoadMoreButton>
      ) : null}
      {events.length > 0 ? (
        <StyledActivityToggle
          type="button"
          onClick={() => setIsActivityVisible((current) => !current)}
        >
          <IconTimelineEvent
            size={themeCssVariables.icon.size.sm}
            stroke={themeCssVariables.icon.stroke.md}
          />
          {isActivityVisible
            ? 'Ocultar atividade'
            : `Mostrar atividade (${events.length})`}
        </StyledActivityToggle>
      ) : null}
    </StyledMessageList>
  );
};
