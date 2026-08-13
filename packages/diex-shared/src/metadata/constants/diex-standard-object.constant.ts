import { buildDiexStandardObjectSystemFields } from '@/metadata/utils/internal/build-standard-object-system-fields.util';
import { DIEX_STANDARD_RELATION_FIELDS } from '@/metadata/constants/diex-standard-relation-fields.constant';
import { DIEX_STANDARD_EXTENSION_RELATION_FIELDS } from '@/metadata/constants/diex-standard-object-extension-relation-fields.constant';

export const DIEX_STANDARD_OBJECTS = {
  successPlan: {
    universalIdentifier: 'd1e03000-0000-4000-8000-000000000001',
    fields: {
      ...DIEX_STANDARD_EXTENSION_RELATION_FIELDS.successPlan,
      ...DIEX_STANDARD_RELATION_FIELDS.successPlan,
      ...buildDiexStandardObjectSystemFields(
        'd1e03000-0000-4000-8000-000000000001',
      ),
      name: { universalIdentifier: 'd1e03100-0000-4000-8000-000000000001' },
      lifecycle: {
        universalIdentifier: 'd1e03100-0000-4000-8000-000000000002',
      },
      health: { universalIdentifier: 'd1e03100-0000-4000-8000-000000000003' },
      healthScore: {
        universalIdentifier: 'd1e03100-0000-4000-8000-00000000000c',
      },
      activeUseRating: {
        universalIdentifier: 'd1e03100-0000-4000-8000-00000000000d',
      },
      valueEvidenceRating: {
        universalIdentifier: 'd1e03100-0000-4000-8000-00000000000e',
      },
      expansionSignal: {
        universalIdentifier: 'd1e03100-0000-4000-8000-00000000000f',
      },
      recurringRevenue: {
        universalIdentifier: 'd1e03100-0000-4000-8000-000000000004',
      },
      startDate: {
        universalIdentifier: 'd1e03100-0000-4000-8000-000000000005',
      },
      renewalDate: {
        universalIdentifier: 'd1e03100-0000-4000-8000-000000000006',
      },
      nextReviewAt: {
        universalIdentifier: 'd1e03100-0000-4000-8000-000000000007',
      },
      objectives: {
        universalIdentifier: 'd1e03100-0000-4000-8000-000000000008',
      },
      successCriteria: {
        universalIdentifier: 'd1e03100-0000-4000-8000-000000000009',
      },
      risks: { universalIdentifier: 'd1e03100-0000-4000-8000-00000000000a' },
      executiveSummary: {
        universalIdentifier: 'd1e03100-0000-4000-8000-00000000000b',
      },
      legacyDiexId: {
        universalIdentifier: 'd1e03100-0000-4000-8000-000000000010',
      },
    },
    indexes: {
      legacyDiexIdUniqueIndex: {
        universalIdentifier: '10fa8bca-ea90-5a0b-95cb-7fc2de1e8ed3',
      },
      searchVectorGinIndex: {
        universalIdentifier: 'be4a9232-bbe2-536b-a71a-99567f6af1e9',
      },
    },
  },
  successMilestone: {
    universalIdentifier: 'd1e04000-0000-4000-8000-000000000001',
    fields: {
      ...DIEX_STANDARD_RELATION_FIELDS.successMilestone,
      ...buildDiexStandardObjectSystemFields(
        'd1e04000-0000-4000-8000-000000000001',
      ),
      name: { universalIdentifier: 'd1e04100-0000-4000-8000-000000000001' },
      category: { universalIdentifier: 'd1e04100-0000-4000-8000-000000000002' },
      status: { universalIdentifier: 'd1e04100-0000-4000-8000-000000000003' },
      dueAt: { universalIdentifier: 'd1e04100-0000-4000-8000-000000000004' },
      completedAt: {
        universalIdentifier: 'd1e04100-0000-4000-8000-000000000005',
      },
      outcome: { universalIdentifier: 'd1e04100-0000-4000-8000-000000000006' },
      evidence: { universalIdentifier: 'd1e04100-0000-4000-8000-000000000007' },
      impact: { universalIdentifier: 'd1e04100-0000-4000-8000-000000000008' },
      legacyDiexId: {
        universalIdentifier: 'd1e04100-0000-4000-8000-000000000009',
      },
    },
    indexes: {
      legacyDiexIdUniqueIndex: {
        universalIdentifier: '92710c86-3fdd-5142-8c77-74bdaf13cffe',
      },
      searchVectorGinIndex: {
        universalIdentifier: 'a71298fe-e74c-58f2-bfd7-3693b88b7f72',
      },
    },
  },
  customerRenewal: {
    universalIdentifier: 'd1e14000-0000-4000-8000-000000000001',
    fields: {
      ...DIEX_STANDARD_EXTENSION_RELATION_FIELDS.customerRenewal,
      ...DIEX_STANDARD_RELATION_FIELDS.customerRenewal,
      ...buildDiexStandardObjectSystemFields(
        'd1e14000-0000-4000-8000-000000000001',
      ),
      name: { universalIdentifier: 'd1e14100-0000-4000-8000-000000000001' },
      stage: { universalIdentifier: 'd1e14100-0000-4000-8000-000000000002' },
      risk: { universalIdentifier: 'd1e14100-0000-4000-8000-000000000003' },
      forecast: { universalIdentifier: 'd1e14100-0000-4000-8000-000000000004' },
      renewalValue: {
        universalIdentifier: 'd1e14100-0000-4000-8000-000000000005',
      },
      probability: {
        universalIdentifier: 'd1e14100-0000-4000-8000-000000000006',
      },
      targetDate: {
        universalIdentifier: 'd1e14100-0000-4000-8000-000000000007',
      },
      nextAction: {
        universalIdentifier: 'd1e14100-0000-4000-8000-000000000008',
      },
      nextActionAt: {
        universalIdentifier: 'd1e14100-0000-4000-8000-000000000009',
      },
      lastTouchAt: {
        universalIdentifier: 'd1e14100-0000-4000-8000-00000000000a',
      },
      riskReason: {
        universalIdentifier: 'd1e14100-0000-4000-8000-00000000000b',
      },
      valueEvidence: {
        universalIdentifier: 'd1e14100-0000-4000-8000-00000000000c',
      },
      commercialTerms: {
        universalIdentifier: 'd1e14100-0000-4000-8000-00000000000d',
      },
      outcome: { universalIdentifier: 'd1e14100-0000-4000-8000-00000000000e' },
      closedAt: { universalIdentifier: 'd1e14100-0000-4000-8000-00000000000f' },
      legacyDiexId: {
        universalIdentifier: 'd1e14100-0000-4000-8000-000000000010',
      },
    },
    indexes: {
      legacyDiexIdUniqueIndex: {
        universalIdentifier: '3b5b6dec-1bf5-519e-b5e1-6b72492fc4b9',
      },
      searchVectorGinIndex: {
        universalIdentifier: '145331c0-28f7-5f7e-84ef-0099fb0f6b8a',
      },
    },
  },
  customerRenewalEvent: {
    universalIdentifier: 'd1e14200-0000-4000-8000-000000000001',
    fields: {
      ...DIEX_STANDARD_EXTENSION_RELATION_FIELDS.customerRenewalEvent,
      ...DIEX_STANDARD_RELATION_FIELDS.customerRenewalEvent,
      ...buildDiexStandardObjectSystemFields(
        'd1e14200-0000-4000-8000-000000000001',
      ),
      name: { universalIdentifier: 'd1e14300-0000-4000-8000-000000000001' },
      eventType: {
        universalIdentifier: 'd1e14300-0000-4000-8000-000000000002',
      },
      summary: { universalIdentifier: 'd1e14300-0000-4000-8000-000000000003' },
      occurredAt: {
        universalIdentifier: 'd1e14300-0000-4000-8000-000000000004',
      },
    },
    indexes: {
      searchVectorGinIndex: {
        universalIdentifier: '4fe31400-be4a-5a11-be85-9e83979d1f29',
      },
    },
  },
  commercialSignal: {
    universalIdentifier: 'd1e02000-0000-4000-8000-000000000001',
    fields: {
      ...DIEX_STANDARD_EXTENSION_RELATION_FIELDS.commercialSignal,
      ...DIEX_STANDARD_RELATION_FIELDS.commercialSignal,
      ...buildDiexStandardObjectSystemFields(
        'd1e02000-0000-4000-8000-000000000001',
      ),
      name: { universalIdentifier: 'd1e02100-0000-4000-8000-000000000001' },
      signalType: {
        universalIdentifier: 'd1e02100-0000-4000-8000-000000000002',
      },
      source: { universalIdentifier: 'd1e02100-0000-4000-8000-000000000003' },
      status: { universalIdentifier: 'd1e02100-0000-4000-8000-000000000004' },
      strength: { universalIdentifier: 'd1e02100-0000-4000-8000-000000000005' },
      evidence: { universalIdentifier: 'd1e02100-0000-4000-8000-000000000006' },
      recommendedAction: {
        universalIdentifier: 'd1e02100-0000-4000-8000-000000000007',
      },
      capturedAt: {
        universalIdentifier: 'd1e02100-0000-4000-8000-000000000008',
      },
      validUntil: {
        universalIdentifier: 'd1e02100-0000-4000-8000-000000000009',
      },
      confidence: {
        universalIdentifier: 'd1e02100-0000-4000-8000-00000000000a',
      },
      sourceReference: {
        universalIdentifier: 'd1e02100-0000-4000-8000-00000000000b',
      },
      legacyDiexId: {
        universalIdentifier: 'd1e02100-0000-4000-8000-00000000000c',
      },
    },
    indexes: {
      sourceReferenceUniqueIndex: {
        universalIdentifier: 'da4974ae-b504-558a-bb45-a50857312f42',
      },
      legacyDiexIdUniqueIndex: {
        universalIdentifier: 'd09f0f5b-40a5-567c-99de-bcb31662eed6',
      },
      searchVectorGinIndex: {
        universalIdentifier: 'b9415b25-3396-583c-91fe-2d27c5b6c704',
      },
    },
  },
  offer: {
    universalIdentifier: 'd1e01000-0000-4000-8000-000000000001',
    fields: {
      ...DIEX_STANDARD_EXTENSION_RELATION_FIELDS.offer,
      ...buildDiexStandardObjectSystemFields(
        'd1e01000-0000-4000-8000-000000000001',
      ),
      name: { universalIdentifier: 'd1e01100-0000-4000-8000-000000000001' },
      status: { universalIdentifier: 'd1e01100-0000-4000-8000-000000000002' },
      category: { universalIdentifier: 'd1e01100-0000-4000-8000-000000000003' },
      pricingModel: {
        universalIdentifier: 'd1e01100-0000-4000-8000-000000000004',
      },
      basePrice: {
        universalIdentifier: 'd1e01100-0000-4000-8000-000000000005',
      },
      valueProposition: {
        universalIdentifier: 'd1e01100-0000-4000-8000-000000000006',
      },
      idealCustomerProfile: {
        universalIdentifier: 'd1e01100-0000-4000-8000-000000000007',
      },
      differentiators: {
        universalIdentifier: 'd1e01100-0000-4000-8000-000000000008',
      },
      objectionPlaybook: {
        universalIdentifier: 'd1e01100-0000-4000-8000-000000000009',
      },
      qualificationCriteria: {
        universalIdentifier: 'd1e01100-0000-4000-8000-00000000000a',
      },
      legacyDiexId: {
        universalIdentifier: 'd1e01100-0000-4000-8000-00000000000b',
      },
    },
    indexes: {
      legacyDiexIdUniqueIndex: {
        universalIdentifier: '950b86fd-0fbb-5a47-84c9-1f1908916dea',
      },
      searchVectorGinIndex: {
        universalIdentifier: 'ada7e0e3-a5dd-5f5f-99f9-f0f25f8497e2',
      },
    },
  },
  aiAction: {
    universalIdentifier: 'd1e05000-0000-4000-8000-000000000001',
    fields: {
      ...DIEX_STANDARD_EXTENSION_RELATION_FIELDS.aiAction,
      ...DIEX_STANDARD_RELATION_FIELDS.aiAction,
      ...buildDiexStandardObjectSystemFields(
        'd1e05000-0000-4000-8000-000000000001',
      ),
      name: { universalIdentifier: 'd1e05100-0000-4000-8000-000000000001' },
      actionType: {
        universalIdentifier: 'd1e05100-0000-4000-8000-000000000002',
      },
      status: { universalIdentifier: 'd1e05100-0000-4000-8000-000000000003' },
      confidence: {
        universalIdentifier: 'd1e05100-0000-4000-8000-000000000004',
      },
      rationale: {
        universalIdentifier: 'd1e05100-0000-4000-8000-000000000005',
      },
      proposedAction: {
        universalIdentifier: 'd1e05100-0000-4000-8000-000000000006',
      },
      approvalNotes: {
        universalIdentifier: 'd1e05100-0000-4000-8000-000000000007',
      },
      requestedAt: {
        universalIdentifier: 'd1e05100-0000-4000-8000-000000000008',
      },
      approvedAt: {
        universalIdentifier: 'd1e05100-0000-4000-8000-000000000009',
      },
      executedAt: {
        universalIdentifier: 'd1e05100-0000-4000-8000-00000000000a',
      },
      executionReceipt: {
        universalIdentifier: 'd1e05100-0000-4000-8000-00000000000b',
      },
      requiresApproval: {
        universalIdentifier: 'd1e05100-0000-4000-8000-00000000000c',
      },
      idempotencyKey: {
        universalIdentifier: 'd1e05100-0000-4000-8000-00000000000d',
      },
      contextVersion: {
        universalIdentifier: 'd1e05100-0000-4000-8000-00000000000e',
      },
      executionStartedAt: {
        universalIdentifier: 'd1e05100-0000-4000-8000-00000000000f',
      },
      failureReason: {
        universalIdentifier: 'd1e05100-0000-4000-8000-000000000010',
      },
      attemptCount: {
        universalIdentifier: 'd1e05100-0000-4000-8000-000000000011',
      },
      riskLevel: {
        universalIdentifier: 'd1e05100-0000-4000-8000-000000000012',
      },
      writeSet: {
        universalIdentifier: 'd1e05100-0000-4000-8000-000000000013',
      },
      expiresAt: {
        universalIdentifier: 'd1e05100-0000-4000-8000-000000000014',
      },
      policyVersion: {
        universalIdentifier: 'd1e05100-0000-4000-8000-000000000015',
      },
      estimatedCostCredits: {
        universalIdentifier: 'd1e05100-0000-4000-8000-000000000016',
      },
    },
    indexes: {
      idempotencyKeyUniqueIndex: {
        universalIdentifier: '6f16603f-70e6-5c55-a406-4a1200b1e6d9',
      },
      searchVectorGinIndex: {
        universalIdentifier: 'fc602e66-bc04-575b-8e55-5749c34359b7',
      },
    },
  },
  diexWorkspaceContext: {
    universalIdentifier: 'd1e15000-0000-4000-8000-000000000001',
    fields: {
      ...buildDiexStandardObjectSystemFields(
        'd1e15000-0000-4000-8000-000000000001',
      ),
      name: { universalIdentifier: 'd1e15100-0000-4000-8000-000000000001' },
      status: { universalIdentifier: 'd1e15100-0000-4000-8000-000000000002' },
      businessDescription: {
        universalIdentifier: 'd1e15100-0000-4000-8000-000000000003',
      },
      idealCustomerProfile: {
        universalIdentifier: 'd1e15100-0000-4000-8000-000000000004',
      },
      toneOfVoice: {
        universalIdentifier: 'd1e15100-0000-4000-8000-000000000005',
      },
      commercialRules: {
        universalIdentifier: 'd1e15100-0000-4000-8000-000000000006',
      },
      objectionPlaybook: {
        universalIdentifier: 'd1e15100-0000-4000-8000-000000000007',
      },
      competitiveLandscape: {
        universalIdentifier: 'd1e15100-0000-4000-8000-000000000008',
      },
      forbiddenClaims: {
        universalIdentifier: 'd1e15100-0000-4000-8000-000000000009',
      },
      reviewedAt: {
        universalIdentifier: 'd1e15100-0000-4000-8000-00000000000a',
      },
    },
    indexes: {
      searchVectorGinIndex: {
        universalIdentifier: 'a8702513-e56d-5d7a-8b7a-b889f9ecc434',
      },
    },
  },
  workspaceArchitectureArtifact: {
    universalIdentifier: 'd1e18000-0000-4000-8000-000000000001',
    fields: {
      ...buildDiexStandardObjectSystemFields(
        'd1e18000-0000-4000-8000-000000000001',
      ),
      name: { universalIdentifier: 'd1e18100-0000-4000-8000-000000000001' },
      artifactKey: {
        universalIdentifier: 'd1e18100-0000-4000-8000-000000000002',
      },
      artifactType: {
        universalIdentifier: 'd1e18100-0000-4000-8000-000000000003',
      },
      status: {
        universalIdentifier: 'd1e18100-0000-4000-8000-000000000004',
      },
      schemaVersion: {
        universalIdentifier: 'd1e18100-0000-4000-8000-000000000005',
      },
      version: {
        universalIdentifier: 'd1e18100-0000-4000-8000-000000000006',
      },
      parentVersion: {
        universalIdentifier: 'd1e18100-0000-4000-8000-000000000007',
      },
      sourceDescription: {
        universalIdentifier: 'd1e18100-0000-4000-8000-000000000008',
      },
      payload: {
        universalIdentifier: 'd1e18100-0000-4000-8000-000000000009',
      },
      summary: {
        universalIdentifier: 'd1e18100-0000-4000-8000-00000000000a',
      },
      templateVersions: {
        universalIdentifier: 'd1e18100-0000-4000-8000-00000000000b',
      },
      idempotencyKey: {
        universalIdentifier: 'd1e18100-0000-4000-8000-00000000000c',
      },
      approvedAt: {
        universalIdentifier: 'd1e18100-0000-4000-8000-00000000000d',
      },
      appliedAt: {
        universalIdentifier: 'd1e18100-0000-4000-8000-00000000000e',
      },
      completedAt: {
        universalIdentifier: 'd1e18100-0000-4000-8000-00000000000f',
      },
      errorDetails: {
        universalIdentifier: 'd1e18100-0000-4000-8000-000000000010',
      },
      modelId: {
        universalIdentifier: 'd1e18100-0000-4000-8000-000000000011',
      },
      promptVersion: {
        universalIdentifier: 'd1e18100-0000-4000-8000-000000000012',
      },
      datasetVersion: {
        universalIdentifier: 'd1e18100-0000-4000-8000-000000000013',
      },
      estimatedCostCents: {
        universalIdentifier: 'd1e18100-0000-4000-8000-000000000014',
      },
      actualCostCents: {
        universalIdentifier: 'd1e18100-0000-4000-8000-000000000015',
      },
    },
    indexes: {
      artifactKeyUniqueIndex: {
        universalIdentifier: '4fdb9f68-c20c-5148-bbe5-c9fe48823fe5',
      },
      idempotencyKeyUniqueIndex: {
        universalIdentifier: '25aa9f9c-9a38-5718-84f6-6ef87d250873',
      },
      searchVectorGinIndex: {
        universalIdentifier: '69fa4c38-5078-5914-8627-f4c592efeb78',
      },
    },
  },
  diexAccessRequest: {
    universalIdentifier: 'd1e17000-0000-4000-8000-000000000001',
    fields: {
      ...buildDiexStandardObjectSystemFields(
        'd1e17000-0000-4000-8000-000000000001',
      ),
      name: { universalIdentifier: 'd1e17100-0000-4000-8000-000000000001' },
      status: { universalIdentifier: 'd1e17100-0000-4000-8000-000000000002' },
      contactName: {
        universalIdentifier: 'd1e17100-0000-4000-8000-000000000003',
      },
      email: { universalIdentifier: 'd1e17100-0000-4000-8000-000000000004' },
      whatsapp: { universalIdentifier: 'd1e17100-0000-4000-8000-000000000005' },
      teamSize: { universalIdentifier: 'd1e17100-0000-4000-8000-000000000006' },
      desiredSubdomain: {
        universalIdentifier: 'd1e17100-0000-4000-8000-000000000007',
      },
      goal: { universalIdentifier: 'd1e17100-0000-4000-8000-000000000008' },
      requestedAt: {
        universalIdentifier: 'd1e17100-0000-4000-8000-000000000009',
      },
      submissionCount: {
        universalIdentifier: 'd1e17100-0000-4000-8000-00000000000d',
      },
      reviewedAt: {
        universalIdentifier: 'd1e17100-0000-4000-8000-00000000000a',
      },
      reviewNotes: {
        universalIdentifier: 'd1e17100-0000-4000-8000-00000000000b',
      },
      provisionedSubdomain: {
        universalIdentifier: 'd1e17100-0000-4000-8000-00000000000c',
      },
    },
    indexes: {
      searchVectorGinIndex: {
        universalIdentifier: 'ef7f64f3-5b01-52bf-8d32-d661a741b60b',
      },
    },
  },
} as const;
