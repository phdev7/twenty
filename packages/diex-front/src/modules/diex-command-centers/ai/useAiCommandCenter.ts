import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { useCallback, useState } from 'react';

import { currentUserState } from '@/auth/states/currentUserState';
import {
  type AiAction,
  type AiActionExecutionResult,
} from '@/diex-command-centers/ai/types';
import { DIEX_CONTROLLER_ROUTES } from '@/diex-command-centers/constants/DiexControllerRoutes';
import { postLogicFunction } from '@/diex-command-centers/utils/useLogicFunctionRequest';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

const AI_QUERY = gql`
  query DiexAiCommandCenter($userId: UUID!) {
    aiActions(first: 100, orderBy: [{ requestedAt: DescNullsLast }]) {
      edges {
        node {
          id
          name
          actionType
          status
          confidence
          requiresApproval
          requestedAt
          approvedAt
          executedAt
          rationale {
            markdown
          }
          proposedAction {
            markdown
          }
          approvalNotes {
            markdown
          }
          executionReceipt {
            markdown
          }
          contextVersion
          executionStartedAt
          failureReason {
            markdown
          }
          attemptCount
          opportunity {
            id
            name
            stage
          }
          commercialSignal {
            id
            name
          }
          successPlan {
            id
            name
          }
          customerRenewal {
            id
            name
          }
          inboxConversation {
            id
            name
          }
          reviewer {
            id
            name {
              firstName
              lastName
            }
          }
          executor {
            id
            name {
              firstName
              lastName
            }
          }
          executionTask {
            id
            title
            dueAt
            status
          }
        }
      }
    }
    workspaceMembers(first: 1, filter: { userId: { eq: $userId } }) {
      edges {
        node {
          id
          userId
          name {
            firstName
            lastName
          }
        }
      }
    }
  }
`;
type QueryData = {
  aiActions?: { edges?: Array<{ node: AiAction }> };
  workspaceMembers?: {
    edges?: Array<{
      node: {
        id: string;
        userId?: string | null;
        name?: { firstName?: string | null; lastName?: string | null } | null;
      };
    }>;
  };
};

