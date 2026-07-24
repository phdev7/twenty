import { useEffect, useRef, useState } from 'react';
import {
  IconAt,
  IconBolt,
  IconCheck,
  IconClock,
  IconInbox,
  IconMessage,
  IconNotes,
  IconPaperclip,
  IconPlayerPause,
  IconRefresh,
  IconSend,
  IconSparkles,
} from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import {
  type EvolutionTextPreview,
  type InboxConversation,
  type InboxMention,
  type InboxMessage,
  type InboxSavedReply,
  type InboxTriageResult,
  type InboxWorkspaceMember,
  type SavedReplyRenderResult,
} from 'src/modules/inbox/front-components/types/inbox.types';
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
  mentions: InboxMention[];
  workspaceMembers: InboxWorkspaceMember[];
  currentWorkspaceMemberId: string | null;
  savedReplies: InboxSavedReply[];
  triageResult: InboxTriageResult | null;
  isLoading: boolean;
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
  onPreviewEvolutionText: (
    text: string,
  ) => Promise<EvolutionTextPreview | null>;
  onConfirmEvolutionText: (input: {
    text: string;
    confirmationToken: string;
  }) => Promise<boolean>;
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

export const ConversationThread = ({
  conversation,
  messages,
  mentions,
  workspaceMembers,
  currentWorkspaceMemberId,
  savedReplies,
  triageResult,
  isLoading,
  busyAction,
  onRunAiTriage,
  onStatusChange,
  onSaveInternalNote,
  onResolveMention,
  onUseSavedReply,
  onPreviewEvolutionText,
  onConfirmEvolutionText,
}: ConversationThreadProps) => {
  const [composerMode, setComposerMode] = useState<'EXTERNAL' | 'INTERNAL'>(
    'EXTERNAL',
  );
  const [externalText, setExternalText] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [mentionedWorkspaceMemberIds, setMentionedWorkspaceMemberIds] =
    useState<string[]>([]);
  const [sendPreview, setSendPreview] = useState<EvolutionTextPreview | null>(
    null,
  );
  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);
  const activeConversationIdRef = useRef<string | null>(
    conversation?.id ?? null,
  );

  activeConversationIdRef.current = conversation?.id ?? null;

  useEffect(() => {
    const canSendThroughEvolution =
      conversation?.channel === 'WHATSAPP' &&
      conversation.provider === 'EVOLUTION';

    setComposerMode(canSendThroughEvolution ? 'EXTERNAL' : 'INTERNAL');
    setExternalText('');
    setInternalNote('');
    setMentionedWorkspaceMemberIds([]);
    setSendPreview(null);
  }, [conversation?.channel, conversation?.id, conversation?.provider]);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({
      block: 'end',
      behavior: 'smooth',
    });
  }, [messages]);

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
  const activeTriageResult =
    triageResult?.conversationId === conversation.id ? triageResult : null;
  const availableSavedReplies = savedReplies.filter(
    (savedReply) =>
      savedReply.channel === 'ALL' ||
      savedReply.channel === conversation.channel,
  );
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

  const handleRequestSendPreview = async () => {
    const preview = await onPreviewEvolutionText(externalText);

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

    const sent = await onConfirmEvolutionText({
      text: sendPreview.textPreview,
      confirmationToken: sendPreview.confirmationToken,
    });

    if (sent) {
      setExternalText('');
      setSendPreview(null);
    }
  };

  const handleUseAiDraft = () => {
    if (!activeTriageResult || !isEvolutionConversation) {
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
        ) : messages.length === 0 ? (
          <div style={inboxStyles.emptyState}>
            <IconMessage
              size={themeCssVariables.icon.size.xl}
              stroke={themeCssVariables.icon.stroke.sm}
            />
            Esta conversa ainda não possui mensagens.
          </div>
        ) : (
          messages.map((message) => {
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
              <div key={message.id} style={inboxStyles.messageRow}>
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
                    {message.body || getMessageTypeLabel(message.type)}
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
                  {message.mediaUrl ? (
                    <a
                      href={message.mediaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        ...inboxStyles.textButton,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: themeCssVariables.spacing[1],
                        marginTop: themeCssVariables.spacing[2],
                        textDecoration: 'none',
                      }}
                    >
                      <IconPaperclip
                        size={themeCssVariables.icon.size.sm}
                        stroke={themeCssVariables.icon.stroke.md}
                      />
                      Abrir mídia
                    </a>
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
        <div ref={endOfMessagesRef} />
      </div>

      <footer style={inboxStyles.composer}>
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
                  disabled={!isEvolutionConversation || isBusy}
                  style={{
                    ...inboxStyles.secondaryButton,
                    ...(!isEvolutionConversation || isBusy
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
            disabled={!isEvolutionConversation || isBusy}
            style={{
              ...inboxStyles.composerModeButton,
              ...(composerMode === 'EXTERNAL'
                ? inboxStyles.composerModeButtonActive
                : {}),
              ...(!isEvolutionConversation || isBusy
                ? inboxStyles.disabledButton
                : {}),
            }}
            onClick={() => setComposerMode('EXTERNAL')}
          >
            <IconMessage
              size={themeCssVariables.icon.size.sm}
              stroke={themeCssVariables.icon.stroke.md}
            />
            WhatsApp
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
                  <IconMessage
                    size={themeCssVariables.icon.size.sm}
                    stroke={themeCssVariables.icon.stroke.md}
                  />{' '}
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

              <div style={inboxStyles.composerRow}>
                <textarea
                  aria-label="Responder pelo WhatsApp"
                  placeholder="Escreva a mensagem ou digite / para usar uma resposta pronta..."
                  value={externalText}
                  maxLength={4096}
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
            <>
              O envio exige opt-in válido. Primeiro gere a prévia; depois
              confirme explicitamente o texto exato.
            </>
          ) : (
            <>
              A nota fica apenas no CRM. Usuários selecionados recebem uma
              pendência pessoal até resolverem a menção.
            </>
          )}
        </p>
        {!isEvolutionConversation ? (
          <p style={inboxStyles.composerHint}>
            <IconNotes
              size={themeCssVariables.icon.size.sm}
              stroke={themeCssVariables.icon.stroke.md}
            />{' '}
            Esta conversa não está vinculada ao canal Evolution WhatsApp.
          </p>
        ) : null}
      </footer>
    </main>
  );
};
