import { styled } from '@linaria/react';
import {
  IconBolt,
  IconCheck,
  IconClock,
  IconMail,
  IconMessage,
  IconSend,
} from 'diex-ui/icon';
import { Button } from 'diex-ui/input';
import { themeCssVariables } from 'diex-ui/theme-constants';

import { type InboxSavedReply } from '@/inbox/types/inboxEntityTypes';
import { type InboxExternalMessagePreview } from '@/inbox/types/inboxExternalMessageTypes';
import { formatDateTime } from '@/inbox/utils/inboxFormatters';

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledToolbar = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledToolbarLabel = styled.span`
  align-items: center;
  color: ${themeCssVariables.font.color.secondary};
  display: inline-flex;
  flex-shrink: 0;
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.medium};
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledSelect = styled.select`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.secondary};
  flex: 1;
  font-family: ${themeCssVariables.font.family};
  font-size: ${themeCssVariables.font.size.xs};
  height: ${themeCssVariables.spacing[8]};
  outline: none;
  padding: 0 ${themeCssVariables.spacing[2]};
`;

const StyledMatches = styled.div`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  box-shadow: ${themeCssVariables.boxShadow.light};
  display: flex;
  flex-direction: column;
  max-height: 180px;
  overflow-y: auto;
`;

const StyledMatchOption = styled.button`
  align-items: center;
  background: transparent;
  border: 0;
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  display: flex;
  font-family: ${themeCssVariables.font.family};
  gap: ${themeCssVariables.spacing[2]};
  min-height: ${themeCssVariables.spacing[8]};
  padding: 0 ${themeCssVariables.spacing[3]};
  text-align: left;
  width: 100%;
`;

const StyledShortcut = styled.span`
  color: ${themeCssVariables.color.blue};
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledMatchName = styled.span`
  color: ${themeCssVariables.font.color.primary};
  flex: 1;
  font-size: ${themeCssVariables.font.size.xs};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledSubjectInput = styled.input`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  box-sizing: border-box;
  color: ${themeCssVariables.font.color.primary};
  font-family: ${themeCssVariables.font.family};
  font-size: ${themeCssVariables.font.size.sm};
  min-height: ${themeCssVariables.spacing[8]};
  outline: none;
  padding: 0 ${themeCssVariables.spacing[3]};
  width: 100%;
`;

const StyledComposerRow = styled.div`
  align-items: flex-end;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledTextarea = styled.textarea`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  box-sizing: border-box;
  color: ${themeCssVariables.font.color.primary};
  font-family: ${themeCssVariables.font.family};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.45;
  min-height: 64px;
  outline: none;
  padding: ${themeCssVariables.spacing[3]};
  resize: none;
  width: 100%;
`;

const StyledSendReview = styled.div`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledSendReviewMeta = styled.div`
  align-items: center;
  color: ${themeCssVariables.font.color.secondary};
  display: flex;
  font-size: ${themeCssVariables.font.size.xs};
  gap: ${themeCssVariables.spacing[1]};
  justify-content: space-between;
`;

const StyledSendReviewSubject = styled.p`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.medium};
  margin: ${themeCssVariables.spacing[2]} 0 0;
`;

const StyledSendReviewText = styled.p`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.45;
  margin: ${themeCssVariables.spacing[2]} 0;
  max-height: 112px;
  overflow-y: auto;
  padding: ${themeCssVariables.spacing[2]};
  white-space: pre-wrap;
`;

const StyledSendReviewActions = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: flex-end;
`;

type InboxExternalComposerProps = {
  isEmailConversation: boolean;
  availableSavedReplies: InboxSavedReply[];
  matchingSavedReplies: InboxSavedReply[];
  onUseSavedReply: (savedReply: InboxSavedReply) => void;
  externalSubject: string;
  onExternalSubjectChange: (value: string) => void;
  externalText: string;
  onExternalTextChange: (value: string) => void;
  onRequestSendPreview: () => void;
  sendPreview: InboxExternalMessagePreview | null;
  onEditSendPreview: () => void;
  onConfirmSend: () => void;
  isBusy: boolean;
  busyAction: string | null;
};

export const InboxExternalComposer = ({
  isEmailConversation,
  availableSavedReplies,
  matchingSavedReplies,
  onUseSavedReply,
  externalSubject,
  onExternalSubjectChange,
  externalText,
  onExternalTextChange,
  onRequestSendPreview,
  sendPreview,
  onEditSendPreview,
  onConfirmSend,
  isBusy,
  busyAction,
}: InboxExternalComposerProps) => {
  if (sendPreview) {
    return (
      <StyledSendReview>
        <StyledSendReviewMeta>
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
        </StyledSendReviewMeta>
        {sendPreview.channel === 'EMAIL' ? (
          <StyledSendReviewSubject>
            Assunto: {sendPreview.subjectPreview}
          </StyledSendReviewSubject>
        ) : null}
        <StyledSendReviewText>{sendPreview.textPreview}</StyledSendReviewText>
        <StyledSendReviewActions>
          <Button
            variant="secondary"
            size="small"
            title="Editar"
            disabled={isBusy}
            onClick={onEditSendPreview}
          />
          <Button
            variant="primary"
            size="small"
            Icon={IconSend}
            title={
              busyAction === 'send-confirm' ? 'Enviando' : 'Confirmar envio'
            }
            disabled={isBusy}
            onClick={onConfirmSend}
          />
        </StyledSendReviewActions>
      </StyledSendReview>
    );
  }

  return (
    <StyledContainer>
      <StyledToolbar>
        <StyledToolbarLabel>
          <IconBolt
            size={themeCssVariables.icon.size.sm}
            stroke={themeCssVariables.icon.stroke.md}
          />
          Resposta pronta
        </StyledToolbarLabel>
        <StyledSelect
          aria-label="Selecionar resposta pronta"
          disabled={availableSavedReplies.length === 0 || isBusy}
          value=""
          onChange={(event) => {
            const savedReply = availableSavedReplies.find(
              ({ id }) => id === event.target.value,
            );

            if (savedReply) {
              onUseSavedReply(savedReply);
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
        </StyledSelect>
      </StyledToolbar>

      {matchingSavedReplies.length > 0 ? (
        <StyledMatches>
          {matchingSavedReplies.map((savedReply) => (
            <StyledMatchOption
              key={savedReply.id}
              type="button"
              disabled={isBusy}
              onClick={() => onUseSavedReply(savedReply)}
            >
              <StyledShortcut>/{savedReply.shortcut}</StyledShortcut>
              <StyledMatchName>{savedReply.name}</StyledMatchName>
            </StyledMatchOption>
          ))}
        </StyledMatches>
      ) : null}

      {isEmailConversation ? (
        <StyledSubjectInput
          aria-label="Assunto do e-mail"
          placeholder="Assunto do e-mail"
          value={externalSubject}
          maxLength={998}
          disabled={isBusy}
          onChange={(event) => onExternalSubjectChange(event.target.value)}
        />
      ) : null}

      <StyledComposerRow>
        <StyledTextarea
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
          onChange={(event) => onExternalTextChange(event.target.value)}
        />
        <Button
          variant="primary"
          Icon={IconCheck}
          title={busyAction === 'send-preview' ? 'Validando' : 'Revisar envio'}
          disabled={externalText.trim().length === 0 || isBusy}
          onClick={onRequestSendPreview}
        />
      </StyledComposerRow>
    </StyledContainer>
  );
};
