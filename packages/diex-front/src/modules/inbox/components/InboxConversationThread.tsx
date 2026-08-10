import { styled } from '@linaria/react';
import {
  IconCheck,
  IconInbox,
  IconPlayerPause,
  IconRefresh,
  IconSparkles,
} from 'diex-ui/icon';
import { Button } from 'diex-ui/input';
import { themeCssVariables } from 'diex-ui/theme-constants';

import { InboxConversationComposer } from '@/inbox/components/InboxConversationComposer';
import { InboxConversationTimeline } from '@/inbox/components/InboxConversationTimeline';
import {
  type InboxConversation,
  type InboxConversationEvent,
  type InboxMention,
  type InboxMessage,
  type InboxSavedReply,
  type InboxWorkspaceMember,
} from '@/inbox/types/inboxEntityTypes';
import {
  type EvolutionMediaPayload,
  type InboxExternalMessagePreview,
  type InboxTriageResult,
} from '@/inbox/types/inboxExternalMessageTypes';
import {
  type InboxMacro,
  type InboxMacroApplyResult,
  type InboxMacroPreview,
} from '@/inbox/types/inboxMacroTypes';
import {
  getConversationStatusLabel,
  getInitials,
} from '@/inbox/utils/inboxFormatters';

const StyledMain = styled.main`
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
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

const StyledHeader = styled.header`
  align-items: center;
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  flex-shrink: 0;
  gap: ${themeCssVariables.spacing[3]};
  min-height: 68px;
  padding: 0 ${themeCssVariables.spacing[4]};
`;

const StyledAvatar = styled.div`
  align-items: center;
  background: ${themeCssVariables.background.tertiary};
  border-radius: ${themeCssVariables.border.radius.rounded};
  color: ${themeCssVariables.font.color.secondary};
  display: flex;
  flex-shrink: 0;
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  height: ${themeCssVariables.spacing[9]};
  justify-content: center;
  width: ${themeCssVariables.spacing[9]};
`;

const StyledIdentity = styled.div`
  flex: 1;
  min-width: 0;
`;

const StyledName = styled.h2`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledHandle = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
  margin-top: ${themeCssVariables.spacing[1]};
`;

const statusChipPalette: Record<string, { background: string; color: string }> =
  {
    OPEN: {
      background: themeCssVariables.tag.background.green,
      color: themeCssVariables.tag.text.green,
    },
    PENDING: {
      background: themeCssVariables.tag.background.orange,
      color: themeCssVariables.tag.text.orange,
    },
    SNOOZED: {
      background: themeCssVariables.tag.background.blue,
      color: themeCssVariables.tag.text.blue,
    },
    RESOLVED: {
      background: themeCssVariables.tag.background.gray,
      color: themeCssVariables.tag.text.gray,
    },
  };

const StyledStatusChip = styled.span<{ background: string; color: string }>`
  background: ${({ background }) => background};
  border-radius: ${themeCssVariables.border.radius.pill};
  color: ${({ color }) => color};
  display: inline-flex;
  font-size: ${themeCssVariables.font.size.xxs};
  font-weight: ${themeCssVariables.font.weight.medium};
  padding: ${themeCssVariables.spacing[1]} ${themeCssVariables.spacing[2]};
`;

const StyledHeaderActions = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
`;

type InboxConversationThreadProps = {
  conversation: InboxConversation | null;
  messages: InboxMessage[];
  events: InboxConversationEvent[];
  hasOlderMessages: boolean;
  onLoadOlderMessages: () => void;
  onLoadMessageMedia: (
    inboxMessageId: string,
  ) => Promise<EvolutionMediaPayload | null>;
  mentions: InboxMention[];
  workspaceMembers: InboxWorkspaceMember[];
  currentWorkspaceMemberId: string | null;
  savedReplies: InboxSavedReply[];
  macros: InboxMacro[];
  isLoading: boolean;
  busyAction: string | null;
  triageResult: InboxTriageResult | null;
  onStatusChange: (status: string) => void;
  onSaveInternalNote: (
    body: string,
    mentionedWorkspaceMemberIds?: string[],
  ) => Promise<boolean>;
  onResolveMention: (mentionId: string) => void;
  onUseSavedReply: (
    savedReply: InboxSavedReply,
  ) => Promise<{ text: string } | null>;
  onPreviewMacro: (macroId: string) => Promise<InboxMacroPreview | null>;
  onApplyMacro: (macroId: string) => Promise<InboxMacroApplyResult | null>;
  onPreviewExternalMessage: (input: {
    text: string;
    subject?: string;
  }) => Promise<InboxExternalMessagePreview | null>;
  onConfirmExternalMessage: (
    preview: InboxExternalMessagePreview,
  ) => Promise<boolean>;
  onRunAiTriage: () => void;
};

