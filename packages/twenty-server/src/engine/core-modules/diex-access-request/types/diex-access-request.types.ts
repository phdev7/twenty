export enum DiexAccessRequestStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  NEGOTIATING = 'NEGOTIATING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export type DiexAccessRequestRecord = Record<string, unknown> & {
  id: string;
  name: string | null;
  status: DiexAccessRequestStatus | null;
  email: string | null;
  submissionCount: number | null;
  provisionedSubdomain: string | null;
};

export type DiexPublicAccessRequestInput = {
  companyName?: unknown;
  contactName?: unknown;
  email?: unknown;
  whatsapp?: unknown;
  teamSize?: unknown;
  desiredSubdomain?: unknown;
  goal?: unknown;
  website?: unknown;
};

export type DiexPublicAccessRequestResult = {
  accepted: boolean;
  message: string;
};
