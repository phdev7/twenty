import { DIEX_STANDARD_EXTENSION_RELATION_FIELDS } from '@/metadata/constants/diex-standard-object-extension-relation-fields.constant';

export const DIEX_STANDARD_OBJECT_EXTENSION_FIELDS = {
  company: {
    ...DIEX_STANDARD_EXTENSION_RELATION_FIELDS.company,
    diexAnnualRevenueRange: {
      universalIdentifier: 'd1e05500-0000-4000-8000-000000000013',
    },
    diexBadges: {
      universalIdentifier: 'd1e05700-0000-4000-8000-000000000002',
    },
    diexEmployeeRange: {
      universalIdentifier: 'd1e05500-0000-4000-8000-000000000014',
    },
    diexLifecycle: {
      universalIdentifier: 'd1e05500-0000-4000-8000-000000000001',
    },
    diexNiche: { universalIdentifier: 'd1e05500-0000-4000-8000-000000000012' },
    diexSegment: {
      universalIdentifier: 'd1e05500-0000-4000-8000-000000000011',
    },
    icpFit: { universalIdentifier: 'd1e05500-0000-4000-8000-000000000002' },
    legacyDiexId: {
      universalIdentifier: 'd1e05500-0000-4000-8000-00000000000d',
    },
  },
  note: {
    legacyDiexId: {
      universalIdentifier: 'd1e05500-0000-4000-8000-000000000015',
    },
  },
  opportunity: {
    ...DIEX_STANDARD_EXTENSION_RELATION_FIELDS.opportunity,
    budgetConfirmed: {
      universalIdentifier: 'd1e05500-0000-4000-8000-00000000000a',
    },
    commercialScore: {
      universalIdentifier: 'd1e05500-0000-4000-8000-000000000005',
    },
    dealRisk: { universalIdentifier: 'd1e05500-0000-4000-8000-000000000008' },
    decisionAccessConfirmed: {
      universalIdentifier: 'd1e05500-0000-4000-8000-000000000009',
    },
    legacyDiexId: {
      universalIdentifier: 'd1e05500-0000-4000-8000-00000000000f',
    },
    needConfirmed: {
      universalIdentifier: 'd1e05500-0000-4000-8000-00000000000b',
    },
    nextCommercialAction: {
      universalIdentifier: 'd1e05500-0000-4000-8000-000000000006',
    },
    nextCommercialActionAt: {
      universalIdentifier: 'd1e05500-0000-4000-8000-000000000007',
    },
    timingConfirmed: {
      universalIdentifier: 'd1e05500-0000-4000-8000-00000000000c',
    },
  },
  person: {
    ...DIEX_STANDARD_EXTENSION_RELATION_FIELDS.person,
    buyingIntent: {
      universalIdentifier: 'd1e05500-0000-4000-8000-000000000004',
    },
    diexBadges: {
      universalIdentifier: 'd1e05700-0000-4000-8000-000000000001',
    },
    buyingRole: { universalIdentifier: 'd1e05500-0000-4000-8000-000000000003' },
    doNotContact: {
      universalIdentifier: 'd1e05600-0000-4000-8000-000000000004',
    },
    legacyDiexId: {
      universalIdentifier: 'd1e05500-0000-4000-8000-00000000000e',
    },
    whatsappConsentAt: {
      universalIdentifier: 'd1e05600-0000-4000-8000-000000000003',
    },
    whatsappConsentStatus: {
      universalIdentifier: 'd1e05600-0000-4000-8000-000000000002',
    },
    whatsappNormalizedPhone: {
      universalIdentifier: 'd1e05600-0000-4000-8000-000000000001',
    },
  },
  task: {
    ...DIEX_STANDARD_EXTENSION_RELATION_FIELDS.task,
    legacyDiexId: {
      universalIdentifier: 'd1e05500-0000-4000-8000-000000000010',
    },
    taskCategory: {
      universalIdentifier: 'd1e05500-0000-4000-8000-000000000016',
    },
  },
  workspaceMember: {
    ...DIEX_STANDARD_EXTENSION_RELATION_FIELDS.workspaceMember,
  },
} as const;
