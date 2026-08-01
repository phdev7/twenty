import { useCallback, useState } from 'react';

import {
  DiexAccessRequestProvisioningError,
  provisionDiexAccessRequestWorkspace,
} from '@/diex-access-requests/services/provisionDiexAccessRequestWorkspace';
import {
  type DiexAccessRequestApprovalOutcome,
  type DiexAccessRequestRecord,
  DiexAccessRequestStatus,
} from '@/diex-access-requests/types/diexAccessRequestTypes';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';

const accessRequestGqlFields = {
  id: true,
  name: true,
  status: true,
  contactName: true,
  email: true,
  whatsapp: true,
  teamSize: true,
  desiredSubdomain: true,
  goal: true,
  requestedAt: true,
  reviewedAt: true,
  submissionCount: true,
  provisionedSubdomain: true,
};

export const useDiexAccessRequests = () => {
  const {
    enqueueErrorSnackBar,
    enqueueSuccessSnackBar,
    enqueueWarningSnackBar,
  } = useSnackBar();
  const { updateOneRecord } = useUpdateOneRecord();
  const {
    records: requests,
    loading: isLoading,
    error,
    refetch,
  } = useFindManyRecords<DiexAccessRequestRecord & { __typename: string }>({
    objectNameSingular: 'diexAccessRequest',
    orderBy: [{ requestedAt: 'DescNullsLast' }],
    limit: 100,
    recordGqlFields: accessRequestGqlFields,
    fetchPolicy: 'cache-and-network',
  });
  const [busyRequestId, setBusyRequestId] = useState<string | null>(null);
  const [outcomes, setOutcomes] = useState<
    Record<string, DiexAccessRequestApprovalOutcome>
  >({});

  const load = useCallback(async (): Promise<void> => {
    await refetch();
  }, [refetch]);

  const updateRequest = useCallback(
    async (
      id: string,
      updateOneRecordInput: Partial<DiexAccessRequestRecord>,
    ): Promise<void> => {
      await updateOneRecord({
        objectNameSingular: 'diexAccessRequest',
        idToUpdate: id,
        updateOneRecordInput,
      });
    },
    [updateOneRecord],
  );

  const setStatus = useCallback(
    async (id: string, status: DiexAccessRequestStatus): Promise<void> => {
      setBusyRequestId(id);

      try {
        await updateRequest(id, {
          status,
          ...(status === DiexAccessRequestStatus.REJECTED
            ? { reviewedAt: new Date().toISOString() }
            : {}),
        });
        await load();
      } catch {
        enqueueErrorSnackBar({
          message: 'Não foi possível atualizar a solicitação.',
        });
      } finally {
        setBusyRequestId(null);
      }
    },
    [enqueueErrorSnackBar, load, updateRequest],
  );

  const approve = useCallback(
    async (
      request: DiexAccessRequestRecord,
      subdomain: string,
    ): Promise<void> => {
      if (
        request.provisionedSubdomain &&
        request.status === DiexAccessRequestStatus.APPROVED
      ) {
        enqueueWarningSnackBar({
          message: `Esta solicitação já recebeu o endereço ${request.provisionedSubdomain}.`,
        });
        return;
      }

      const normalizedSubdomain = subdomain.trim().toLowerCase();

      if (normalizedSubdomain.length < 3) {
        enqueueErrorSnackBar({
          message: 'Informe um endereço com pelo menos 3 caracteres.',
        });
        return;
      }

      setBusyRequestId(request.id);

      try {
        const provisioned = await provisionDiexAccessRequestWorkspace({
          request,
          subdomain: normalizedSubdomain,
        });

        setOutcomes((current) => ({
          ...current,
          [request.id]: {
            workspaceUrl: provisioned.workspaceUrl,
            subdomain: provisioned.subdomain,
            wasInvitationSent: provisioned.wasInvitationSent,
            invitationMessage: provisioned.invitationMessage,
          },
        }));

        await load();

        if (provisioned.wasInvitationSent) {
          enqueueSuccessSnackBar({
            message: `Workspace ${provisioned.subdomain} criado e convite enviado.`,
          });
        } else {
          enqueueWarningSnackBar({
            message: `Workspace ${provisioned.subdomain} criado. Falta confirmar o convite do cliente.`,
          });
        }
      } catch (approvalError) {
        enqueueErrorSnackBar({
          message:
            approvalError instanceof DiexAccessRequestProvisioningError
              ? approvalError.message
              : 'Falha ao aprovar. Confira em Workspaces se algum foi criado antes de tentar de novo.',
        });
      } finally {
        setBusyRequestId(null);
      }
    },
    [
      enqueueErrorSnackBar,
      enqueueSuccessSnackBar,
      enqueueWarningSnackBar,
      load,
    ],
  );

  return {
    requests,
    isLoading,
    busyRequestId,
    errorMessage: error ? 'Não foi possível carregar as solicitações.' : null,
    outcomes,
    load,
    setStatus,
    approve,
  };
};
