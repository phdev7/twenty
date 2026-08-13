import { styled } from '@linaria/react';
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
  entryRoute?: string;
  primaryChannel?: string | null;
  isReady?: boolean;
  onRefresh?: () => void;
};

export const DiexOnboardingDataFlowStep = ({
  index = 6,
  dataFlow,
  inboxRoute = '/inbox',
  entryRoute = '/objects/people',
  primaryChannel = null,
  isReady,
  onRefresh,
}: DiexOnboardingDataFlowStepProps) => {
  const isRecordBasedEntry =
    primaryChannel === 'IMPORT' || primaryChannel === 'MANUAL';
  const isDataFlowing =
    isReady ??
    (isRecordBasedEntry ? dataFlow.peopleCount > 0 : dataFlow.messageCount > 0);
  const metricValue = (
    source: DataFlowSummary['unconfirmedSources'][number],
    value: number,
  ) => (dataFlow.unconfirmedSources.includes(source) ? '—' : value);

  return (
    <DiexOnboardingStepCard
      index={index}
      isDone={isDataFlowing}
      title={
        isRecordBasedEntry
          ? 'Registrar a primeira entrada real'
          : 'Ver a primeira conversa entrar'
      }
      badges={
        <DiexOnboardingBadge tone={isDataFlowing ? 'green' : 'gray'}>
          {isRecordBasedEntry
            ? isDataFlowing
              ? 'Entrada registrada'
              : 'Aguardando registro'
            : isDataFlowing
              ? 'Recebendo'
              : 'Aguardando tráfego'}
        </DiexOnboardingBadge>
      }
    >
      <StyledText>
        {isDataFlowing
          ? isRecordBasedEntry
            ? 'A base já possui registros reais. Confirme contato, oportunidade e próxima ação antes de avançar.'
            : 'As mensagens estão chegando e virando contato e histórico sozinhas.'
          : isRecordBasedEntry
            ? primaryChannel === 'IMPORT'
              ? 'Importe uma base real ou cadastre o primeiro contato. Depois, vincule uma oportunidade e uma próxima ação com responsável.'
              : 'Cadastre o primeiro contato real. Depois, vincule uma oportunidade e uma próxima ação com responsável.'
            : primaryChannel === 'EMAIL'
              ? 'Depois de conectar o e-mail, envie uma mensagem real para validar a entrada.'
              : 'Depois de conectar, mande uma mensagem de outro celular para o canal principal. Ela deve aparecer aqui em segundos.'}
      </StyledText>
      {dataFlow.errorMessage ? (
        <StyledText>
          Não foi possível confirmar todas as contagens. Os valores afetados
          aparecem como “—”; atualize antes de concluir que não há dados.
        </StyledText>
      ) : null}
      <StyledMetrics>
        {!isRecordBasedEntry ? (
          <>
            <StyledMetric>
              <StyledMetricValue>
                {metricValue('conversations', dataFlow.conversationCount)}
              </StyledMetricValue>
              <StyledMetricLabel>Conversas</StyledMetricLabel>
            </StyledMetric>
            <StyledMetric>
              <StyledMetricValue>
                {metricValue('messages', dataFlow.messageCount)}
              </StyledMetricValue>
              <StyledMetricLabel>Mensagens</StyledMetricLabel>
            </StyledMetric>
          </>
        ) : null}
        <StyledMetric>
          <StyledMetricValue>
            {metricValue('people', dataFlow.peopleCount)}
          </StyledMetricValue>
          <StyledMetricLabel>Contatos</StyledMetricLabel>
        </StyledMetric>
        {isRecordBasedEntry ? (
          <>
            <StyledMetric>
              <StyledMetricValue>
                {metricValue('opportunities', dataFlow.opportunityCount)}
              </StyledMetricValue>
              <StyledMetricLabel>Oportunidades</StyledMetricLabel>
            </StyledMetric>
            <StyledMetric>
              <StyledMetricValue>
                {metricValue('tasks', dataFlow.taskCount)}
              </StyledMetricValue>
              <StyledMetricLabel>Próximas ações</StyledMetricLabel>
            </StyledMetric>
          </>
        ) : null}
        <StyledMetric>
          <StyledMetricValue>
            {metricValue('offers', dataFlow.offerCount)}
          </StyledMetricValue>
          <StyledMetricLabel>Ofertas</StyledMetricLabel>
        </StyledMetric>
      </StyledMetrics>
      <StyledActions>
        <Button
          title={
            isRecordBasedEntry
              ? primaryChannel === 'IMPORT'
                ? 'Abrir contatos e importar base'
                : 'Cadastrar primeiro contato'
              : 'Abrir Inbox da operação'
          }
          variant="secondary"
          to={isRecordBasedEntry ? entryRoute : inboxRoute}
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
