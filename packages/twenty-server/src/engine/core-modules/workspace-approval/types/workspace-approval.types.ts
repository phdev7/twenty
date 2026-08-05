export type PendingWorkspaceApproval = {
  workspaceId: string;
  displayName: string | null;
  subdomain: string;
  createdAt: Date;
  requesterEmail: string | null;
  requesterName: string | null;
  memberCount: number;
};

export type WorkspaceApprovalResult = {
  workspaceId: string;
  subdomain: string;
  displayName: string | null;
  activationStatus: string;
};
