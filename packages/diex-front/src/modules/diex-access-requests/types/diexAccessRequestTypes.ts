export enum DiexAccessRequestStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  NEGOTIATING = 'NEGOTIATING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export type DiexAccessRequestRecord = {
  id: string;
  name: string | null;
  status: DiexAccessRequestStatus | null;
  contactName: string | null;
  email: string | null;
  whatsapp: string | null;
  teamSize: string | null;
  desiredSubdomain: string | null;
  goal: string | null;
  requestedAt: string | null;
  reviewedAt: string | null;
  submissionCount: number | null;
  provisionedSubdomain: string | null;
};

export type DiexAccessRequestApprovalOutcome = {
  workspaceUrl: string;
  subdomain: string;
  invitationMessage: string;
};
