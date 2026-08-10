import { styled } from '@linaria/react';
import { Button } from 'diex-ui/input';
import { themeCssVariables } from 'diex-ui/theme-constants';

import {
  DiexAccessRequestBadge,
  type DiexAccessRequestBadgeTone,
} from '@/diex-access-requests/components/DiexAccessRequestBadge';
import {
  type DiexAccessRequestApprovalOutcome,
  type DiexAccessRequestRecord,
  DiexAccessRequestStatus,
} from '@/diex-access-requests/types/diexAccessRequestTypes';
import { formatDiexAccessRequestDateTime } from '@/diex-access-requests/utils/diexAccessRequestFormatters';
import { TextInput } from '@/ui/input/components/TextInput';

const STATUS_LABEL: Record<
  string,
  { label: string; tone: DiexAccessRequestBadgeTone }
> = {
  NEW: { label: 'Nova', tone: 'blue' },
  CONTACTED: { label: 'Contatada', tone: 'turquoise' },
  NEGOTIATING: { label: 'Em negociação', tone: 'yellow' },
  APPROVED: { label: 'Aprovada', tone: 'green' },
  REJECTED: { label: 'Recusada', tone: 'gray' },
};

const StyledCard = styled.article`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.lg};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  padding: ${themeCssVariables.spacing[5]};
`;

const StyledCardHead = styled.div`
  align-items: baseline;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: space-between;
`;

const StyledCompany = styled.h2`
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  margin: 0;
`;

const StyledActions = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledMeta = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
`;

const StyledDetailGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
`;

const StyledDetailLabel = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xxs};
`;

const StyledDetailValue = styled.div`
  font-size: ${themeCssVariables.font.size.sm};
  overflow-wrap: anywhere;
`;

const StyledGoal = styled.p`
  background: ${themeCssVariables.background.secondary};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
  margin: 0;
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
`;

const StyledOutcome = styled.div`
  background: ${themeCssVariables.background.transparent.blue};
  border: 1px solid ${themeCssVariables.border.color.blue};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.color.blue};
  font-size: ${themeCssVariables.font.size.sm};
  padding: ${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[4]};
`;

const StyledWarning = styled.div`
  background: ${themeCssVariables.background.transparent.danger};
  border: 1px solid ${themeCssVariables.border.color.danger};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.danger};
  font-size: ${themeCssVariables.font.size.sm};
  padding: ${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[4]};
`;

const StyledSubdomainInput = styled.div`
  min-width: 280px;
`;

const Detail = ({ label, value }: { label: string; value: string }) => (
  <div>
    <StyledDetailLabel>{label}</StyledDetailLabel>
    <StyledDetailValue>{value}</StyledDetailValue>
  </div>
);

type DiexAccessRequestCardProps = {
  request: DiexAccessRequestRecord;
  isBusy: boolean;
  subdomainDraft: string;
  outcome?: DiexAccessRequestApprovalOutcome;
  onSubdomainChange: (value: string) => void;
  onApprove: () => void;
  onRetryInvitation: () => void;
  onSetStatus: (status: DiexAccessRequestStatus) => void;
};

export const DiexAccessRequestCard = ({
  request,
  isBusy,
  subdomainDraft,
  outcome,
  onSubdomainChange,
  onApprove,
  onRetryInvitation,
  onSetStatus,
}: DiexAccessRequestCardProps) => {
  const isDecided =
    request.status === DiexAccessRequestStatus.APPROVED ||
    request.status === DiexAccessRequestStatus.REJECTED;
  const status = STATUS_LABEL[request.status ?? 'NEW'] ?? STATUS_LABEL.NEW;

  return (
    <StyledCard>
      <StyledCardHead>
        <StyledCompany>{request.name ?? 'Sem nome'}</StyledCompany>
        <StyledActions>
          {(request.submissionCount ?? 1) > 1 ? (
            <DiexAccessRequestBadge tone="gray">
              {request.submissionCount} envios
            </DiexAccessRequestBadge>
          ) : null}
          <DiexAccessRequestBadge tone={status.tone}>
            {status.label}
          </DiexAccessRequestBadge>
          <StyledMeta>
            {formatDiexAccessRequestDateTime(request.requestedAt)}
          </StyledMeta>
        </StyledActions>
      </StyledCardHead>

      <StyledDetailGrid>
        <Detail label="WhatsApp" value={request.whatsapp ?? '—'} />
        <Detail label="E-mail" value={request.email ?? '—'} />
        <Detail label="Quem pediu" value={request.contactName ?? '—'} />
        <Detail label="Time comercial" value={request.teamSize ?? '—'} />
      </StyledDetailGrid>

      {request.goal ? <StyledGoal>{request.goal}</StyledGoal> : null}

      {request.provisionedSubdomain &&
      request.status === DiexAccessRequestStatus.APPROVED ? (
        <StyledOutcome>
          Workspace entregue em {request.provisionedSubdomain}.crm.bydiex.com
          {' — '}
          {outcome?.invitationMessage ??
            'Ative o workspace e depois envie o convite por esta fila.'}
        </StyledOutcome>
      ) : null}

      {request.provisionedSubdomain &&
      request.status !== DiexAccessRequestStatus.APPROVED ? (
        <StyledWarning>
          Provisionamento interrompido em {request.provisionedSubdomain}. Se
          esse endereço foi ocupado, informe outro: a aprovação reatribui a
          reserva somente quando não existe workspace recuperável.
        </StyledWarning>
      ) : null}

      {request.status === DiexAccessRequestStatus.APPROVED && request.email ? (
        <StyledActions>
          <Button
            variant="secondary"
            title="Enviar convite"
            onClick={onRetryInvitation}
            disabled={isBusy}
            isLoading={isBusy}
          />
        </StyledActions>
      ) : null}

      {isDecided ? null : (
        <StyledActions>
          <StyledSubdomainInput>
            <TextInput
              value={subdomainDraft}
              placeholder="endereco"
              rightAdornment=".crm.bydiex.com"
              onChange={onSubdomainChange}
              disabled={isBusy}
              fullWidth
            />
          </StyledSubdomainInput>
          <Button
            title="Aprovar e criar workspace"
            onClick={onApprove}
            disabled={isBusy}
            isLoading={isBusy}
          />
          <Button
            variant="secondary"
            title="Marcar como contatada"
            onClick={() => onSetStatus(DiexAccessRequestStatus.CONTACTED)}
            disabled={isBusy}
          />
          <Button
            variant="secondary"
            accent="danger"
            title="Recusar"
            onClick={() => onSetStatus(DiexAccessRequestStatus.REJECTED)}
            disabled={isBusy}
          />
        </StyledActions>
      )}
    </StyledCard>
  );
};
