import { styled } from '@linaria/react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'diex-ui/input';
import { themeCssVariables } from 'diex-ui/theme-constants';

import { DiexOnboardingBadge } from '@/diex-onboarding/components/DiexOnboardingBadge';
import {
  DiexOnboardingStepCard,
  StyledActions,
  StyledText,
} from '@/diex-onboarding/components/DiexOnboardingStepCard';
import { type DataFlowSummary } from '@/diex-onboarding/types/diexOnboardingTypes';

const StyledMetrics = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
`;

const StyledMetric = styled.div`
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  padding: ${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[4]};
`;

const StyledMetricValue = styled.div`
  font-size: ${themeCssVariables.font.size.xl};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  line-height: 1.2;
`;

const StyledMetricLabel = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xxs};
  margin-top: ${themeCssVariables.spacing[1]};
`;

type DiexOnboardingDataFlowStepProps = {
  index?: number;
  dataFlow: DataFlowSummary;
  inboxRoute?: string;
  onRefresh?: () => void;
};

export const DiexOnboardingDataFlowStep = ({
  index = 6,
  dataFlow,
  inboxRoute = '/inbox',
  onRefresh,
}: DiexOnboardingDataFlowStepProps) => {
  const navigate = useNavigate();
  const isDataFlowing = dataFlow.messageCount > 0;

  return (
    <DiexOnboardingStepCard
      index={index}
      isDone={isDataFlowing}
      title="Ver a primeira conversa entrar"
      badges={
        <DiexOnboardingBadge tone={isDataFlowing ? 'green' : 'gray'}>
          {isDataFlowing ? 'Recebendo' : 'Sem tráfego'}
        </DiexOnboardingBadge>
      }
    >
      <StyledText>
        {isDataFlowing
          ? 'As mensagens estão chegando e virando contato e histórico sozinhas.'
          : 'Depois de conectar, mande uma mensagem de outro celular para o canal principal. Ela deve aparecer aqui em segundos.'}
      </StyledText>
      <StyledMetrics>
        <StyledMetric>
          <StyledMetricValue>{dataFlow.conversationCount}</StyledMetricValue>
          <StyledMetricLabel>Conversas</StyledMetricLabel>
        </StyledMetric>
        <StyledMetric>
          <StyledMetricValue>{dataFlow.messageCount}</StyledMetricValue>
          <StyledMetricLabel>Mensagens</StyledMetricLabel>
        </StyledMetric>
        <StyledMetric>
          <StyledMetricValue>{dataFlow.peopleCount}</StyledMetricValue>
          <StyledMetricLabel>Contatos</StyledMetricLabel>
        </StyledMetric>
        <StyledMetric>
          <StyledMetricValue>{dataFlow.offerCount}</StyledMetricValue>
          <StyledMetricLabel>Ofertas</StyledMetricLabel>
        </StyledMetric>
      </StyledMetrics>
      <StyledActions>
        <Button
          title="Abrir Inbox da operação"
          variant="secondary"
          onClick={() => navigate(inboxRoute)}
        />
        {onRefresh ? (
          <Button
            title="Atualizar prova da primeira entrada"
            variant="secondary"
            onClick={onRefresh}
          />
        ) : null}
      </StyledActions>
    </DiexOnboardingStepCard>
  );
};
