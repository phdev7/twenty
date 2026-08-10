import { gql } from '@apollo/client';

export const CREATE_AGENCY_WORKSPACE = gql`
  mutation CreateDiexAgencyWorkspace($input: CreateAgencyWorkspaceInput!) {
    createDiexAgencyWorkspace(input: $input) {
      id
      displayName
      subdomain
      activationStatus
    }
  }
`;

export const CREATE_AGENCY_METRIC_DEFINITION = gql`
  mutation CreateDiexMetricDefinition($input: CreateMetricDefinitionInput!) {
    createDiexMetricDefinition(input: $input) {
      id
      name
      code
    }
  }
`;

export const CREATE_AGENCY_METRIC_ENTRY = gql`
  mutation CreateDiexMetricEntry($input: CreateMetricEntryInput!) {
    createDiexMetricEntry(input: $input) {
      id
      value
      periodStart
      periodEnd
    }
  }
`;
