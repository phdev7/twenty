export type CommercialRecordName = {
  firstName?: string | null;
  lastName?: string | null;
};

export type CommercialRecordReference = {
  id: string;
  name?: string | CommercialRecordName | null;
};

export type RichTextValue = {
  markdown?: string | null;
};

export type CommercialSignal = {
  id: string;
  name: string;
  signalType: string;
  source: string;
  status: string;
  strength?: string | null;
  confidence?: number | null;
  capturedAt?: string | null;
  validUntil?: string | null;
  recommendedAction?: RichTextValue | null;
  opportunity?: CommercialRecordReference | null;
  company?: CommercialRecordReference | null;
  person?: CommercialRecordReference | null;
};

export type CommercialOpportunity = CommercialRecordReference & {
  stage?: string | null;
  amount?: {
    amountMicros?: number | null;
    currencyCode?: string | null;
  } | null;
  commercialScore?: number | null;
  dealRisk?: string | null;
  nextCommercialAction?: string | null;
  nextCommercialActionAt?: string | null;
  company?: CommercialRecordReference | null;
};
