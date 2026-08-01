import { styled } from '@linaria/react';
import { IconAt, IconNotes } from 'twenty-ui/icon';
import { Button } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { type InboxWorkspaceMember } from '@/inbox/types/inboxEntityTypes';
import { getRecordName } from '@/inbox/utils/getRecordName';

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
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

const StyledSuggestions = styled.div`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  box-shadow: ${themeCssVariables.boxShadow.light};
  display: flex;
  flex-direction: column;
  max-height: 180px;
  overflow-y: auto;
`;

const StyledSuggestionOption = styled.button`
  align-items: center;
  background: transparent;
  border: 0;
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  display: flex;
  font-family: ${themeCssVariables.font.family};
  font-size: ${themeCssVariables.font.size.xs};
  gap: ${themeCssVariables.spacing[2]};
  min-height: ${themeCssVariables.spacing[8]};
  padding: 0 ${themeCssVariables.spacing[3]};
  text-align: left;
  width: 100%;
`;

const StyledMentionChips = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledMentionChip = styled.span`
  align-items: center;
  background: ${themeCssVariables.tag.background.gray};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.pill};
  color: ${themeCssVariables.tag.text.gray};
  display: inline-flex;
  font-size: ${themeCssVariables.font.size.xxs};
  font-weight: ${themeCssVariables.font.weight.medium};
  gap: ${themeCssVariables.spacing[1]};
  min-height: ${themeCssVariables.spacing[6]};
  padding: 0 ${themeCssVariables.spacing[2]};
`;

const StyledMentionRemoveButton = styled.button`
  align-items: center;
  background: transparent;
  border: 0;
  color: inherit;
  cursor: pointer;
  display: inline-flex;
  font-family: ${themeCssVariables.font.family};
  font-size: ${themeCssVariables.font.size.sm};
  justify-content: center;
  line-height: 1;
  padding: 0;
`;

type InboxInternalComposerProps = {
  internalNote: string;
  onInternalNoteChange: (value: string) => void;
  onSaveNote: () => void;
  isBusy: boolean;
  busyAction: string | null;
  matchingWorkspaceMembers: InboxWorkspaceMember[];
  onAddMention: (workspaceMember: InboxWorkspaceMember) => void;
  mentionedWorkspaceMembers: InboxWorkspaceMember[];
  onRemoveMention: (workspaceMemberId: string) => void;
};

export const InboxInternalComposer = ({
  internalNote,
  onInternalNoteChange,
  onSaveNote,
  isBusy,
  busyAction,
  matchingWorkspaceMembers,
  onAddMention,
  mentionedWorkspaceMembers,
  onRemoveMention,
}: InboxInternalComposerProps) => (
  <StyledContainer>
    <StyledComposerRow>
      <StyledTextarea
        aria-label="Adicionar nota interna"
        placeholder="Registre o contexto e use @ para mencionar alguém..."
        value={internalNote}
        onChange={(event) => onInternalNoteChange(event.target.value)}
      />
      <Button
        variant="primary"
        Icon={IconNotes}
        title={busyAction === 'note' ? 'Salvando' : 'Salvar nota'}
        disabled={internalNote.trim().length === 0 || isBusy}
        onClick={onSaveNote}
      />
    </StyledComposerRow>

    {matchingWorkspaceMembers.length > 0 ? (
      <StyledSuggestions>
        {matchingWorkspaceMembers.map((workspaceMember) => (
          <StyledSuggestionOption
            key={workspaceMember.id}
            type="button"
            disabled={isBusy}
            onClick={() => onAddMention(workspaceMember)}
          >
            <IconAt
              size={themeCssVariables.icon.size.sm}
              stroke={themeCssVariables.icon.stroke.md}
            />
            {getRecordName(workspaceMember) || 'Usuário sem nome'}
          </StyledSuggestionOption>
        ))}
      </StyledSuggestions>
    ) : null}

    {mentionedWorkspaceMembers.length > 0 ? (
      <StyledMentionChips>
        {mentionedWorkspaceMembers.map((workspaceMember) => (
          <StyledMentionChip key={workspaceMember.id}>
            <IconAt
              size={themeCssVariables.icon.size.sm}
              stroke={themeCssVariables.icon.stroke.md}
            />
            {getRecordName(workspaceMember) || 'Usuário sem nome'}
            <StyledMentionRemoveButton
              type="button"
              aria-label={`Remover menção a ${getRecordName(workspaceMember) || 'usuário'}`}
              onClick={() => onRemoveMention(workspaceMember.id)}
            >
              ×
            </StyledMentionRemoveButton>
          </StyledMentionChip>
        ))}
      </StyledMentionChips>
    ) : null}
  </StyledContainer>
);
