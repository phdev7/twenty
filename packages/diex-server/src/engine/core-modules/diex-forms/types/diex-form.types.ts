import { FormFieldType } from 'src/engine/core-modules/diex-forms/entities/diex-form-field.entity';
import {
  FormLayout,
  FormTargetObject,
} from 'src/engine/core-modules/diex-forms/entities/diex-form.entity';

export const DIEX_FORM_OPPORTUNITY_STAGES = [
  'NEW',
  'SCREENING',
  'MEETING',
  'DIAGNOSIS_COMPLETE',
  'PROPOSAL',
  'NEGOTIATION',
  'CUSTOMER',
  'LOST',
] as const;

export type DiexFormOption = {
  label: string;
  value: string;
};

export type DiexFormFieldInput = {
  label: string;
  name?: string;
  type: FormFieldType;
  targetFieldName?: string | null;
  placeholder?: string | null;
  helpText?: string | null;
  options?: DiexFormOption[];
  validation?: Record<string, unknown>;
  isRequired?: boolean;
  position?: number;
};

export type DiexFormFieldUpdateInput = Partial<DiexFormFieldInput>;

export type DiexFormUpdateInput = {
  title?: string;
  slug?: string;
  description?: string | null;
  targetObject?: FormTargetObject;
  layout?: FormLayout;
  submitButtonLabel?: string;
  successTitle?: string;
  successMessage?: string;
  showLogo?: boolean;
  logoUrl?: string | null;
  accentColor?: string;
  privacyPolicyUrl?: string | null;
  consentText?: string | null;
  consentRequired?: boolean;
  createOpportunity?: boolean;
  opportunityStage?: string;
  ownerId?: string | null;
  settings?: Record<string, unknown>;
};

export type DiexPublishedFormField = {
  label: string;
  name: string;
  type: FormFieldType;
  targetFieldName: string | null;
  placeholder: string | null;
  helpText: string | null;
  options: DiexFormOption[];
  validation: Record<string, unknown>;
  isRequired: boolean;
  position: number;
};

export type DiexPublishedFormSnapshot = {
  title: string;
  slug: string;
  description: string | null;
  targetObject: FormTargetObject;
  layout: FormLayout;
  submitButtonLabel: string;
  successTitle: string;
  successMessage: string;
  showLogo: boolean;
  logoUrl: string | null;
  accentColor: string;
  privacyPolicyUrl: string | null;
  consentText: string | null;
  consentRequired: boolean;
  createOpportunity: boolean;
  opportunityStage: string;
  ownerId: string | null;
  settings: Record<string, unknown>;
  fields: DiexPublishedFormField[];
};

export type DiexPublicSubmissionContext = {
  idempotencyKey?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  token?: string | null;
  strict?: boolean;
};
