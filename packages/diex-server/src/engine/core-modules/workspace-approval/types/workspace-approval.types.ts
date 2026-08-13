export type PendingWorkspaceApproval = {
  workspaceId: string;
  displayName: string | null;
  subdomain: string;
  createdAt: Date;
  requesterEmail: string | null;
  requesterName: string | null;
  memberCount: number;
  whatsapp: string | null;
  primaryChannel: string | null;
  companyDescription: string | null;
  idealCustomerProfile: string | null;
  toneOfVoice: string | null;
  primaryGoal: string | null;
  companySize: string | null;
  currentProcess: string | null;
};

export type WorkspaceApprovalResult = {
  workspaceId: string;
  subdomain: string;
  displayName: string | null;
  activationStatus: string;
};
