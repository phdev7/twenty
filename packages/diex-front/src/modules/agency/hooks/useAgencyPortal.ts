import { useMutation, useQuery } from '@apollo/client/react';

import { CREATE_AGENCY_WORKSPACE } from '@/agency/graphql/agencyMutations';
import { GET_AGENCY_PORTAL } from '@/agency/graphql/agencyQueries';
import {
  type AgencyClientWorkspace,
  type AgencySummary,
} from '@/agency/types/AgencyTypes';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';

type AgencyPortalQueryResult = {
  myDiexAgency: AgencySummary | null;
  diexAgencyManagedWorkspaces: AgencyClientWorkspace[];
};

export type CreateClientWorkspaceInput = {
  clientCompanyName: string;
  subdomain: string;
  clientAdminEmail: string;
  operationDescription: string;
};

export const useAgencyPortal = () => {
  const { enqueueErrorSnackBar, enqueueSuccessSnackBar } = useSnackBar();

  // A failing portal query used to render as "you have no agency", which reads
  // as a configuration answer rather than as the error it is.
  const { data, loading, error, refetch } =
    useQuery<AgencyPortalQueryResult>(GET_AGENCY_PORTAL);

  const [createAgencyWorkspace, { loading: isCreatingClientWorkspace }] =
    useMutation(CREATE_AGENCY_WORKSPACE);

  const agency = data?.myDiexAgency ?? null;
  const clientWorkspaces = data?.diexAgencyManagedWorkspaces ?? [];

  const usedSlots = clientWorkspaces.length;
  const slotsLimit = agency?.workspaceSlotsLimit ?? 0;

  const createClientWorkspace = async (
    input: CreateClientWorkspaceInput,
  ): Promise<boolean> => {
    try {
      await createAgencyWorkspace({
        variables: {
          input: {
            ...input,
            subdomain: input.subdomain.toLowerCase(),
          },
        },
      });

      await refetch();

      enqueueSuccessSnackBar({
        message: `Workspace de ${input.clientCompanyName} criado. O convite foi enviado para ${input.clientAdminEmail}.`,
      });

      return true;
    } catch (error) {
      enqueueErrorSnackBar({
        message:
          error instanceof Error
            ? error.message
            : 'Não foi possível criar o workspace do cliente.',
      });

      return false;
    }
  };

  return {
    agency,
    clientWorkspaces,
    usedSlots,
    slotsLimit,
    hasAvailableSlots: usedSlots < slotsLimit,
    loading,
    errorMessage: error?.message ?? null,
    isCreatingClientWorkspace,
    createClientWorkspace,
  };
};
