import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import { useState } from 'react';

import {
  CommandCenterCard,
  CommandCenterEmptyState,
  CommandCenterGrid,
  CommandCenterList,
  CommandCenterLoadingState,
  CommandCenterMetric,
  CommandCenterMetrics,
  CommandCenterPage,
  CommandCenterRow,
} from '@/diex-command-centers/components/CommandCenterLayout';
import { postLogicFunction } from '@/diex-command-centers/utils/useLogicFunctionRequest';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { Button, Tag } from 'twenty-ui';

const AI_ACTIONS_QUERY = gql`
  query DiexAiActions {
    aiActions(first: 100, orderBy: [{ requestedAt: DescNullsLast }]) {
      edges {
        node {
          id name actionType status confidence requiresApproval
          requestedAt approvedAt executedAt
          rationale { markdown }
          proposedAction { markdown }
          executionReceipt { markdown }
          opportunity { id name }
          commercialSignal { id name }
          successPlan { id name }
          customerRenewal { id name }
          inboxConversation { id name }
          executionTask { id title dueAt status }
        }
      }
    }
  }
`;

const REVIEW_AI_ACTION = gql`
  mutation DiexReviewAiAction($id: UUID!, $data: AiActionUpdateInput!) {
    updateAiAction(id: $id, data: $data) { id }
  }
`;

type AiAction = {
  id: string;
  name: string;
  actionType: string;
  status: string;
  confidence?: number | null;
  requiresApproval: boolean;
  requestedAt?: string | null;
  proposedAction?: { markdown?: string | null } | null;
  opportunity?: { name?: string | null } | null;
  commercialSignal?: { name?: string | null } | null;
  successPlan?: { name?: string | null } | null;
  customerRenewal?: { name?: string | null } | null;
  inboxConversation?: { name?: string | null } | null;
};
type AiActionsData = { aiActions?: { edges?: Array<{ node: AiAction }> } };
type ExecutionPreview = {
  supported: boolean;
  message: string;
  blockedReason?: string;
  confirmationToken?: string;
};

const relatedName = (action: AiAction): string =>
  action.opportunity?.name ??
  action.commercialSignal?.name ??
  action.successPlan?.name ??
  action.customerRenewal?.name ??
  action.inboxConversation?.name ??
  'Sem registro vinculado';

const statusColor = (status: string): 'blue' | 'green' | 'orange' | 'red' | 'gray' =>
  status === 'EXECUTED'
    ? 'green'
    : status === 'REJECTED' || status === 'FAILED'
      ? 'red'
      : status === 'PENDING_APPROVAL'
        ? 'orange'
        : status === 'APPROVED'
          ? 'blue'
          : 'gray';

