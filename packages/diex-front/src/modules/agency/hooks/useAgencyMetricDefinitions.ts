import { useMutation, useQuery } from '@apollo/client/react';

import { CREATE_AGENCY_METRIC_DEFINITION } from '@/agency/graphql/agencyMutations';
import { GET_AGENCY_METRIC_DEFINITIONS } from '@/agency/graphql/agencyQueries';
import { type AgencyMetricDefinition } from '@/agency/types/AgencyTypes';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import {
  type MetricUnitType,
  type TargetComparisonType,
} from '~/generated-metadata/graphql';

type MetricDefinitionsQueryResult = {
  diexMetricDefinitions: AgencyMetricDefinition[];
};

export type CreateMetricDefinitionInput = {
  name: string;
  code: string;
  unitType: MetricUnitType;
  targetComparison: TargetComparisonType;
  description: string;
  isVisibleToClient: boolean;
};

export const useAgencyMetricDefinitions = () => {
  const { enqueueErrorSnackBar, enqueueSuccessSnackBar } = useSnackBar();

  const { data, loading, refetch } = useQuery<MetricDefinitionsQueryResult>(
    GET_AGENCY_METRIC_DEFINITIONS,
  );

  const [createMetricDefinitionMutation, { loading: isCreating }] = useMutation(
    CREATE_AGENCY_METRIC_DEFINITION,
  );

  const createMetricDefinition = async (
    input: CreateMetricDefinitionInput,
  ): Promise<boolean> => {
    try {
      await createMetricDefinitionMutation({
        variables: { input: { ...input, code: input.code.toLowerCase() } },
      });

      await refetch();

      enqueueSuccessSnackBar({
        message: `Métrica "${input.name}" criada.`,
      });

      return true;
    } catch (error) {
      enqueueErrorSnackBar({
        message:
          error instanceof Error
            ? error.message
            : 'Não foi possível criar a métrica.',
      });

      return false;
    }
  };

  return {
    metricDefinitions: data?.diexMetricDefinitions ?? [],
    loading,
    isCreating,
    createMetricDefinition,
  };
};
