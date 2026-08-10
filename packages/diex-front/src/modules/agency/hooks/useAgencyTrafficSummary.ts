import { useQuery } from '@apollo/client/react';

import { GET_AGENCY_TRAFFIC_SUMMARY } from '@/agency/graphql/agencyQueries';
import { type AgencyTrafficSummary } from '@/agency/types/AgencyTypes';

type TrafficSummaryQueryResult = {
  diexTrafficSummary: AgencyTrafficSummary;
};

export const useAgencyTrafficSummary = () => {
  const { data, loading, refetch } = useQuery<TrafficSummaryQueryResult>(
    GET_AGENCY_TRAFFIC_SUMMARY,
  );

  return {
    summary: data?.diexTrafficSummary ?? null,
    loading,
    refetch,
  };
};
