import { z } from 'zod';

import {
  generatedWorkspaceContextSchema,
  normalizeGeneratedWorkspaceContext,
} from 'src/engine/core-modules/onboarding/types/generated-workspace-context.schema';

// Mirrors how @ai-sdk/provider-utils converts a zod 4 schema before handing it
// to the provider (zod4Schema -> z.toJSONSchema with target draft-7, io input).
// Checking the converted document is the only way to catch a strict-mode
// violation here rather than as a 400 from the provider in production.
const toProviderJsonSchema = () =>
  z.toJSONSchema(generatedWorkspaceContextSchema, {
    target: 'draft-7',
    io: 'input',
  }) as {
    properties?: Record<string, unknown>;
    required?: string[];
  };

// OpenAI structured outputs run in strict mode: every key under properties must
// also appear in required. A zod .default() silently drops the key from
// required, which rejected the whole request with "Missing 'businessModels'".
describe('generatedWorkspaceContextSchema', () => {
  it('should require every property so the provider accepts it in strict mode', () => {
    const jsonSchema = toProviderJsonSchema();
    const propertyNames = Object.keys(jsonSchema.properties ?? {});
    const requiredNames = jsonSchema.required ?? [];

    expect(propertyNames.length).toBeGreaterThan(0);

    const missingFromRequired = propertyNames.filter(
      (name) => !requiredNames.includes(name),
    );

    expect(missingFromRequired).toEqual([]);
  });

  it('should express absence as null or an empty list rather than an optional key', () => {
    const modelOutputWithNoEvidence = {
      segment: null,
      businessModels: [],
      revenueModels: [],
      productsAndServices: [],
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
      obligationsAndRisks: [],
      priorityObjectives: [],
      operationalMaturity: 'NOT_INFORMED' as const,
      unitCount: null,
      teamCount: null,
      hypotheses: [],
      unconfirmedInformation: [],
      businessDescription: 'Consultoria para clínicas odontológicas.',
      idealCustomerProfile: 'Clínicas de 2 a 10 cadeiras.',
      toneOfVoice: 'Direto e cordial.',
      commercialRules: null,
      objectionPlaybook: null,
      competitiveLandscape: null,
      forbiddenClaims: null,
    };

    const result = generatedWorkspaceContextSchema.safeParse(
      modelOutputWithNoEvidence,
    );

    expect(result.success).toBe(true);
  });

  it('should drop blank strings when normalizing into the operation profile', () => {
    const profile = normalizeGeneratedWorkspaceContext(
      {
        segment: '  Odontologia  ',
        businessModels: ['  B2B  ', '   ', ''],
        revenueModels: [],
        productsAndServices: [],
        operationalCapabilities: [],
        customerJourneyStages: [],
        customerProblems: [],
        acquisitionChannels: [],
        salesProcess: '   ',
        salesCycle: null,
        teamAndRoles: [],
        deliveryProcess: null,
        customerServiceProcess: null,
        customerSuccessProcess: null,
        renewalProcess: null,
        relevantMetrics: [],
        requiredIntegrations: [],
        restrictions: [],
        responsibilityRules: [],
        slaTargets: [],
        approvalRules: [],
        obligationsAndRisks: [],
        priorityObjectives: [],
        callsToAction: [],
        operationalMaturity: 'INITIAL',
        unitCount: 0,
        teamCount: 3,
        hypotheses: [],
        unconfirmedInformation: [],
        businessDescription: 'Consultoria.',
        idealCustomerProfile: 'Clínicas.',
        toneOfVoice: 'Direto.',
        commercialRules: '  Desconto máximo de 10%.  ',
        objectionPlaybook: null,
        competitiveLandscape: null,
        forbiddenClaims: null,
      },
      'Descrição original',
    );

    expect(profile.segment).toBe('Odontologia');
    expect(profile.businessModels).toEqual(['B2B']);
    expect(profile.salesProcess).toBeNull();
    expect(profile.unitCount).toBeNull();
    expect(profile.teamCount).toBe(3);
    expect(profile.commercialRules).toEqual(['Desconto máximo de 10%.']);
    expect(profile.originalResponse).toBe('Descrição original');
  });
});
