import { useQuery } from '@apollo/client/react';
import { isNonEmptyString } from '@sniptt/guards';

import { GET_AGENCY_CLIENT_METRIC_ENTRIES } from '@/agency/graphql/agencyQueries';
import { type AgencyMetricEntry } from '@/agency/types/AgencyTypes';

type ClientMetricEntriesQueryResult = {
  diexClientMetricEntries: AgencyMetricEntry[];
};

export const useAgencyClientReport = (clientWorkspaceId: string | null) => {
  const { data, loading } = useQuery<ClientMetricEntriesQueryResult>(
    GET_AGENCY_CLIENT_METRIC_ENTRIES,
    {
      variables: { clientWorkspaceId, onlyClientVisible: true },
      skip: !isNonEmptyString(clientWorkspaceId),
    },
  );

  return {
    entries: data?.diexClientMetricEntries ?? [],
    loading,
  };
};
