import { useState } from 'react';
import { styled } from '@linaria/react';
import { IconMail, IconMessage, IconNotes } from 'diex-ui/icon';
import { themeCssVariables } from 'diex-ui/theme-constants';

import { InboxAiTriagePanel } from '@/inbox/components/InboxAiTriagePanel';
import { InboxExternalComposer } from '@/inbox/components/InboxExternalComposer';
import { InboxInternalComposer } from '@/inbox/components/InboxInternalComposer';
import { InboxMacroPanel } from '@/inbox/components/InboxMacroPanel';
import {
  type InboxConversation,
  type InboxSavedReply,
  type InboxWorkspaceMember,
} from '@/inbox/types/inboxEntityTypes';
import {
  type InboxExternalMessagePreview,
  type InboxTriageResult,
} from '@/inbox/types/inboxExternalMessageTypes';
import {
  type InboxMacro,
  type InboxMacroApplyResult,
  type InboxMacroPreview,
} from '@/inbox/types/inboxMacroTypes';
import { getRecordName } from '@/inbox/utils/getRecordName';
import { getInboxChannelLabel } from '@/inbox/utils/getInboxChannelLabel';
import { readDiexEmailConversationMetadata } from '@/inbox/utils/readDiexEmailConversationMetadata';

const StyledFooter = styled.footer`
  background: ${themeCssVariables.background.primary};
  border-top: 1px solid ${themeCssVariables.border.color.light};
  flex-shrink: 0;
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledModeRow = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[1]};
  margin-bottom: ${themeCssVariables.spacing[2]};
`;

const StyledModeButton = styled.button<{ isActive: boolean }>`
  align-items: center;
  background: ${({ isActive }) =>
    isActive ? themeCssVariables.background.tertiary : 'transparent'};
  border: 0;
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${({ isActive }) =>
    isActive
      ? themeCssVariables.font.color.primary
      : themeCssVariables.font.color.tertiary};
  cursor: pointer;
  display: inline-flex;
  font-family: ${themeCssVariables.font.family};
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.medium};
  gap: ${themeCssVariables.spacing[1]};
  min-height: ${themeCssVariables.spacing[7]};
  padding: 0 ${themeCssVariables.spacing[2]};
`;

const StyledHint = styled.p`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xxs};
  margin: ${themeCssVariables.spacing[2]} 0 0;
`;

type ComposerMode = 'EXTERNAL' | 'INTERNAL';

// Rendered with key={conversation.id} by the caller, so a conversation switch
// remounts this component: these compute the fresh conversation's starting
// mode and reply-to subject once, instead of syncing state via an effect.
const getInitialComposerMode = (
  conversation: InboxConversation,
): ComposerMode => {
  const isEvolution =
    conversation.channel === 'WHATSAPP' &&
    conversation.provider === 'EVOLUTION';
  const isDiexEmail =
    conversation.channel === 'EMAIL' && conversation.provider === 'DIEX_EMAIL';

  return isEvolution || isDiexEmail ? 'EXTERNAL' : 'INTERNAL';
};

const getInitialExternalSubject = (conversation: InboxConversation): string => {
  const isDiexEmail =
    conversation.channel === 'EMAIL' && conversation.provider === 'DIEX_EMAIL';
  const sourceSubject =
    readDiexEmailConversationMetadata(conversation.metadata)?.subject?.trim() ??
    '';

  if (!isDiexEmail || sourceSubject.length === 0) {
    return '';
  }

  return /^re:/i.test(sourceSubject) ? sourceSubject : `Re: ${sourceSubject}`;
};

type InboxConversationComposerProps = {
  conversation: InboxConversation;
  workspaceMembers: InboxWorkspaceMember[];
  currentWorkspaceMemberId: string | null;
  savedReplies: InboxSavedReply[];
  macros: InboxMacro[];
  triageResult: InboxTriageResult | null;
  busyAction: string | null;
  onSaveInternalNote: (
    body: string,
    mentionedWorkspaceMemberIds?: string[],
  ) => Promise<boolean>;
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
};

