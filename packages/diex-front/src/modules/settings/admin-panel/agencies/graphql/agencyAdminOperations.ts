import { gql } from '@apollo/client';

export const GET_DIEX_AGENCIES_DATA = gql`
  query GetDiexAgenciesData {
    diexAgencyMetrics {
      totalAgencies
      activeAgencies
      totalSlotsAllocated
      totalSlotsUsed
      totalManagedWorkspaces
    }
    diexAgencies {
      id
      name
      slug
      ownerUserId
      workspaceSlotsLimit
      status
      createdAt
    }
  }
`;

export const CREATE_DIEX_AGENCY = gql`
  mutation CreateDiexAgency($input: CreateAgencyInput!) {
    createDiexAgency(input: $input) {
      id
      name
      slug
    }
  }
`;

export const UPDATE_DIEX_AGENCY_SLOTS = gql`
  mutation UpdateDiexAgencySlots($input: UpdateAgencySlotsInput!) {
    updateDiexAgencySlots(input: $input) {
      id
      workspaceSlotsLimit
    }
  }
`;

export const UPDATE_DIEX_AGENCY_STATUS = gql`
  mutation UpdateDiexAgencyStatus($input: UpdateAgencyStatusInput!) {
    updateDiexAgencyStatus(input: $input) {
      id
      status
    }
  }
`;