export const InboxConversationThread = ({
  conversation,
  messages,
  events,
  hasOlderMessages,
  onLoadOlderMessages,
  onLoadMessageMedia,
  mentions,
  workspaceMembers,
  currentWorkspaceMemberId,
  savedReplies,
  macros,
  isLoading,
  busyAction,
  triageResult,
  onStatusChange,
  onSaveInternalNote,
  onResolveMention,
  onUseSavedReply,
  onPreviewMacro,
  onApplyMacro,
  onPreviewExternalMessage,
  onConfirmExternalMessage,
  onRunAiTriage,
}: InboxConversationThreadProps) => {
  if (conversation === null) {
    return (
      <StyledMain>
        <StyledEmptyState>
          <IconInbox
            size={themeCssVariables.icon.size.xl}
            stroke={themeCssVariables.icon.stroke.sm}
          />
          Selecione uma conversa para abrir o histórico. O primeiro lead aparecerá aqui assim que o WhatsApp conectado receber uma mensagem.
        </StyledEmptyState>
      </StyledMain>
    );
  }

  const isResolved = conversation.status === 'RESOLVED';
  const isBusy = busyAction !== null;
  const statusPalette =
    statusChipPalette[conversation.status] ?? statusChipPalette.RESOLVED;

  return (
    <StyledMain>
      <StyledHeader>
        <StyledAvatar>{getInitials(conversation.name)}</StyledAvatar>
        <StyledIdentity>
          <StyledName>{conversation.name}</StyledName>
          <StyledHandle>
            {conversation.contactHandle || 'Contato ainda não identificado'}
          </StyledHandle>
        </StyledIdentity>
        <StyledStatusChip
          background={statusPalette.background}
          color={statusPalette.color}
        >
          {getConversationStatusLabel(conversation.status)}
        </StyledStatusChip>
        <StyledHeaderActions>
          <Button
            variant="secondary"
            size="small"
            Icon={IconSparkles}
            title={busyAction === 'ai-triage' ? 'Analisando' : 'Analisar IA'}
            disabled={isBusy || messages.length === 0}
            onClick={onRunAiTriage}
          />
          {conversation.status === 'SNOOZED' ? (
            <Button
              variant="secondary"
              size="small"
              Icon={IconRefresh}
              title="Reabrir"
              disabled={isBusy}
              onClick={() => onStatusChange('OPEN')}
            />
          ) : !isResolved && conversation.status !== 'PENDING' ? (
            <Button
              variant="secondary"
              size="small"
              Icon={IconPlayerPause}
              title="Pendente"
              disabled={isBusy}
              onClick={() => onStatusChange('PENDING')}
            />
          ) : null}
          <Button
            variant={isResolved ? 'secondary' : 'primary'}
            size="small"
            Icon={isResolved ? IconRefresh : IconCheck}
            title={isResolved ? 'Reabrir' : 'Resolver'}
            disabled={isBusy}
            onClick={() => onStatusChange(isResolved ? 'OPEN' : 'RESOLVED')}
          />
        </StyledHeaderActions>
      </StyledHeader>

      <InboxConversationTimeline
        conversationName={conversation.name}
        messages={messages}
        events={events}
        mentions={mentions}
        currentWorkspaceMemberId={currentWorkspaceMemberId}
        isLoading={isLoading}
        hasOlderMessages={hasOlderMessages}
        onLoadOlderMessages={onLoadOlderMessages}
        onLoadMessageMedia={onLoadMessageMedia}
        isBusy={isBusy}
        onResolveMention={onResolveMention}
      />

      <InboxConversationComposer
        key={conversation.id}
        conversation={conversation}
        workspaceMembers={workspaceMembers}
        currentWorkspaceMemberId={currentWorkspaceMemberId}
        savedReplies={savedReplies}
        macros={macros}
        triageResult={triageResult}
        busyAction={busyAction}
        onSaveInternalNote={onSaveInternalNote}
        onUseSavedReply={onUseSavedReply}
        onPreviewMacro={onPreviewMacro}
        onApplyMacro={onApplyMacro}
        onPreviewExternalMessage={onPreviewExternalMessage}
        onConfirmExternalMessage={onConfirmExternalMessage}
      />
    </StyledMain>
  );
};