export const InboxConversationComposer = ({
  conversation,
  workspaceMembers,
  currentWorkspaceMemberId,
  savedReplies,
  macros,
  triageResult,
  busyAction,
  onSaveInternalNote,
  onUseSavedReply,
  onPreviewMacro,
  onApplyMacro,
  onPreviewExternalMessage,
  onConfirmExternalMessage,
}: InboxConversationComposerProps) => {
  const [composerMode, setComposerMode] = useState<ComposerMode>(() =>
    getInitialComposerMode(conversation),
  );
  const [externalText, setExternalText] = useState('');
  const [externalSubject, setExternalSubject] = useState(() =>
    getInitialExternalSubject(conversation),
  );
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

  const isBusy = busyAction !== null;
  const isEvolutionConversation =
    conversation.channel === 'WHATSAPP' &&
    conversation.provider === 'EVOLUTION';
  const isEmailConversation =
    conversation.channel === 'EMAIL' && conversation.provider === 'DIEX_EMAIL';
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
  const shortcutQuery = externalText
    .match(/^\/([^\s]*)$/)?.[1]
    ?.toLocaleLowerCase('pt-BR');
  const matchingSavedReplies =
    shortcutQuery === undefined
      ? []
      : availableSavedReplies
          .filter((savedReply) =>
            [savedReply.shortcut, savedReply.name, savedReply.category]
              .filter(Boolean)
              .join(' ')
              .toLocaleLowerCase('pt-BR')
              .includes(shortcutQuery),
          )
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

    if (preview) {
      setMacroPreview(preview);
      setMacroReceipt(null);
    }
  };

  const handleApplyMacro = async () => {
    if (!macroPreview) {
      return;
    }

    const receipt = await onApplyMacro(macroPreview.macroId);

    if (!receipt) {
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

    if (preview) {
      setSendPreview(preview);
    }
  };

  const handleConfirmSend = async () => {
    if (!sendPreview) {
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
    <StyledFooter>
      <InboxMacroPanel
        availableMacros={availableMacros}
        selectedMacroId={selectedMacroId}
        onSelectedMacroIdChange={(macroId) => {
          setSelectedMacroId(macroId);
          setMacroPreview(null);
          setMacroReceipt(null);
        }}
        macroPreview={macroPreview}
        onDismissPreview={() => setMacroPreview(null)}
        onPreviewMacro={() => void handlePreviewMacro()}
        onApplyMacro={() => void handleApplyMacro()}
        macroReceipt={macroReceipt}
        canSendExternal={canSendExternal}
        isBusy={isBusy}
        busyAction={busyAction}
      />

      {activeTriageResult ? (
        <InboxAiTriagePanel
          triageResult={activeTriageResult}
          canSendExternal={canSendExternal}
          isBusy={isBusy}
          onUseDraft={handleUseAiDraft}
        />
      ) : null}

      <StyledModeRow>
        <StyledModeButton
          type="button"
          isActive={composerMode === 'EXTERNAL'}
          disabled={!canSendExternal || isBusy}
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
        </StyledModeButton>
        <StyledModeButton
          type="button"
          isActive={composerMode === 'INTERNAL'}
          disabled={isBusy}
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
        </StyledModeButton>
      </StyledModeRow>

      {composerMode === 'EXTERNAL' ? (
        <InboxExternalComposer
          isEmailConversation={isEmailConversation}
          availableSavedReplies={availableSavedReplies}
          matchingSavedReplies={matchingSavedReplies}
          onUseSavedReply={(savedReply) => void handleUseSavedReply(savedReply)}
          externalSubject={externalSubject}
          onExternalSubjectChange={setExternalSubject}
          externalText={externalText}
          onExternalTextChange={setExternalText}
          onRequestSendPreview={() => void handleRequestSendPreview()}
          sendPreview={sendPreview}
          onEditSendPreview={() => setSendPreview(null)}
          onConfirmSend={() => void handleConfirmSend()}
          isBusy={isBusy}
          busyAction={busyAction}
        />
      ) : (
        <InboxInternalComposer
          internalNote={internalNote}
          onInternalNoteChange={setInternalNote}
          onSaveNote={() => void handleSaveNote()}
          isBusy={isBusy}
          busyAction={busyAction}
          matchingWorkspaceMembers={matchingWorkspaceMembers}
          onAddMention={handleAddMention}
          mentionedWorkspaceMembers={mentionedWorkspaceMembers}
          onRemoveMention={(workspaceMemberId) =>
            setMentionedWorkspaceMemberIds((current) =>
              current.filter((id) => id !== workspaceMemberId),
            )
          }
        />
      )}

      <StyledHint>
        {composerMode === 'EXTERNAL'
          ? isEmailConversation
            ? 'O envio usa a conta nativa do Diex disponível ao seu usuário. Revise destinatário, assunto e corpo antes de confirmar.'
            : 'Você pode responder enquanto o contato escreveu nas últimas 24 horas. Depois disso, o envio exige consentimento registrado. Gere a prévia e confirme o texto exato.'
          : 'A nota fica apenas no CRM. Usuários selecionados recebem uma pendência pessoal até resolverem a menção.'}
      </StyledHint>
      {!canSendExternal ? (
        <StyledHint>
          <IconNotes
            size={themeCssVariables.icon.size.sm}
            stroke={themeCssVariables.icon.stroke.md}
          />{' '}
          O envio externo por {getInboxChannelLabel(conversation.channel)} ainda
          não está disponível nesta instalação. Registre o atendimento por nota
          interna.
        </StyledHint>
      ) : null}
    </StyledFooter>
  );
};
