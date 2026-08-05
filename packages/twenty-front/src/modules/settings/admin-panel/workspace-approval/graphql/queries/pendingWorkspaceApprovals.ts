import { gql } from '@apollo/client';

export const PENDING_WORKSPACE_APPROVALS = gql`
  query PendingWorkspaceApprovals {
    pendingWorkspaceApprovals {
      workspaceId
      displayName
      subdomain
      createdAt
      requesterEmail
      requesterName
      memberCount
    }
  }
`;
