import { styled } from '@linaria/react';
import { IconWand } from 'diex-ui/icon';
import { Button } from 'diex-ui/input';
import { themeCssVariables } from 'diex-ui/theme-constants';

import {
  type InboxMacro,
  type InboxMacroApplyResult,
  type InboxMacroPreview,
} from '@/inbox/types/inboxMacroTypes';

const StyledPanel = styled.section`
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  margin-bottom: ${themeCssVariables.spacing[3]};
  padding-bottom: ${themeCssVariables.spacing[3]};
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
  min-width: 0;
  outline: none;
  padding: 0 ${themeCssVariables.spacing[2]};
`;

const StyledReview = styled.div`
  align-items: flex-end;
  background: ${themeCssVariables.background.transparent.blue};
  border: 1px solid ${themeCssVariables.border.color.blue};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  gap: ${themeCssVariables.spacing[3]};
  justify-content: space-between;
  margin-top: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledReviewTitle = styled.strong`
  color: ${themeCssVariables.font.color.primary};
  display: block;
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledActionList = styled.ul`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.xxs};
  line-height: 1.5;
  margin: ${themeCssVariables.spacing[1]} 0 0;
  padding-left: ${themeCssVariables.spacing[4]};
`;

const StyledWarning = styled.p`
  color: ${themeCssVariables.font.color.danger};
  font-size: ${themeCssVariables.font.size.xxs};
  line-height: 1.4;
  margin: ${themeCssVariables.spacing[1]} 0 0;
`;

const StyledReviewActions = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: flex-end;
`;

const StyledReceipt = styled.div`
  align-items: center;
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.secondary};
  display: flex;
  flex-wrap: wrap;
  font-size: ${themeCssVariables.font.size.xxs};
  gap: ${themeCssVariables.spacing[2]};
  margin-top: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[2]};
`;

const StyledDraftPreview = styled.p`
  color: ${themeCssVariables.font.color.secondary};
  flex-basis: 100%;
  font-size: ${themeCssVariables.font.size.xxs};
  line-height: 1.45;
  margin: 0;
  max-height: 64px;
  overflow-y: auto;
  white-space: pre-wrap;
`;

type InboxMacroPanelProps = {
  availableMacros: InboxMacro[];
  selectedMacroId: string;
  onSelectedMacroIdChange: (macroId: string) => void;
  macroPreview: InboxMacroPreview | null;
  onDismissPreview: () => void;
  onPreviewMacro: () => void;
  onApplyMacro: () => void;
  macroReceipt: InboxMacroApplyResult | null;
  canSendExternal: boolean;
  isBusy: boolean;
  busyAction: string | null;
};

export const InboxMacroPanel = ({
  availableMacros,
  selectedMacroId,
  onSelectedMacroIdChange,
  macroPreview,
  onDismissPreview,
  onPreviewMacro,
  onApplyMacro,
  macroReceipt,
  canSendExternal,
  isBusy,
  busyAction,
}: InboxMacroPanelProps) => (
  <StyledPanel>
    <StyledToolbar>
      <StyledToolbarLabel>
        <IconWand
          size={themeCssVariables.icon.size.sm}
          stroke={themeCssVariables.icon.stroke.md}
        />
        Macro comercial
      </StyledToolbarLabel>
      <StyledSelect
        aria-label="Selecionar macro comercial"
        disabled={availableMacros.length === 0 || isBusy}
        value={selectedMacroId}
        onChange={(event) => onSelectedMacroIdChange(event.target.value)}
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
      </StyledSelect>
      <Button
        variant="secondary"
        size="small"
        title="Prévia"
        disabled={!selectedMacroId || isBusy}
        onClick={onPreviewMacro}
      />
    </StyledToolbar>

    {macroPreview ? (
      <StyledReview>
        <div>
          <StyledReviewTitle>Ações que serão aplicadas</StyledReviewTitle>
          <StyledActionList>
            {macroPreview.actions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </StyledActionList>
          {macroPreview.unresolvedNoteVariables.length > 0 ? (
            <StyledWarning>
              Corrija a configuração da nota:{' '}
              {macroPreview.unresolvedNoteVariables
                .map((variable) => `{{${variable}}}`)
                .join(', ')}
            </StyledWarning>
          ) : null}
          {macroPreview.unresolvedReplyVariables.length > 0 ? (
            <StyledWarning>
              O rascunho exigirá completar:{' '}
              {macroPreview.unresolvedReplyVariables
                .map((variable) => `{{${variable}}}`)
                .join(', ')}
            </StyledWarning>
          ) : null}
        </div>
        <StyledReviewActions>
          <Button
            variant="secondary"
            size="small"
            title="Cancelar"
            disabled={isBusy}
            onClick={onDismissPreview}
          />
          <Button
            variant="primary"
            size="small"
            Icon={IconWand}
            title={
              busyAction === `macro:${macroPreview.macroId}`
                ? 'Aplicando'
                : 'Aplicar macro'
            }
            disabled={isBusy || macroPreview.unresolvedNoteVariables.length > 0}
            onClick={onApplyMacro}
          />
        </StyledReviewActions>
      </StyledReview>
    ) : null}

    {macroReceipt ? (
      <StyledReceipt>
        <StyledReviewTitle>Macro aplicada</StyledReviewTitle>
        <span>
          {macroReceipt.appliedActions.length} ação
          {macroReceipt.appliedActions.length === 1 ? '' : 'ões'}
        </span>
        {macroReceipt.warnings.length > 0 ? (
          <StyledWarning>{macroReceipt.warnings.join(' ')}</StyledWarning>
        ) : null}
        {macroReceipt.replyDraft && !canSendExternal ? (
          <StyledDraftPreview>
            Rascunho preparado: {macroReceipt.replyDraft}
          </StyledDraftPreview>
        ) : null}
      </StyledReceipt>
    ) : null}
  </StyledPanel>
);