export const useAiCommandCenter = () => {
  const currentUser = useAtomStateValue(currentUserState);
  const {
    enqueueErrorSnackBar,
    enqueueSuccessSnackBar,
    enqueueWarningSnackBar,
  } = useSnackBar();
  const { data, loading, error, refetch } = useQuery<QueryData>(AI_QUERY, {
    variables: { userId: currentUser?.id ?? '' },
    skip: !currentUser?.id,
  });
  const [busyActionId, setBusyActionId] = useState<string | null>(null);
  const [busyExecution, setBusyExecution] = useState<{
    actionId: string;
    mode: 'PREVIEW' | 'APPLY';
  } | null>(null);
  const [executionPreviews, setExecutionPreviews] = useState<
    Record<string, AiActionExecutionResult>
  >({});
  const actions = data?.aiActions?.edges?.map(({ node }) => node) ?? [];
  const currentReviewer = data?.workspaceMembers?.edges?.[0]?.node ?? null;
  const reviewAction = useCallback(
    async (
      id: string,
      decision: 'APPROVED' | 'REJECTED',
      note: string,
    ): Promise<boolean> => {
      const action = actions.find((item) => item.id === id);
      if (!action || action.status !== 'PENDING_APPROVAL') {
        enqueueWarningSnackBar({
          message: 'Esta ação não está mais aguardando aprovação.',
        });
        return false;
      }
      if (!currentReviewer) {
        enqueueErrorSnackBar({
          message:
            'Não foi possível identificar o membro responsável pela decisão.',
        });
        return false;
      }
      setBusyActionId(id);
      try {
        const normalizedNote =
          note.trim() ||
          (decision === 'APPROVED'
            ? 'Proposta aprovada manualmente no Centro de IA.'
            : 'Proposta rejeitada manualmente no Centro de IA.');
        await postLogicFunction(DIEX_CONTROLLER_ROUTES.aiReviewAction, {
          actionId: id,
          decision,
          note: normalizedNote,
        });
        await refetch();
        enqueueSuccessSnackBar({
          message:
            decision === 'APPROVED'
              ? 'Proposta aprovada. Nenhum efeito externo foi executado.'
              : 'Proposta rejeitada e registrada na trilha de governança.',
        });
        return true;
      } catch {
        enqueueErrorSnackBar({
          message: 'Não foi possível registrar a decisão.',
        });
        return false;
      } finally {
        setBusyActionId(null);
      }
    },
    [
      actions,
      currentReviewer,
      enqueueErrorSnackBar,
      enqueueSuccessSnackBar,
      enqueueWarningSnackBar,
      refetch,
    ],
  );
  const executeAction = useCallback(
    async (
      id: string,
      mode: 'PREVIEW' | 'APPLY',
      options?: { confirmationToken?: string; targetStage?: string },
    ): Promise<boolean> => {
      const action = actions.find((item) => item.id === id);
      const isReconciliation =
        action?.status === 'EXECUTING' && mode === 'PREVIEW';

      if (
        !action ||
        (action.status !== 'APPROVED' && !isReconciliation)
      ) {
        enqueueWarningSnackBar({
          message:
            'Somente propostas aprovadas ou execuções em reconciliação podem entrar no executor.',
        });
        return false;
      }
      setBusyExecution({ actionId: id, mode });
      try {
        const result = await postLogicFunction<AiActionExecutionResult>(
          DIEX_CONTROLLER_ROUTES.aiExecuteAction,
          {
            actionId: id,
            previewOnly: mode === 'PREVIEW',
            confirmExecute: mode === 'APPLY',
            ...(mode === 'APPLY'
              ? { confirmationToken: options?.confirmationToken }
              : {}),
            ...(options?.targetStage
              ? { targetStage: options.targetStage }
              : {}),
          },
        );
        if (isReconciliation) {
          await refetch();

          if (
            result.mode === 'APPLY' &&
            result.actionId === id &&
            result.executed
          ) {
            setExecutionPreviews((current) => {
              const next = { ...current };
              delete next[id];
              return next;
            });
            enqueueSuccessSnackBar({ message: result.message });
            return true;
          }

          if (result.mode === 'PREVIEW' && result.actionId === id) {
            setExecutionPreviews((current) => ({ ...current, [id]: result }));
            enqueueWarningSnackBar({ message: result.message });
            return false;
          }

          throw new Error('invalid-reconciliation');
        }
        if (mode === 'PREVIEW') {
          if (result.mode !== 'PREVIEW' || result.actionId !== id)
            throw new Error('invalid-preview');
          setExecutionPreviews((current) => ({ ...current, [id]: result }));
          if (result.supported) {
            enqueueSuccessSnackBar({
              message: 'Prévia gerada sem alterar o CRM.',
            });
          } else {
            enqueueWarningSnackBar({ message: result.blockedReason });
          }
          return result.supported;
        }
        if (result.mode === 'PREVIEW' && result.actionId === id) {
          setExecutionPreviews((current) => ({ ...current, [id]: result }));
          await refetch();
          enqueueWarningSnackBar({ message: result.message });
          return false;
        }
        if (
          result.mode !== 'APPLY' ||
          result.actionId !== id ||
          !result.executed
        )
          throw new Error('invalid-apply');
        setExecutionPreviews((current) => {
          const next = { ...current };
          delete next[id];
          return next;
        });
        await refetch();
        enqueueSuccessSnackBar({ message: result.message });
        return true;
      } catch {
        enqueueErrorSnackBar({
          message: 'Não foi possível operar o executor governado da IA.',
        });
        return false;
      } finally {
        setBusyExecution(null);
      }
    },
    [
      actions,
      enqueueErrorSnackBar,
      enqueueSuccessSnackBar,
      enqueueWarningSnackBar,
      refetch,
    ],
  );
  return {
    actions,
    currentReviewer,
    isLoading: loading,
    errorMessage: error ? 'Não foi possível carregar o Centro de IA.' : null,
    busyActionId,
    busyExecution,
    executionPreviews,
    load: refetch,
    reviewAction,
    executeAction,
  };
};