export const AiCommandCenterPage = () => {
  const { data, loading, error, refetch } = useQuery<AiActionsData>(
    AI_ACTIONS_QUERY,
  );
  const [reviewAiAction, { loading: isReviewing }] = useMutation(REVIEW_AI_ACTION);
  const { enqueueErrorSnackBar, enqueueSuccessSnackBar, enqueueWarningSnackBar } =
    useSnackBar();
  const [executionPreviews, setExecutionPreviews] = useState<
    Record<string, ExecutionPreview>
  >({});
  const [busyActionId, setBusyActionId] = useState<string | null>(null);

  const actions = data?.aiActions?.edges?.map(({ node }) => node) ?? [];
  const pending = actions.filter(({ status }) => status === 'PENDING_APPROVAL');
  const approved = actions.filter(({ status }) => status === 'APPROVED');
  const history = actions.filter(({ status }) =>
    ['EXECUTED', 'REJECTED', 'FAILED'].includes(status),
  );
  const reviewed = actions.filter(({ status }) =>
    ['APPROVED', 'REJECTED'].includes(status),
  );
  const approvalRate = reviewed.length
    ? Math.round((reviewed.filter(({ status }) => status === 'APPROVED').length / reviewed.length) * 100)
    : 0;

  const review = async (action: AiAction, decision: 'APPROVED' | 'REJECTED') => {
    setBusyActionId(action.id);
    try {
      await reviewAiAction({
        variables: {
          id: action.id,
          data: {
            status: decision,
            approvedAt: decision === 'APPROVED' ? new Date().toISOString() : null,
            approvalNotes: {
              markdown:
                decision === 'APPROVED'
                  ? 'Proposta aprovada manualmente no Centro de IA.'
                  : 'Proposta rejeitada manualmente no Centro de IA.',
              blocknote: null,
            },
          },
        },
      });
      await refetch();
      enqueueSuccessSnackBar({
        message: decision === 'APPROVED' ? 'Proposta aprovada.' : 'Proposta rejeitada.',
      });
    } catch {
      enqueueErrorSnackBar({ message: 'Não foi possível registrar a decisão.' });
    } finally {
      setBusyActionId(null);
    }
  };

  const previewExecution = async (actionId: string) => {
    setBusyActionId(actionId);
    try {
      const result = await postLogicFunction<ExecutionPreview>('/diex/ai-actions/execute', {
        actionId,
        previewOnly: true,
        confirmExecute: false,
      });
      setExecutionPreviews((current) => ({ ...current, [actionId]: result }));
      if (result.supported) {
        enqueueSuccessSnackBar({ message: 'Prévia gerada sem alterar o CRM.' });
      } else {
        enqueueWarningSnackBar({ message: result.blockedReason ?? result.message });
      }
    } catch {
      enqueueErrorSnackBar({ message: 'Não foi possível operar o executor interno.' });
    } finally {
      setBusyActionId(null);
    }
  };

  return (
    <CommandCenterPage
      title="Centro de IA"
      description="Governança humana para propostas de IA antes de qualquer execução no CRM."
    >
      <CommandCenterMetrics>
        <CommandCenterMetric label="Aguardando aprovação" value={pending.length} />
        <CommandCenterMetric label="Aprovadas" value={approved.length} />
        <CommandCenterMetric label="Histórico" value={history.length} />
        <CommandCenterMetric label="Taxa de aprovação" value={`${approvalRate}%`} />
      </CommandCenterMetrics>
      {loading ? <CommandCenterLoadingState /> : null}
      {error ? <CommandCenterEmptyState message="Não foi possível carregar o Centro de IA." /> : null}
      {!loading && !error ? (
        <CommandCenterGrid>
          <CommandCenterCard title="Fila de aprovação">
            {pending.length === 0 ? <CommandCenterEmptyState message="Não há propostas aguardando revisão humana." /> : (
              <CommandCenterList>
                {pending.map((action) => (
                  <CommandCenterRow
                    key={action.id}
                    title={action.name}
                    detail={`${action.actionType} · ${relatedName(action)} · confiança ${action.confidence ?? 0}%`}
                    action={<><Button title="Rejeitar" size="small" variant="tertiary" disabled={isReviewing || busyActionId === action.id} onClick={() => void review(action, 'REJECTED')} /><Button title="Aprovar" size="small" variant="secondary" disabled={isReviewing || busyActionId === action.id} onClick={() => void review(action, 'APPROVED')} /></>}
                  />
                ))}
              </CommandCenterList>
            )}
          </CommandCenterCard>
          <CommandCenterCard title="Executor aprovado">
            {approved.length === 0 ? <CommandCenterEmptyState message="Ações aprovadas aparecerão aqui para gerar uma prévia de execução." /> : (
              <CommandCenterList>
                {approved.map((action) => (
                  <CommandCenterRow
                    key={action.id}
                    title={action.name}
                    detail={executionPreviews[action.id]?.message ?? `${action.actionType} · ${relatedName(action)}`}
                    action={<Button title="Gerar prévia" size="small" variant="secondary" disabled={busyActionId === action.id} onClick={() => void previewExecution(action.id)} />}
                  />
                ))}
              </CommandCenterList>
            )}
          </CommandCenterCard>
          <CommandCenterCard title="Histórico de governança">
            {history.length === 0 ? <CommandCenterEmptyState message="Nenhuma decisão ou execução registrada ainda." /> : (
              <CommandCenterList>
                {history.slice(0, 8).map((action) => <CommandCenterRow key={action.id} title={action.name} detail={`${action.actionType} · ${relatedName(action)}`} action={<Tag color={statusColor(action.status)} text={action.status} />} />)}
              </CommandCenterList>
            )}
          </CommandCenterCard>
        </CommandCenterGrid>
      ) : null}
    </CommandCenterPage>
  );
};
