export type DiexPublicAccessRequestInput = {
  companyName: string;
  contactName: string;
  email: string;
  whatsapp: string;
  teamSize: string;
  desiredSubdomain: string;
  goal: string;
  website: string;
};

export type DiexPublicAccessRequestResult = {
  accepted: boolean;
  message: string;
};

export type DiexPublicAccessRequestAvailability =
  | 'LOADING'
  | 'AVAILABLE'
  | 'NOT_FOUND'
  | 'ERROR';
