import { z } from 'zod';

const optionalText = z.string().trim().min(1).nullable();
const textList = z.array(z.string().trim().min(1)).default([]);

export const workspaceOperationProfileSchema = z.object({
  segment: optionalText,
  businessModels: textList,
  revenueModels: textList,
  productsAndServices: textList,
  operationalCapabilities: textList,
  customerJourneyStages: textList,
  idealCustomerProfile: optionalText,
  customerProblems: textList,
  acquisitionChannels: textList,
  salesProcess: optionalText,
  salesCycle: optionalText,
  teamAndRoles: textList,
  deliveryProcess: optionalText,
  customerServiceProcess: optionalText,
  customerSuccessProcess: optionalText,
  renewalProcess: optionalText,
  relevantMetrics: textList,
  requiredIntegrations: textList,
  restrictions: textList,
  commercialRules: textList,
  responsibilityRules: textList,
  slaTargets: textList,
  approvalRules: textList,
  obligationsAndRisks: textList,
  toneOfVoice: optionalText,
  priorityObjectives: textList,
  operationalMaturity: z
    .enum(['INITIAL', 'STRUCTURING', 'DEFINED', 'SCALED', 'NOT_INFORMED'])
    .default('NOT_INFORMED'),
  unitCount: z.number().int().positive().nullable(),
  teamCount: z.number().int().positive().nullable(),
  hypotheses: textList,
  unconfirmedInformation: textList,
  originalResponse: optionalText,
});

export type WorkspaceOperationProfile = z.infer<
  typeof workspaceOperationProfileSchema
>;

export const EMPTY_WORKSPACE_OPERATION_PROFILE: WorkspaceOperationProfile = {
  segment: null,
  businessModels: [],
  revenueModels: [],
  productsAndServices: [],
  operationalCapabilities: [],
  customerJourneyStages: [],
  idealCustomerProfile: null,
  customerProblems: [],
  acquisitionChannels: [],
  salesProcess: null,
  salesCycle: null,
  teamAndRoles: [],
  deliveryProcess: null,
  customerServiceProcess: null,
  customerSuccessProcess: null,
  renewalProcess: null,
  relevantMetrics: [],
  requiredIntegrations: [],
  restrictions: [],
  commercialRules: [],
  responsibilityRules: [],
  slaTargets: [],
  approvalRules: [],
  obligationsAndRisks: [],
  toneOfVoice: null,
  priorityObjectives: [],
  operationalMaturity: 'NOT_INFORMED',
  unitCount: null,
  teamCount: null,
  hypotheses: [],
  unconfirmedInformation: [],
  originalResponse: null,
};
