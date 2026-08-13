import { z } from 'zod';

import { type WorkspaceOperationProfile } from 'src/modules/workspace-architecture/types/workspace-operation-profile.schema';

// OpenAI structured outputs run in strict mode: every key under `properties`
// must also appear in `required`, and string length constraints are not part of
// the accepted subset. Zod's `.default([])` marks a key optional, so reusing the
// domain profile schema here got the request rejected before the model ran
// ("'required' ... Missing 'businessModels'"). This schema therefore declares
// every field required, spells absence as null or [], and leaves trimming and
// defaults to normalizeGeneratedWorkspaceContext.
const generatedText = z.string().nullable();
const generatedTextList = z.array(z.string());

export const generatedWorkspaceContextSchema = z.object({
  segment: generatedText,
  businessModels: generatedTextList,
  revenueModels: generatedTextList,
  productsAndServices: generatedTextList,
  operationalCapabilities: generatedTextList,
  customerJourneyStages: generatedTextList,
  customerProblems: generatedTextList,
  acquisitionChannels: generatedTextList,
  salesProcess: generatedText,
  salesCycle: generatedText,
  teamAndRoles: generatedTextList,
  deliveryProcess: generatedText,
  customerServiceProcess: generatedText,
  customerSuccessProcess: generatedText,
  renewalProcess: generatedText,
  relevantMetrics: generatedTextList,
  requiredIntegrations: generatedTextList,
  restrictions: generatedTextList,
  responsibilityRules: generatedTextList,
  slaTargets: generatedTextList,
  approvalRules: generatedTextList,
  obligationsAndRisks: generatedTextList,
  priorityObjectives: generatedTextList,
  operationalMaturity: z.enum([
    'INITIAL',
    'STRUCTURING',
    'DEFINED',
    'SCALED',
    'NOT_INFORMED',
  ]),
  unitCount: z.number().nullable(),
  teamCount: z.number().nullable(),
  hypotheses: generatedTextList,
  unconfirmedInformation: generatedTextList,
  businessDescription: generatedText,
  idealCustomerProfile: generatedText,
  toneOfVoice: generatedText,
  commercialRules: generatedText,
  objectionPlaybook: generatedText,
  competitiveLandscape: generatedText,
  callsToAction: generatedTextList,
  forbiddenClaims: generatedText,
});

export type GeneratedWorkspaceContext = z.infer<
  typeof generatedWorkspaceContextSchema
>;

const cleanText = (value: string | null): string | null => {
  const trimmed = value?.trim() ?? '';

  return trimmed.length > 0 ? trimmed : null;
};

const cleanList = (values: string[]): string[] =>
  values.map((value) => value.trim()).filter((value) => value.length > 0);

// A count only means something when it is a positive whole number; the domain
// profile rejects anything else, so a stray 0 or 2.5 becomes "not informed".
const cleanCount = (value: number | null): number | null =>
  value !== null && Number.isInteger(value) && value > 0 ? value : null;

export const normalizeGeneratedWorkspaceContext = (
  generated: GeneratedWorkspaceContext,
  originalResponse: string,
): WorkspaceOperationProfile => ({
  segment: cleanText(generated.segment),
  businessModels: cleanList(generated.businessModels),
  revenueModels: cleanList(generated.revenueModels),
  productsAndServices: cleanList(generated.productsAndServices),
  operationalCapabilities: cleanList(generated.operationalCapabilities),
  customerJourneyStages: cleanList(generated.customerJourneyStages),
  idealCustomerProfile: cleanText(generated.idealCustomerProfile),
  customerProblems: cleanList(generated.customerProblems),
  acquisitionChannels: cleanList(generated.acquisitionChannels),
  salesProcess: cleanText(generated.salesProcess),
  salesCycle: cleanText(generated.salesCycle),
  teamAndRoles: cleanList(generated.teamAndRoles),
  deliveryProcess: cleanText(generated.deliveryProcess),
  customerServiceProcess: cleanText(generated.customerServiceProcess),
  customerSuccessProcess: cleanText(generated.customerSuccessProcess),
  renewalProcess: cleanText(generated.renewalProcess),
  relevantMetrics: cleanList(generated.relevantMetrics),
  requiredIntegrations: cleanList(generated.requiredIntegrations),
  restrictions: cleanList(generated.restrictions),
  responsibilityRules: cleanList(generated.responsibilityRules),
  slaTargets: cleanList(generated.slaTargets),
  approvalRules: cleanList(generated.approvalRules),
  // The profile keeps commercial rules as a list while the context card renders
  // them as one markdown block, so a single generated rule becomes a one-item
  // list and an absent one drops out entirely.
  commercialRules:
    cleanText(generated.commercialRules) === null
      ? []
      : [cleanText(generated.commercialRules) as string],
  objectionsAndResponses:
    cleanText(generated.objectionPlaybook) === null
      ? []
      : [cleanText(generated.objectionPlaybook) as string],
  proofsAndDifferentiators:
    cleanText(generated.competitiveLandscape) === null
      ? []
      : [cleanText(generated.competitiveLandscape) as string],
  callsToAction: cleanList(generated.callsToAction),
  obligationsAndRisks: cleanList(generated.obligationsAndRisks),
  toneOfVoice: cleanText(generated.toneOfVoice),
  priorityObjectives: cleanList(generated.priorityObjectives),
  operationalMaturity: generated.operationalMaturity,
  unitCount: cleanCount(generated.unitCount),
  teamCount: cleanCount(generated.teamCount),
  hypotheses: cleanList(generated.hypotheses),
  unconfirmedInformation: cleanList(generated.unconfirmedInformation),
  originalResponse: cleanText(originalResponse),
});
