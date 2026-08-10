import { gql } from '@apollo/client';

import { WORKSPACE_URLS_FRAGMENT } from '@/users/graphql/fragments/workspaceUrlsFragment';

export const GET_AGENCY_PORTAL = gql`
  query GetDiexAgencyPortal {
    myDiexAgency {
      id
      name
      slug
      status
      workspaceSlotsLimit
    }
    diexAgencyManagedWorkspaces {
      id
      displayName
      subdomain
      activationStatus
      createdAt
      workspaceUrls {
        ...WorkspaceUrlsFragment
      }
    }
  }

  ${WORKSPACE_URLS_FRAGMENT}
`;

export const GET_AGENCY_TRAFFIC_SUMMARY = gql`
  query GetDiexTrafficSummary {
    diexTrafficSummary {
      hasData
      totalSpend
      spendChangePercentage
      totalLeads
      leadsChangePercentage
      averageCpl
      cplChangePercentage
      averageRoas
      roasChangePercentage
      activeMetaAdsAccounts
      anomaliesCount
      advancedMetrics {
        currentCac
        cacChangePercentage
        currentLtv
        ltvChangePercentage
      }
    }
  }
`;

export const GET_AGENCY_METRIC_DEFINITIONS = gql`
  query GetDiexMetricDefinitions {
    diexMetricDefinitions {
      id
      name
      code
      unitType
      currencyCode
      targetComparison
      description
      isVisibleToClient
    }
  }
`;

export const GET_AGENCY_META_ADS_ACCOUNTS = gql`
  query GetDiexMetaAdsAccounts {
    diexMetaAdsAccounts {
      id
      adAccountId
      accountName
      status
      clientWorkspaceId
      lastSyncedAt
      tokenExpiresAt
    }
  }
`;

export const GET_AGENCY_CLIENT_METRIC_ENTRIES = gql`
  query GetDiexClientMetricEntries(
    $clientWorkspaceId: String!
    $onlyClientVisible: Boolean
  ) {
    diexClientMetricEntries(
      clientWorkspaceId: $clientWorkspaceId
      onlyClientVisible: $onlyClientVisible
    ) {
      id
      metricDefinitionId
      clientWorkspaceId
      periodStart
      periodEnd
      value
      source
      notes
      metricDefinition {
        id
        name
        code
        unitType
        currencyCode
      }
    }
  }
`;
