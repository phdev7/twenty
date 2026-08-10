import { useMutation, useQuery } from '@apollo/client/react';

import {
  CREATE_DIEX_AGENCY,
  GET_DIEX_AGENCIES_DATA,
  UPDATE_DIEX_AGENCY_SLOTS,
  UPDATE_DIEX_AGENCY_STATUS,
} from '@/settings/admin-panel/agencies/graphql/agencyAdminOperations';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import {
  type DiexAgency,
  type DiexAgencyMetrics,
  DiexAgencyStatus,
} from '~/generated-metadata/graphql';

export type AdminAgency = Pick<
  DiexAgency,
  'id' | 'name' | 'slug' | 'ownerUserId' | 'workspaceSlotsLimit' | 'status'
>;

type AdminAgenciesQueryResult = {
  diexAgencies: AdminAgency[];
  diexAgencyMetrics: DiexAgencyMetrics;
};

export type CreateAgencyInput = {
  name: string;
  slug: string;
  ownerUserEmail: string;
  workspaceSlotsLimit: number;
};

export const useAdminAgencies = () => {
  const { enqueueErrorSnackBar, enqueueSuccessSnackBar } = useSnackBar();

  const { data, loading, refetch } = useQuery<AdminAgenciesQueryResult>(
    GET_DIEX_AGENCIES_DATA,
  );

  const [createAgencyMutation] = useMutation(CREATE_DIEX_AGENCY);
  const [updateSlotsMutation] = useMutation(UPDATE_DIEX_AGENCY_SLOTS);
  const [updateStatusMutation] = useMutation(UPDATE_DIEX_AGENCY_STATUS);

  const reportError = (error: unknown, fallbackMessage: string) => {
    enqueueErrorSnackBar({
      message: error instanceof Error ? error.message : fallbackMessage,
    });
  };

  const createAgency = async (input: CreateAgencyInput): Promise<boolean> => {
    try {
      await createAgencyMutation({ variables: { input } });
      await refetch();
      enqueueSuccessSnackBar({ message: `Agência ${input.name} cadastrada.` });

      return true;
    } catch (error) {
      reportError(error, 'Não foi possível cadastrar a agência.');

      return false;
    }
  };

  const updateSlots = async (agencyId: string, workspaceSlotsLimit: number) => {
    try {
      await updateSlotsMutation({
        variables: { input: { agencyId, workspaceSlotsLimit } },
      });
      await refetch();
      enqueueSuccessSnackBar({ message: 'Limite de slots atualizado.' });

      return true;
    } catch (error) {
      reportError(error, 'Não foi possível atualizar os slots.');

      return false;
    }
  };

  // Suspending cascades: every workspace the agency manages stops answering
  // requests while the status is SUSPENDED.
  const updateStatus = async (agencyId: string, status: DiexAgencyStatus) => {
    try {
      await updateStatusMutation({
        variables: { input: { agencyId, status } },
      });
      await refetch();
      enqueueSuccessSnackBar({
        message:
          status === DiexAgencyStatus.SUSPENDED
            ? 'Agência suspensa. Os workspaces dos clientes ficaram bloqueados.'
            : 'Agência reativada.',
      });

      return true;
    } catch (error) {
      reportError(error, 'Não foi possível alterar o status da agência.');

      return false;
    }
  };

  return {
    agencies: data?.diexAgencies ?? [],
    metrics: data?.diexAgencyMetrics ?? null,
    loading,
    createAgency,
    updateSlots,
    updateStatus,
  };
};
