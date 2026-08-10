import {
  type DiexAgency,
  type DiexAgencyMetricDefinition,
  type DiexAgencyMetricEntry,
  type DiexMetaAdsAccount,
  type DiexTrafficSummaryMetrics,
  type WorkspaceUrls,
} from '~/generated-metadata/graphql';

export type AgencySummary = Pick<
  DiexAgency,
  'id' | 'name' | 'slug' | 'status' | 'workspaceSlotsLimit'
>;

export type AgencyClientWorkspace = {
  id: string;
  displayName?: string | null;
  subdomain: string;
  activationStatus: string;
  createdAt: string;
  workspaceUrls: WorkspaceUrls;
};

export type AgencyMetricDefinition = Pick<
  DiexAgencyMetricDefinition,
  | 'id'
  | 'name'
  | 'code'
  | 'unitType'
  | 'currencyCode'
  | 'targetComparison'
  | 'description'
  | 'isVisibleToClient'
>;

export type AgencyMetricEntry = Pick<
  DiexAgencyMetricEntry,
  | 'id'
  | 'metricDefinitionId'
  | 'clientWorkspaceId'
  | 'periodStart'
  | 'periodEnd'
  | 'value'
  | 'source'
  | 'notes'
> & {
  metricDefinition?: Pick<
    DiexAgencyMetricDefinition,
    'id' | 'name' | 'code' | 'unitType' | 'currencyCode'
  > | null;
};

export type AgencyMetaAdsAccount = Pick<
  DiexMetaAdsAccount,
  | 'id'
  | 'adAccountId'
  | 'accountName'
  | 'status'
  | 'clientWorkspaceId'
  | 'lastSyncedAt'
> & {
  // Added by the OAuth work; the generated schema types are regenerated against
  // a running server, so the field is declared here until that runs.
  tokenExpiresAt?: string | null;
};

export type AgencyTrafficSummary = DiexTrafficSummaryMetrics & {
  hasData: boolean;
};
