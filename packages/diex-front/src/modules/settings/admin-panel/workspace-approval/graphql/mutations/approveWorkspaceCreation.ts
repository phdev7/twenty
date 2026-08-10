import { gql } from '@apollo/client';

export const APPROVE_WORKSPACE_CREATION = gql`
  mutation ApproveWorkspaceCreation($input: ApproveWorkspaceCreationInput!) {
    approveWorkspaceCreation(input: $input) {
      workspaceId
      subdomain
      displayName
      activationStatus
    }
  }
`;
