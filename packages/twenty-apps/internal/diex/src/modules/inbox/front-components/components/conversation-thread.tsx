import { useEffect, useRef, useState } from 'react';
import {
  IconAt,
  IconBolt,
  IconCheck,
  IconClock,
  IconInbox,
  IconMail,
  IconMessage,
  IconNotes,
  IconPaperclip,
  IconPlayerPause,
  IconRefresh,
  IconSend,
  IconSparkles,
  IconTimelineEvent,
  IconWand,
} from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import {
  type InboxConversation,
  type EvolutionMediaPayload,
  type InboxConversationEvent,
  type InboxExternalMessagePreview,
  type InboxMacro,
  type InboxMacroApplyResult,
  type InboxMacroPreview,
  type InboxMention,
  type InboxMessage,
  type InboxSavedReply,
  type InboxTriageResult,
  type InboxWorkspaceMember,
  type SavedReplyRenderResult,
} from 'src/modules/inbox/front-components/types/inbox.types';
import { readTwentyEmailConversationMetadata } from 'src/modules/inbox/front-components/utils/twenty-email';
import {
  formatDateTime,
  formatMessageTime,
  getConversationStatusLabel,
  getInitials,
  getMessageTypeLabel,
  getRecordName,
} from 'src/modules/inbox/front-components/utils/inbox-formatters';
import {
  getStatusChipStyle,
  inboxStyles,
} from 'src/modules/inbox/front-components/inbox.styles';

type ConversationThreadProps = {
  conversation: InboxConversation | null;
  messages: InboxMessage[];
  events: InboxConversationEvent[];
  mentions: InboxMention[];
  workspaceMembers: InboxWorkspaceMember[];
  currentWorkspaceMemberId: string | null;
  savedReplies: InboxSavedReply[];
  macros: InboxMacro[];
  triageResult: InboxTriageResult | null;
  isLoading: boolean;
  hasOlderMessages: boolean;
  onLoadOlderMessages: () => void;
  onLoadMessageMedia: (
    inboxMessageId: string,
  ) => Promise<EvolutionMediaPayload | null>;
  busyAction: string | null;
  onRunAiTriage: () => Promise<void>;
  onStatusChange: (status: string) => Promise<void>;
  onSaveInternalNote: (
    body: string,
    mentionedWorkspaceMemberIds?: string[],
  ) => Promise<boolean>;
  onResolveMention: (mentionId: string) => Promise<void>;
  onUseSavedReply: (
    savedReply: InboxSavedReply,
  ) => Promise<SavedReplyRenderResult | null>;
  onPreviewMacro: (macroId: string) => Promise<InboxMacroPreview | null>;
  onApplyMacro: (macroId: string) => Promise<InboxMacroApplyResult | null>;
  onPreviewExternalMessage: (input: {
    text: string;
    subject?: string;
  }) => Promise<InboxExternalMessagePreview | null>;
  onConfirmExternalMessage: (
    preview: InboxExternalMessagePreview,
  ) => Promise<boolean>;
};

type ConversationTimelineEntry =
  | {
      kind: 'MESSAGE';
      occurredAt?: string | null;
      message: InboxMessage;
    }
  | {
      kind: 'EVENT';
      occurredAt?: string | null;
      event: InboxConversationEvent;
    };

const getDeliveryStatusLabel = (status: string): string =>
  ({
    RECEIVED: 'recebida',
    QUEUED: 'na fila',
    SENT: 'enviada',
    DELIVERED: 'entregue',
    READ: 'lida',
    FAILED: 'falhou',
  })[status] ?? status.toLowerCase();

const MEDIA_MESSAGE_TYPES = ['IMAGE', 'AUDIO', 'VIDEO', 'DOCUMENT'];

const MEDIA_ACTION_LABELS: Record<string, string> = {
  IMAGE: 'Ver imagem',
  AUDIO: 'Ouvir áudio',
  VIDEO: 'Ver vídeo',
  DOCUMENT: 'Abrir documento',
};

// Audio and images render in place once loaded, because asking an operator to
// leave the conversation to hear a voice note is what made media unusable here.
const MessageMedia = ({
  media,
  messageType,
  onLoad,
}: {
  media: EvolutionMediaPayload | 'loading' | undefined;
  messageType: string;
  onLoad: () => Promise<void>;
}) => {
  if (media === undefined) {
    return (
      <button
        type="button"
        style={inboxStyles.mediaButton}
        onClick={() => void onLoad()}
      >
        <IconPaperclip
          size={themeCssVariables.icon.size.sm}
          stroke={themeCssVariables.icon.stroke.md}
        />
        {MEDIA_ACTION_LABELS[messageType] ?? 'Carregar mídia'}
      </button>
    );
  }

  if (media === 'loading') {
    return <div style={inboxStyles.mediaLoading}>Carregando mídia...</div>;
  }

  if (messageType === 'IMAGE') {
    return <img src={media.dataUri} alt="" style={inboxStyles.mediaImage} />;
  }

  if (messageType === 'AUDIO') {
    return (
      <audio controls src={media.dataUri} style={inboxStyles.mediaPlayer} />
    );
  }

  if (messageType === 'VIDEO') {
    return (
      <video controls src={media.dataUri} style={inboxStyles.mediaImage} />
    );
  }

  return (
    <a
      href={media.dataUri}
      download={media.fileName ?? 'documento'}
      style={inboxStyles.mediaButton}
    >
      <IconPaperclip
        size={themeCssVariables.icon.size.sm}
        stroke={themeCssVariables.icon.stroke.md}
      />
      Baixar {media.fileName ?? 'documento'}
    </a>
  );
};

