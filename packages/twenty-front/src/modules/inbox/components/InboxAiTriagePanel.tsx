import { styled } from '@linaria/react';
import { IconSparkles } from 'twenty-ui/icon';
import { Button } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { type InboxTriageResult } from '@/inbox/types/inboxExternalMessageTypes';

const StyledPanel = styled.section`
  background: ${themeCssVariables.background.transparent.blue};
  border: 1px solid ${themeCssVariables.border.color.blue};
  border-radius: ${themeCssVariables.border.radius.md};
  margin-bottom: ${themeCssVariables.spacing[3]};
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledHeader = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: space-between;
`;

const StyledTitle = styled.div`
  align-items: center;
  color: ${themeCssVariables.font.color.primary};
  display: flex;
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledConfidence = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xxs};
`;

const StyledSummary = styled.p`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.xs};
  line-height: 1.45;
  margin: ${themeCssVariables.spacing[2]} 0 0;
`;

const StyledRecommendation = styled.p`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.medium};
  line-height: 1.45;
  margin: ${themeCssVariables.spacing[1]} 0 0;
`;

const StyledDraftRow = styled.div`
  align-items: flex-end;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  margin-top: ${themeCssVariables.spacing[2]};
`;

const StyledDraftText = styled.p`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.primary};
  flex: 1;
  font-size: ${themeCssVariables.font.size.xs};
  line-height: 1.45;
  margin: 0;
  max-height: 84px;
  overflow-y: auto;
  padding: ${themeCssVariables.spacing[2]};
  white-space: pre-wrap;
`;

const StyledHint = styled.p`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xxs};
  margin: ${themeCssVariables.spacing[2]} 0 0;
`;

type InboxAiTriagePanelProps = {
  triageResult: InboxTriageResult;
  canSendExternal: boolean;
  isBusy: boolean;
  onUseDraft: () => void;
};

export const InboxAiTriagePanel = ({
  triageResult,
  canSendExternal,
  isBusy,
  onUseDraft,
}: InboxAiTriagePanelProps) => (
  <StyledPanel>
    <StyledHeader>
      <StyledTitle>
        <IconSparkles
          size={themeCssVariables.icon.size.sm}
          stroke={themeCssVariables.icon.stroke.md}
        />
        Diagnóstico comercial
      </StyledTitle>
      <StyledConfidence>
        {Math.round(triageResult.confidence * 100)}% confiança
      </StyledConfidence>
    </StyledHeader>
    <StyledSummary>{triageResult.summary}</StyledSummary>
    <StyledRecommendation>
      Próxima ação: {triageResult.recommendedAction}
    </StyledRecommendation>
    {triageResult.suggestedReply ? (
      <StyledDraftRow>
        <StyledDraftText>{triageResult.suggestedReply}</StyledDraftText>
        <Button
          variant="secondary"
          size="small"
          title="Usar rascunho"
          disabled={!canSendExternal || isBusy}
          onClick={onUseDraft}
        />
      </StyledDraftRow>
    ) : null}
    <StyledHint>
      A IA registra o sinal e propõe a ação. Nada é enviado sem sua revisão e
      confirmação.
    </StyledHint>
  </StyledPanel>
);
