export enum DiexAccessRequestStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  NEGOTIATING = 'NEGOTIATING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface DiexAccessRequestRecord {
  id: string;
  name: string | null;
  status: DiexAccessRequestStatus | null;
  contactName: string | null;
  email: string | null;
  whatsapp: string | null;
  teamSize: string | null;
  desiredSubdomain: string | null;
  goal: string | null;
  submissionCount: number | null;
  requestedAt: string | null;
  reviewedAt: string | null;
  provisionedSubdomain: string | null;
}

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
