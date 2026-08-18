import { useMutation } from '@apollo/client/react';

import { CREATE_AGENCY_METRIC_ENTRY } from '@/agency/graphql/agencyMutations';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';

export type CreateAgencyMetricEntryInput = {
  metricDefinitionId: string;
  clientWorkspaceId: string;
  periodStart: string;
  periodEnd: string;
  value: number;
  notes: string;
};

export const useCreateAgencyMetricEntry = () => {
  const { enqueueErrorSnackBar, enqueueSuccessSnackBar } = useSnackBar();

  const [createMetricEntryMutation, { loading: isCreatingMetricEntry }] =
    useMutation(CREATE_AGENCY_METRIC_ENTRY);

  const createMetricEntry = async (
    input: CreateAgencyMetricEntryInput,
  ): Promise<boolean> => {
    try {
      await createMetricEntryMutation({
        variables: {
          input: {
            metricDefinitionId: input.metricDefinitionId,
            clientWorkspaceId: input.clientWorkspaceId,
            // The inputs carry a calendar day; the period is stored as an
            // instant, so the end of the range has to cover that whole day.
            periodStart: new Date(
              `${input.periodStart}T00:00:00`,
            ).toISOString(),
            periodEnd: new Date(`${input.periodEnd}T23:59:59`).toISOString(),
            value: input.value,
            source: 'MANUAL',
            ...(input.notes.trim().length > 0
              ? { notes: input.notes.trim() }
              : {}),
          },
        },
      });

      enqueueSuccessSnackBar({ message: 'Métrica lançada para o cliente.' });

      return true;
    } catch (error) {
      enqueueErrorSnackBar({
        message:
          error instanceof Error
            ? error.message
            : 'Não foi possível lançar a métrica.',
      });

      return false;
    }
  };

  return { createMetricEntry, isCreatingMetricEntry };
};
