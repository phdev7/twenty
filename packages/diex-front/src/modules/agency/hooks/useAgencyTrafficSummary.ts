import { useQuery } from '@apollo/client/react';

import { GET_AGENCY_TRAFFIC_SUMMARY } from '@/agency/graphql/agencyQueries';
import { type AgencyTrafficSummary } from '@/agency/types/AgencyTypes';

type TrafficSummaryQueryResult = {
  diexTrafficSummary: AgencyTrafficSummary;
};

export const useAgencyTrafficSummary = () => {
  const { data, loading, error, refetch } = useQuery<TrafficSummaryQueryResult>(
    GET_AGENCY_TRAFFIC_SUMMARY,
  );

  return {
    summary: data?.diexTrafficSummary ?? null,
    loading,
    // A failed read is not an agency without traffic, and the dashboard has to
    // be able to tell the two apart before it claims either.
    errorMessage: error?.message ?? null,
    refetch,
  };
};
