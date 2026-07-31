export type AccessRequestRecord = {
  id: string;
  name: string | null;
  status: string | null;
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

export type ApprovalOutcome = {
  workspaceUrl: string;
  subdomain: string;
  // The workspace is created first and the invitation second. When the second
  // step fails the first is already real, so the caller has to be told which
  // half landed instead of seeing a single "failed".
  wasInvitationSent: boolean;
  invitationMessage: string;
};