export const ConversationThread = ({
  conversation,
  messages,
  events,
  mentions,
  workspaceMembers,
  currentWorkspaceMemberId,
  savedReplies,
  macros,
  triageResult,
  isLoading,
  hasOlderMessages,
  onLoadOlderMessages,
  onLoadMessageMedia,
  busyAction,
  onRunAiTriage,
  onStatusChange,
  onSaveInternalNote,
  onResolveMention,
  onUseSavedReply,
  onPreviewMacro,
  onApplyMacro,
  onPreviewExternalMessage,
  onConfirmExternalMessage,
}: ConversationThreadProps) => {
  const [composerMode, setComposerMode] = useState<'EXTERNAL' | 'INTERNAL'>(
    'EXTERNAL',
  );
  const [externalText, setExternalText] = useState('');
  const [externalSubject, setExternalSubject] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [mentionedWorkspaceMemberIds, setMentionedWorkspaceMemberIds] =
    useState<string[]>([]);
  const [selectedMacroId, setSelectedMacroId] = useState('');
  const [macroPreview, setMacroPreview] = useState<InboxMacroPreview | null>(
    null,
  );
  const [macroReceipt, setMacroReceipt] =
    useState<InboxMacroApplyResult | null>(null);
  const [sendPreview, setSendPreview] =
    useState<InboxExternalMessagePreview | null>(null);
  const [isActivityVisible, setIsActivityVisible] = useState(false);
  const [mediaByMessageId, setMediaByMessageId] = useState<
    Record<string, EvolutionMediaPayload | 'loading'>
  >({});
  const activeConversationIdRef = useRef<string | null>(
    conversation?.id ?? null,
  );

  activeConversationIdRef.current = conversation?.id ?? null;

  useEffect(() => {
    const isEvolution =
      conversation?.channel === 'WHATSAPP' &&
      conversation.provider === 'EVOLUTION';
    const isTwentyEmail =
      conversation?.channel === 'EMAIL' &&
      conversation.provider === 'TWENTY_EMAIL';
    const emailMetadata = readTwentyEmailConversationMetadata(
      conversation?.metadata,
    );
    const sourceSubject = emailMetadata?.subject?.trim() ?? '';

    setComposerMode(isEvolution || isTwentyEmail ? 'EXTERNAL' : 'INTERNAL');
    setExternalText('');
    setExternalSubject(
      isTwentyEmail && sourceSubject
        ? /^re:/i.test(sourceSubject)
          ? sourceSubject
          : `Re: ${sourceSubject}`
        : '',
    );
    setInternalNote('');
    setMentionedWorkspaceMemberIds([]);
    setSelectedMacroId('');
    setMacroPreview(null);
    setMacroReceipt(null);
    setSendPreview(null);
  }, [conversation?.channel, conversation?.id, conversation?.provider]);

  if (conversation === null) {
    return (
      <main style={inboxStyles.panel}>
        <div style={inboxStyles.emptyState}>
          <IconInbox
            size={themeCssVariables.icon.size.xl}
            stroke={themeCssVariables.icon.stroke.sm}
          />
          Selecione uma conversa para abrir o histórico e o contexto comercial.
        </div>
      </main>
    );
  }

  const isResolved = conversation.status === 'RESOLVED';
  const isBusy = busyAction !== null;
  const isEvolutionConversation =
    conversation.channel === 'WHATSAPP' &&
    conversation.provider === 'EVOLUTION';
  const isEmailConversation =
    conversation.channel === 'EMAIL' &&
    conversation.provider === 'TWENTY_EMAIL';
  const canSendExternal = isEvolutionConversation || isEmailConversation;
  const activeTriageResult =
    triageResult?.conversationId === conversation.id ? triageResult : null;
  const availableSavedReplies = savedReplies.filter(
    (savedReply) =>
      savedReply.channel === 'ALL' ||
      savedReply.channel === conversation.channel,
  );
  const availableMacros = macros.filter(
    (macro) =>
      macro.channel === 'ALL' || macro.channel === conversation.channel,
  );
  const timelineEntries: ConversationTimelineEntry[] = [
    ...messages.map(
      (message): ConversationTimelineEntry => ({
        kind: 'MESSAGE',
        occurredAt: message.sentAt,
        message,
      }),
    ),
    ...(isActivityVisible
      ? events.map(
          (event): ConversationTimelineEntry => ({
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

    if (timeDifference !== 0) {
      return timeDifference;
    }

    return left.kind.localeCompare(right.kind);
  });
  const shortcutQuery = externalText
    .match(/^\/([^\s]*)$/)?.[1]
    ?.toLocaleLowerCase('pt-BR');
  const matchingSavedReplies =
    shortcutQuery === undefined
      ? []
      : availableSavedReplies
          .filter((savedReply) => {
            const searchableValue = [
              savedReply.shortcut,
              savedReply.name,
              savedReply.category,
            ]
              .filter(Boolean)
              .join(' ')
              .toLocaleLowerCase('pt-BR');

            return searchableValue.includes(shortcutQuery);
          })
          .slice(0, 6);
  const mentionQuery = internalNote
    .match(/(?:^|\s)@([^@\s]*)$/)?.[1]
    ?.toLocaleLowerCase('pt-BR');
  const matchingWorkspaceMembers =
    mentionQuery === undefined
      ? []
      : workspaceMembers
          .filter(
            (workspaceMember) =>
              workspaceMember.id !== currentWorkspaceMemberId &&
              !mentionedWorkspaceMemberIds.includes(workspaceMember.id) &&
              getRecordName(workspaceMember)
                .toLocaleLowerCase('pt-BR')
                .includes(mentionQuery),
          )
          .slice(0, 6);
  const mentionedWorkspaceMembers = mentionedWorkspaceMemberIds.flatMap(
    (workspaceMemberId) => {
      const workspaceMember = workspaceMembers.find(
        ({ id }) => id === workspaceMemberId,
      );

      return workspaceMember ? [workspaceMember] : [];
    },
  );

  const handleSaveNote = async () => {
    const saved = await onSaveInternalNote(
      internalNote,
      mentionedWorkspaceMemberIds,
    );

    if (saved) {
      setInternalNote('');
      setMentionedWorkspaceMemberIds([]);
    }
  };

  const handleAddMention = (workspaceMember: InboxWorkspaceMember) => {
    const workspaceMemberName =
      getRecordName(workspaceMember) || 'Usuário sem nome';

    setInternalNote((current) =>
      current.replace(
        /(^|\s)@([^@\s]*)$/,
        (_match, prefix: string) => `${prefix}@${workspaceMemberName} `,
      ),
    );
    setMentionedWorkspaceMemberIds((current) => [
      ...current,
      workspaceMember.id,
    ]);
  };

  const handlePreviewMacro = async () => {
    if (!selectedMacroId) {
      return;
    }

    const preview = await onPreviewMacro(selectedMacroId);

    if (preview && activeConversationIdRef.current === conversation.id) {
      setMacroPreview(preview);
      setMacroReceipt(null);
    }
  };

  const handleApplyMacro = async () => {
    if (!macroPreview) {
      return;
    }

    const receipt = await onApplyMacro(macroPreview.macroId);

    if (!receipt || activeConversationIdRef.current !== conversation.id) {
      return;
    }

    setMacroReceipt(receipt);
    setMacroPreview(null);

    if (receipt.replyDraft && canSendExternal) {
      setComposerMode('EXTERNAL');
      setExternalText(receipt.replyDraft);
      setSendPreview(null);
    }
  };

  const handleRequestSendPreview = async () => {
    const preview = await onPreviewExternalMessage({
      text: externalText,
      subject: isEmailConversation ? externalSubject : undefined,
    });

    if (preview && preview.conversationId === activeConversationIdRef.current) {
      setSendPreview(preview);
    }
  };

  const handleConfirmSend = async () => {
    if (
      !sendPreview ||
      sendPreview.conversationId !== activeConversationIdRef.current
    ) {
      setSendPreview(null);
      return;
    }

    const sent = await onConfirmExternalMessage(sendPreview);

    if (sent) {
      setExternalText('');
      setSendPreview(null);
    }
  };

  const handleUseAiDraft = () => {
    if (!activeTriageResult || !canSendExternal) {
      return;
    }

    setComposerMode('EXTERNAL');
    setExternalText(activeTriageResult.suggestedReply);
    setSendPreview(null);
  };

  const handleUseSavedReply = async (savedReply: InboxSavedReply) => {
    const renderResult = await onUseSavedReply(savedReply);

    if (renderResult === null) {
      return;
    }

    setComposerMode('EXTERNAL');
    setExternalText(renderResult.text);
    setSendPreview(null);
  };

  return (
    <main style={inboxStyles.panel}>
      <header style={inboxStyles.threadHeader}>
        <div style={inboxStyles.avatar}>{getInitials(conversation.name)}</div>
        <div style={inboxStyles.threadIdentity}>
          <h2 style={inboxStyles.threadName}>{conversation.name}</h2>
          <div style={inboxStyles.threadHandle}>
            {conversation.contactHandle || 'Contato ainda não identificado'}
          </div>
        </div>
        <span style={getStatusChipStyle(conversation.status)}>
          {getConversationStatusLabel(conversation.status)}
        </span>
        <div style={inboxStyles.headerActions}>
          <button
            type="button"
            style={{
              ...inboxStyles.secondaryButton,
              ...(isBusy || messages.length === 0
                ? inboxStyles.disabledButton
                : {}),
            }}
            disabled={isBusy || messages.length === 0}
            onClick={() => void onRunAiTriage()}
          >
            <IconSparkles
              size={themeCssVariables.icon.size.sm}
              stroke={themeCssVariables.icon.stroke.md}
            />
            {busyAction === 'ai-triage' ? 'Analisando' : 'Analisar IA'}
          </button>
          {conversation.status === 'SNOOZED' ? (
            <button
              type="button"
              style={{
                ...inboxStyles.secondaryButton,
                ...(isBusy ? inboxStyles.disabledButton : {}),
              }}
              disabled={isBusy}
              onClick={() => void onStatusChange('OPEN')}
            >
              <IconRefresh
                size={themeCssVariables.icon.size.sm}
                stroke={themeCssVariables.icon.stroke.md}
              />
              Reabrir
            </button>
          ) : !isResolved && conversation.status !== 'PENDING' ? (
            <button
              type="button"
              style={{
                ...inboxStyles.secondaryButton,
                ...(isBusy ? inboxStyles.disabledButton : {}),
              }}
              disabled={isBusy}
              onClick={() => void onStatusChange('PENDING')}
            >
              <IconPlayerPause
                size={themeCssVariables.icon.size.sm}
                stroke={themeCssVariables.icon.stroke.md}
              />
              Pendente
            </button>
          ) : null}
          <button
            type="button"
            style={{
              ...(isResolved
                ? inboxStyles.secondaryButton
                : inboxStyles.primaryButton),
              ...(isBusy ? inboxStyles.disabledButton : {}),
            }}
            disabled={isBusy}
            onClick={() =>
              void onStatusChange(isResolved ? 'OPEN' : 'RESOLVED')
            }
          >
            {isResolved ? (
              <IconRefresh
                size={themeCssVariables.icon.size.sm}
                stroke={themeCssVariables.icon.stroke.md}
              />
            ) : (
              <IconCheck
                size={themeCssVariables.icon.size.sm}
                stroke={themeCssVariables.icon.stroke.md}
              />
            )}
            {isResolved ? 'Reabrir' : 'Resolver'}
          </button>
        </div>
      </header>

      <div style={inboxStyles.messageList}>
        {isLoading ? (
          <div style={inboxStyles.emptyState}>Carregando mensagens...</div>
        ) : timelineEntries.length === 0 ? (
          <div style={inboxStyles.emptyState}>
            <IconMessage
              size={themeCssVariables.icon.size.xl}
              stroke={themeCssVariables.icon.stroke.sm}
            />
            Esta conversa ainda não possui mensagens ou eventos.
          </div>
        ) : (
          [...timelineEntries].reverse().map((entry) => {
            if (entry.kind === 'EVENT') {
              const event = entry.event;

              return (
                <div
                  key={`event:${event.id}`}
                  style={inboxStyles.activityEventRow}
                >
                  <article style={inboxStyles.activityEvent}>
                    <div style={inboxStyles.activityEventIcon}>
                      <IconTimelineEvent
                        size={themeCssVariables.icon.size.sm}
                        stroke={themeCssVariables.icon.stroke.md}
                      />
                    </div>
                    <div style={inboxStyles.activityEventBody}>
                      <strong style={inboxStyles.activityEventSummary}>
                        {event.summary}
                      </strong>
                      {event.details ? (
                        <p style={inboxStyles.activityEventDetails}>
                          {event.details}
                        </p>
                      ) : null}
                      <div style={inboxStyles.activityEventMeta}>
                        {getRecordName(event.actor) || 'Automação Diex'} ·{' '}
                        {formatMessageTime(event.occurredAt)}
                      </div>
                    </div>
                  </article>
                </div>
              );
            }

            const message = entry.message;
            const isOutgoing = message.direction === 'OUTBOUND';
            const isInternal = message.isInternalNote;
            const senderName = isInternal
              ? 'Nota interna'
              : message.senderDisplayName ||
                (isOutgoing ? 'Equipe comercial' : conversation.name);
            const messageMentions = mentions.filter(
              (mention) => mention.inboxMessage?.id === message.id,
            );

            return (
              <div key={`message:${message.id}`} style={inboxStyles.messageRow}>
                <article
                  style={{
                    ...inboxStyles.messageBubble,
                    ...(isInternal
                      ? inboxStyles.internalBubble
                      : isOutgoing
                        ? inboxStyles.outgoingBubble
                        : inboxStyles.incomingBubble),
                  }}
                >
                  <div style={inboxStyles.messageSender}>
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
                  </div>
                  <p style={inboxStyles.messageText}>
                    {message.body || getMessageTypeLabel(message.messageType)}
                  </p>
                  {messageMentions.length > 0 ? (
                    <div style={inboxStyles.mentionChips}>
                      {messageMentions.map((mention) => {
                        const isCurrentMemberMention =
                          mention.mentionedWorkspaceMember?.id ===
                          currentWorkspaceMemberId;
                        const isPending =
                          isCurrentMemberMention &&
                          mention.status !== 'RESOLVED';

                        return (
                          <span
                            key={mention.id}
                            style={{
                              ...inboxStyles.mentionChip,
                              ...(isPending
                                ? inboxStyles.mentionChipPending
                                : {}),
                            }}
                          >
                            <IconAt
                              size={themeCssVariables.icon.size.sm}
                              stroke={themeCssVariables.icon.stroke.md}
                            />
                            {getRecordName(mention.mentionedWorkspaceMember) ||
                              'Usuário removido'}
                            {isPending ? (
                              <button
                                type="button"
                                disabled={isBusy}
                                style={{
                                  ...inboxStyles.mentionResolveButton,
                                  ...(isBusy ? inboxStyles.disabledButton : {}),
                                }}
                                onClick={() =>
                                  void onResolveMention(mention.id)
                                }
                              >
                                <IconCheck
                                  size={themeCssVariables.icon.size.sm}
                                  stroke={themeCssVariables.icon.stroke.md}
                                />
                                Resolver
                              </button>
                            ) : null}
                          </span>
                        );
                      })}
                    </div>
                  ) : null}
                  {MEDIA_MESSAGE_TYPES.includes(message.messageType) &&
                  !isInternal ? (
                    <MessageMedia
                      media={mediaByMessageId[message.id]}
                      messageType={message.messageType}
                      onLoad={async () => {
                        setMediaByMessageId((current) => ({
                          ...current,
                          [message.id]: 'loading',
                        }));

                        const loaded = await onLoadMessageMedia(message.id);

                        setMediaByMessageId((current) => {
                          const next = { ...current };

                          if (loaded) {
                            next[message.id] = loaded;
                          } else {
                            delete next[message.id];
                          }

                          return next;
                        });
                      }}
                    />
                  ) : null}
                  <div style={inboxStyles.messageMeta}>
                    {formatMessageTime(message.sentAt)}
                    {!isInternal && isOutgoing ? (
                      <span>
                        · {getDeliveryStatusLabel(message.deliveryStatus)}
                      </span>
                    ) : null}
                  </div>
                </article>
              </div>
            );
          })
        )}
        {hasOlderMessages && !isLoading ? (
          <button
            type="button"
            style={inboxStyles.loadMoreButton}
            onClick={onLoadOlderMessages}
          >
            Carregar mensagens anteriores
          </button>
        ) : null}
        {events.length > 0 ? (
          <button
            type="button"
            style={inboxStyles.activityToggle}
            onClick={() => setIsActivityVisible(!isActivityVisible)}
          >
            <IconTimelineEvent
              size={themeCssVariables.icon.size.sm}
              stroke={themeCssVariables.icon.stroke.md}
            />
            {isActivityVisible
              ? 'Ocultar atividade'
              : `Mostrar atividade (${events.length})`}
          </button>
        ) : null}
      </div>

      <footer style={inboxStyles.composer}>
        <section style={inboxStyles.macroPanel}>
          <div style={inboxStyles.macroToolbar}>
            <span style={inboxStyles.savedReplyToolbarLabel}>
              <IconWand
                size={themeCssVariables.icon.size.sm}
                stroke={themeCssVariables.icon.stroke.md}
              />
              Macro comercial
            </span>
            <select
              aria-label="Selecionar macro comercial"
              disabled={availableMacros.length === 0 || isBusy}
              value={selectedMacroId}
              style={inboxStyles.savedReplySelect}
              onChange={(event) => {
                setSelectedMacroId(event.target.value);
                setMacroPreview(null);
                setMacroReceipt(null);
              }}
            >
              <option value="">
                {availableMacros.length === 0
                  ? 'Nenhuma macro cadastrada'
                  : 'Selecionar pacote de ações'}
              </option>
              {availableMacros.map((macro) => (
                <option key={macro.id} value={macro.id}>
                  /{macro.shortcut} · {macro.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={!selectedMacroId || isBusy}
              style={{
                ...inboxStyles.secondaryButton,
                ...(!selectedMacroId || isBusy
                  ? inboxStyles.disabledButton
                  : {}),
              }}
              onClick={() => void handlePreviewMacro()}
            >
              Prévia
            </button>
          </div>

          {macroPreview ? (
            <div style={inboxStyles.macroReview}>
              <div>
                <strong style={inboxStyles.macroReviewTitle}>
                  Ações que serão aplicadas
                </strong>
                <ul style={inboxStyles.macroActionList}>
                  {macroPreview.actions.map((action) => (
                    <li key={action}>{action}</li>
                  ))}
                </ul>
                {macroPreview.unresolvedNoteVariables.length > 0 ? (
                  <p style={inboxStyles.macroWarning}>
                    Corrija a configuração da nota:{' '}
                    {macroPreview.unresolvedNoteVariables
                      .map((variable) => `{{${variable}}}`)
                      .join(', ')}
                  </p>
                ) : null}
                {macroPreview.unresolvedReplyVariables.length > 0 ? (
                  <p style={inboxStyles.macroWarning}>
                    O rascunho exigirá completar:{' '}
                    {macroPreview.unresolvedReplyVariables
                      .map((variable) => `{{${variable}}}`)
                      .join(', ')}
                  </p>
                ) : null}
              </div>
              <div style={inboxStyles.sendReviewActions}>
                <button
                  type="button"
                  disabled={isBusy}
                  style={{
                    ...inboxStyles.secondaryButton,
                    ...(isBusy ? inboxStyles.disabledButton : {}),
                  }}
                  onClick={() => setMacroPreview(null)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={
                    isBusy || macroPreview.unresolvedNoteVariables.length > 0
                  }
                  style={{
                    ...inboxStyles.primaryButton,
                    ...(isBusy ||
                    macroPreview.unresolvedNoteVariables.length > 0
                      ? inboxStyles.disabledButton
                      : {}),
                  }}
                  onClick={() => void handleApplyMacro()}
                >
                  <IconWand
                    size={themeCssVariables.icon.size.sm}
                    stroke={themeCssVariables.icon.stroke.md}
                  />
                  {busyAction === `macro:${macroPreview.macroId}`
                    ? 'Aplicando'
                    : 'Aplicar macro'}
                </button>
              </div>
            </div>
          ) : null}

          {macroReceipt ? (
            <div style={inboxStyles.macroReceipt}>
              <strong style={inboxStyles.macroReviewTitle}>
                Macro aplicada
              </strong>
              <span>
                {macroReceipt.appliedActions.length} ação
                {macroReceipt.appliedActions.length === 1 ? '' : 'ões'}
              </span>
              {macroReceipt.warnings.length > 0 ? (
                <span style={inboxStyles.macroWarning}>
                  {macroReceipt.warnings.join(' ')}
                </span>
              ) : null}
              {macroReceipt.replyDraft && !canSendExternal ? (
                <p style={inboxStyles.macroDraftPreview}>
                  Rascunho preparado: {macroReceipt.replyDraft}
                </p>
              ) : null}
            </div>
          ) : null}
        </section>

        {activeTriageResult ? (
          <section style={inboxStyles.aiTriagePanel}>
            <div style={inboxStyles.aiTriageHeader}>
              <div style={inboxStyles.aiTriageTitle}>
                <IconSparkles
                  size={themeCssVariables.icon.size.sm}
                  stroke={themeCssVariables.icon.stroke.md}
                />
                Diagnóstico comercial
              </div>
              <span style={inboxStyles.aiTriageConfidence}>
                {Math.round(activeTriageResult.confidence * 100)}% confiança
              </span>
            </div>
            <p style={inboxStyles.aiTriageSummary}>
              {activeTriageResult.summary}
            </p>
            <p style={inboxStyles.aiTriageRecommendation}>
              Próxima ação: {activeTriageResult.recommendedAction}
            </p>
            {activeTriageResult.suggestedReply ? (
              <div style={inboxStyles.aiDraftRow}>
                <p style={inboxStyles.aiDraftText}>
                  {activeTriageResult.suggestedReply}
                </p>
                <button
                  type="button"
                  disabled={!canSendExternal || isBusy}
                  style={{
                    ...inboxStyles.secondaryButton,
                    ...(!canSendExternal || isBusy
                      ? inboxStyles.disabledButton
                      : {}),
                  }}
                  onClick={handleUseAiDraft}
                >
                  Usar rascunho
                </button>
              </div>
            ) : null}
            <p style={inboxStyles.composerHint}>
              A IA registra o sinal e propõe a ação. Nada é enviado sem sua
              revisão e confirmação.
            </p>
          </section>
        ) : null}

        <div style={inboxStyles.composerModeRow}>
          <button
            type="button"
            disabled={!canSendExternal || isBusy}
            style={{
              ...inboxStyles.composerModeButton,
              ...(composerMode === 'EXTERNAL'
                ? inboxStyles.composerModeButtonActive
                : {}),
              ...(!canSendExternal || isBusy ? inboxStyles.disabledButton : {}),
            }}
            onClick={() => setComposerMode('EXTERNAL')}
          >
            {isEmailConversation ? (
              <IconMail
                size={themeCssVariables.icon.size.sm}
                stroke={themeCssVariables.icon.stroke.md}
              />
            ) : (
              <IconMessage
                size={themeCssVariables.icon.size.sm}
                stroke={themeCssVariables.icon.stroke.md}
              />
            )}
            {isEmailConversation ? 'E-mail' : 'WhatsApp'}
          </button>
          <button
            type="button"
            disabled={isBusy}
            style={{
              ...inboxStyles.composerModeButton,
              ...(composerMode === 'INTERNAL'
                ? inboxStyles.composerModeButtonActive
                : {}),
              ...(isBusy ? inboxStyles.disabledButton : {}),
            }}
            onClick={() => {
              setComposerMode('INTERNAL');
              setSendPreview(null);
            }}
          >
            <IconNotes
              size={themeCssVariables.icon.size.sm}
              stroke={themeCssVariables.icon.stroke.md}
            />
            Nota interna
          </button>
        </div>

        {composerMode === 'EXTERNAL' ? (
          sendPreview ? (
            <div style={inboxStyles.sendReview}>
              <div style={inboxStyles.sendReviewMeta}>
                <span>
                  {sendPreview.channel === 'EMAIL' ? (
                    <IconMail
                      size={themeCssVariables.icon.size.sm}
                      stroke={themeCssVariables.icon.stroke.md}
                    />
                  ) : (
                    <IconMessage
                      size={themeCssVariables.icon.size.sm}
                      stroke={themeCssVariables.icon.stroke.md}
                    />
                  )}{' '}
                  Destino {sendPreview.destination}
                </span>
                <span>
                  <IconClock
                    size={themeCssVariables.icon.size.sm}
                    stroke={themeCssVariables.icon.stroke.md}
                  />{' '}
                  válida até {formatDateTime(sendPreview.expiresAt)}
                </span>
              </div>
              {sendPreview.channel === 'EMAIL' ? (
                <p style={inboxStyles.sendReviewSubject}>
                  Assunto: {sendPreview.subjectPreview}
                </p>
              ) : null}
              <p style={inboxStyles.sendReviewText}>
                {sendPreview.textPreview}
              </p>
              <div style={inboxStyles.sendReviewActions}>
                <button
                  type="button"
                  disabled={isBusy}
                  style={{
                    ...inboxStyles.secondaryButton,
                    ...(isBusy ? inboxStyles.disabledButton : {}),
                  }}
                  onClick={() => setSendPreview(null)}
                >
                  Editar
                </button>
                <button
                  type="button"
                  disabled={isBusy}
                  style={{
                    ...inboxStyles.primaryButton,
                    ...(isBusy ? inboxStyles.disabledButton : {}),
                  }}
                  onClick={() => void handleConfirmSend()}
                >
                  <IconSend
                    size={themeCssVariables.icon.size.sm}
                    stroke={themeCssVariables.icon.stroke.md}
                  />
                  {busyAction === 'send-confirm'
                    ? 'Enviando'
                    : 'Confirmar envio'}
                </button>
              </div>
            </div>
          ) : (
            <div style={inboxStyles.externalComposer}>
              <div style={inboxStyles.savedReplyToolbar}>
                <span style={inboxStyles.savedReplyToolbarLabel}>
                  <IconBolt
                    size={themeCssVariables.icon.size.sm}
                    stroke={themeCssVariables.icon.stroke.md}
                  />
                  Resposta pronta
                </span>
                <select
                  aria-label="Selecionar resposta pronta"
                  disabled={availableSavedReplies.length === 0 || isBusy}
                  value=""
                  style={inboxStyles.savedReplySelect}
                  onChange={(event) => {
                    const savedReply = availableSavedReplies.find(
                      ({ id }) => id === event.target.value,
                    );

                    if (savedReply) {
                      void handleUseSavedReply(savedReply);
                    }
                  }}
                >
                  <option value="">
                    {availableSavedReplies.length === 0
                      ? 'Nenhuma resposta cadastrada'
                      : 'Selecionar ou digitar /atalho'}
                  </option>
                  {availableSavedReplies.map((savedReply) => (
                    <option key={savedReply.id} value={savedReply.id}>
                      /{savedReply.shortcut} · {savedReply.name}
                    </option>
                  ))}
                </select>
              </div>

              {matchingSavedReplies.length > 0 ? (
                <div style={inboxStyles.savedReplyMatches}>
                  {matchingSavedReplies.map((savedReply) => (
                    <button
                      key={savedReply.id}
                      type="button"
                      disabled={isBusy}
                      style={inboxStyles.savedReplyOption}
                      onClick={() => void handleUseSavedReply(savedReply)}
                    >
                      <span style={inboxStyles.savedReplyShortcut}>
                        /{savedReply.shortcut}
                      </span>
                      <span style={inboxStyles.savedReplyName}>
                        {savedReply.name}
                      </span>
                      {savedReply.category ? (
                        <span style={inboxStyles.savedReplyCategory}>
                          {savedReply.category}
                        </span>
                      ) : null}
                    </button>
                  ))}
                </div>
              ) : null}

              {isEmailConversation ? (
                <input
                  aria-label="Assunto do e-mail"
                  placeholder="Assunto do e-mail"
                  value={externalSubject}
                  maxLength={998}
                  disabled={isBusy}
                  onChange={(event) => setExternalSubject(event.target.value)}
                  style={inboxStyles.emailSubjectInput}
                />
              ) : null}

              <div style={inboxStyles.composerRow}>
                <textarea
                  aria-label={
                    isEmailConversation
                      ? 'Responder por e-mail'
                      : 'Responder pelo WhatsApp'
                  }
                  placeholder={
                    isEmailConversation
                      ? 'Escreva o e-mail ou digite / para usar uma resposta pronta...'
                      : 'Escreva a mensagem ou digite / para usar uma resposta pronta...'
                  }
                  value={externalText}
                  maxLength={isEmailConversation ? 100_000 : 4096}
                  onChange={(event) => setExternalText(event.target.value)}
                  style={inboxStyles.textarea}
                />
                <button
                  type="button"
                  style={{
                    ...inboxStyles.primaryButton,
                    ...(externalText.trim().length === 0 || isBusy
                      ? inboxStyles.disabledButton
                      : {}),
                  }}
                  disabled={externalText.trim().length === 0 || isBusy}
                  onClick={() => void handleRequestSendPreview()}
                >
                  <IconCheck
                    size={themeCssVariables.icon.size.sm}
                    stroke={themeCssVariables.icon.stroke.md}
                  />
                  {busyAction === 'send-preview'
                    ? 'Validando'
                    : 'Revisar envio'}
                </button>
              </div>
            </div>
          )
        ) : (
          <div style={inboxStyles.externalComposer}>
            <div style={inboxStyles.composerRow}>
              <textarea
                aria-label="Adicionar nota interna"
                placeholder="Registre o contexto e use @ para mencionar alguém..."
                value={internalNote}
                onChange={(event) => setInternalNote(event.target.value)}
                style={inboxStyles.textarea}
              />
              <button
                type="button"
                style={{
                  ...inboxStyles.primaryButton,
                  ...(internalNote.trim().length === 0 || isBusy
                    ? inboxStyles.disabledButton
                    : {}),
                }}
                disabled={internalNote.trim().length === 0 || isBusy}
                onClick={() => void handleSaveNote()}
              >
                <IconNotes
                  size={themeCssVariables.icon.size.sm}
                  stroke={themeCssVariables.icon.stroke.md}
                />
                {busyAction === 'note' ? 'Salvando' : 'Salvar nota'}
              </button>
            </div>

            {matchingWorkspaceMembers.length > 0 ? (
              <div style={inboxStyles.mentionSuggestions}>
                {matchingWorkspaceMembers.map((workspaceMember) => (
                  <button
                    key={workspaceMember.id}
                    type="button"
                    disabled={isBusy}
                    style={inboxStyles.mentionOption}
                    onClick={() => handleAddMention(workspaceMember)}
                  >
                    <IconAt
                      size={themeCssVariables.icon.size.sm}
                      stroke={themeCssVariables.icon.stroke.md}
                    />
                    {getRecordName(workspaceMember) || 'Usuário sem nome'}
                  </button>
                ))}
              </div>
            ) : null}

            {mentionedWorkspaceMembers.length > 0 ? (
              <div style={inboxStyles.mentionChips}>
                {mentionedWorkspaceMembers.map((workspaceMember) => (
                  <span
                    key={workspaceMember.id}
                    style={inboxStyles.mentionChip}
                  >
                    <IconAt
                      size={themeCssVariables.icon.size.sm}
                      stroke={themeCssVariables.icon.stroke.md}
                    />
                    {getRecordName(workspaceMember) || 'Usuário sem nome'}
                    <button
                      type="button"
                      aria-label={`Remover menção a ${
                        getRecordName(workspaceMember) || 'usuário'
                      }`}
                      style={inboxStyles.mentionRemoveButton}
                      onClick={() =>
                        setMentionedWorkspaceMemberIds((current) =>
                          current.filter((id) => id !== workspaceMember.id),
                        )
                      }
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        )}

        <p style={inboxStyles.composerHint}>
          {composerMode === 'EXTERNAL' ? (
            isEmailConversation ? (
              <>
                O envio usa a conta nativa do Twenty disponível ao seu usuário.
                Revise destinatário, assunto e corpo antes de confirmar.
              </>
            ) : (
              <>
                Você pode responder enquanto o contato escreveu nas últimas 24
                horas. Depois disso, o envio exige consentimento registrado.
                Gere a prévia e confirme o texto exato.
              </>
            )
          ) : (
            <>
              A nota fica apenas no CRM. Usuários selecionados recebem uma
              pendência pessoal até resolverem a menção.
            </>
          )}
        </p>
        {!canSendExternal ? (
          <p style={inboxStyles.composerHint}>
            <IconNotes
              size={themeCssVariables.icon.size.sm}
              stroke={themeCssVariables.icon.stroke.md}
            />{' '}
            Esta conversa não está vinculada a um canal externo compatível.
          </p>
        ) : null}
      </footer>
    </main>
  );
};
