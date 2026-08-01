import { type ObjectManifest } from 'twenty-shared/application';
import { FieldMetadataType } from 'twenty-shared/types';

export enum SuccessLifecycle {
  ONBOARDING = 'ONBOARDING',
  ADOPTION = 'ADOPTION',
  VALUE_DELIVERED = 'VALUE_DELIVERED',
  EXPANSION = 'EXPANSION',
  RENEWAL = 'RENEWAL',
  AT_RISK = 'AT_RISK',
  CHURNED = 'CHURNED',
}

export enum SuccessHealth {
  UNKNOWN = 'UNKNOWN',
  HEALTHY = 'HEALTHY',
  ATTENTION = 'ATTENTION',
  CRITICAL = 'CRITICAL',
}

export const SUCCESS_PLAN_UNIVERSAL_IDENTIFIER =
  'd1e03000-0000-4000-8000-000000000001';
export const SUCCESS_PLAN_NAME_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e03100-0000-4000-8000-000000000001';
export const SUCCESS_PLAN_LIFECYCLE_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e03100-0000-4000-8000-000000000002';
export const SUCCESS_PLAN_HEALTH_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e03100-0000-4000-8000-000000000003';
export const SUCCESS_PLAN_RECURRING_REVENUE_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e03100-0000-4000-8000-000000000004';
export const SUCCESS_PLAN_START_DATE_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e03100-0000-4000-8000-000000000005';
export const SUCCESS_PLAN_RENEWAL_DATE_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e03100-0000-4000-8000-000000000006';
export const SUCCESS_PLAN_NEXT_REVIEW_AT_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e03100-0000-4000-8000-000000000007';
export const SUCCESS_PLAN_OBJECTIVES_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e03100-0000-4000-8000-000000000008';
export const SUCCESS_PLAN_SUCCESS_CRITERIA_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e03100-0000-4000-8000-000000000009';
export const SUCCESS_PLAN_RISKS_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e03100-0000-4000-8000-00000000000a';
export const SUCCESS_PLAN_EXECUTIVE_SUMMARY_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e03100-0000-4000-8000-00000000000b';
export const SUCCESS_PLAN_HEALTH_SCORE_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e03100-0000-4000-8000-00000000000c';
export const SUCCESS_PLAN_ACTIVE_USE_RATING_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e03100-0000-4000-8000-00000000000d';
export const SUCCESS_PLAN_VALUE_EVIDENCE_RATING_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e03100-0000-4000-8000-00000000000e';
export const SUCCESS_PLAN_EXPANSION_SIGNAL_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e03100-0000-4000-8000-00000000000f';
export const SUCCESS_PLAN_LEGACY_DIEX_ID_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e03100-0000-4000-8000-000000000010';

export const SUCCESS_LIFECYCLE_OPTIONS = [
  {
    id: 'd1e03110-0000-4000-8000-000000000001',
    value: SuccessLifecycle.ONBOARDING,
    label: 'Onboarding',
    position: 0,
    color: 'blue' as const,
  },
  {
    id: 'd1e03110-0000-4000-8000-000000000002',
    value: SuccessLifecycle.ADOPTION,
    label: 'Adoção',
    position: 1,
    color: 'sky' as const,
  },
  {
    id: 'd1e03110-0000-4000-8000-000000000003',
    value: SuccessLifecycle.VALUE_DELIVERED,
    label: 'Valor entregue',
    position: 2,
    color: 'green' as const,
  },
  {
    id: 'd1e03110-0000-4000-8000-000000000004',
    value: SuccessLifecycle.EXPANSION,
    label: 'Expansão',
    position: 3,
    color: 'purple' as const,
  },
  {
    id: 'd1e03110-0000-4000-8000-000000000005',
    value: SuccessLifecycle.RENEWAL,
    label: 'Renovação',
    position: 4,
    color: 'orange' as const,
  },
  {
    id: 'd1e03110-0000-4000-8000-000000000006',
    value: SuccessLifecycle.AT_RISK,
    label: 'Em risco',
    position: 5,
    color: 'red' as const,
  },
  {
    id: 'd1e03110-0000-4000-8000-000000000007',
    value: SuccessLifecycle.CHURNED,
    label: 'Churn',
    position: 6,
    color: 'gray' as const,
  },
];

export const SUCCESS_HEALTH_OPTIONS = [
  {
    id: 'd1e03120-0000-4000-8000-000000000001',
    value: SuccessHealth.UNKNOWN,
    label: 'Sem diagnóstico',
    position: 0,
    color: 'gray' as const,
  },
  {
    id: 'd1e03120-0000-4000-8000-000000000002',
    value: SuccessHealth.HEALTHY,
    label: 'Saudável',
    position: 1,
    color: 'green' as const,
  },
  {
    id: 'd1e03120-0000-4000-8000-000000000003',
    value: SuccessHealth.ATTENTION,
    label: 'Atenção',
    position: 2,
    color: 'orange' as const,
  },
  {
    id: 'd1e03120-0000-4000-8000-000000000004',
    value: SuccessHealth.CRITICAL,
    label: 'Crítico',
    position: 3,
    color: 'red' as const,
  },
];

export const SuccessPlanStandardObjectDefinition = {
  universalIdentifier: SUCCESS_PLAN_UNIVERSAL_IDENTIFIER,
  nameSingular: 'successPlan',
  namePlural: 'successPlans',
  labelSingular: 'Plano de sucesso',
  labelPlural: 'Planos de sucesso',
  description:
    'Plano operacional do cliente com saúde, objetivos, riscos, receita e renovação.',
  icon: 'IconHeartHandshake',
  labelIdentifierFieldMetadataUniversalIdentifier:
    SUCCESS_PLAN_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: SUCCESS_PLAN_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.TEXT,
      name: 'name',
      label: 'Nome',
      icon: 'IconAbc',
    },
    {
      universalIdentifier: SUCCESS_PLAN_LIFECYCLE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.SELECT,
      name: 'lifecycle',
      label: 'Jornada',
      icon: 'IconRoute',
      defaultValue: `'${SuccessLifecycle.ONBOARDING}'`,
      options: SUCCESS_LIFECYCLE_OPTIONS,
    },
    {
      universalIdentifier: SUCCESS_PLAN_HEALTH_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.SELECT,
      name: 'health',
      label: 'Saúde',
      icon: 'IconActivityHeartbeat',
      defaultValue: `'${SuccessHealth.UNKNOWN}'`,
      options: SUCCESS_HEALTH_OPTIONS,
    },
    {
      universalIdentifier: SUCCESS_PLAN_HEALTH_SCORE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.NUMBER,
      name: 'healthScore',
      label: 'Score de saúde',
      description:
        'Pontuação explicável de 0 a 100 calculada a partir dos sinais de CS disponíveis.',
      icon: 'IconChartBar',
      isNullable: true,
    },
    {
      universalIdentifier:
        SUCCESS_PLAN_ACTIVE_USE_RATING_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.RATING,
      name: 'activeUseRating',
      label: 'Adoção ativa',
      description:
        'Nível observado de uso e adoção do produto ou serviço pelo cliente.',
      icon: 'IconActivity',
      isNullable: true,
      options: [
        {
          id: 'd1e03130-0000-4000-8000-000000000001',
          value: 'RATING_1',
          label: '1',
          position: 0,
        },
        {
          id: 'd1e03130-0000-4000-8000-000000000002',
          value: 'RATING_2',
          label: '2',
          position: 1,
        },
        {
          id: 'd1e03130-0000-4000-8000-000000000003',
          value: 'RATING_3',
          label: '3',
          position: 2,
        },
        {
          id: 'd1e03130-0000-4000-8000-000000000004',
          value: 'RATING_4',
          label: '4',
          position: 3,
        },
        {
          id: 'd1e03130-0000-4000-8000-000000000005',
          value: 'RATING_5',
          label: '5',
          position: 4,
        },
      ],
    },
    {
      universalIdentifier:
        SUCCESS_PLAN_VALUE_EVIDENCE_RATING_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.RATING,
      name: 'valueEvidenceRating',
      label: 'Evidência de valor',
      description:
        'Força das evidências de resultado reconhecidas pelo cliente.',
      icon: 'IconRosetteDiscountCheck',
      isNullable: true,
      options: [
        {
          id: 'd1e03140-0000-4000-8000-000000000001',
          value: 'RATING_1',
          label: '1',
          position: 0,
        },
        {
          id: 'd1e03140-0000-4000-8000-000000000002',
          value: 'RATING_2',
          label: '2',
          position: 1,
        },
        {
          id: 'd1e03140-0000-4000-8000-000000000003',
          value: 'RATING_3',
          label: '3',
          position: 2,
        },
        {
          id: 'd1e03140-0000-4000-8000-000000000004',
          value: 'RATING_4',
          label: '4',
          position: 3,
        },
        {
          id: 'd1e03140-0000-4000-8000-000000000005',
          value: 'RATING_5',
          label: '5',
          position: 4,
        },
      ],
    },
    {
      universalIdentifier:
        SUCCESS_PLAN_EXPANSION_SIGNAL_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.BOOLEAN,
      name: 'expansionSignal',
      label: 'Sinal de expansão validado',
      description:
        'Indica que existe evidência concreta de potencial de expansão.',
      icon: 'IconTrendingUp',
      isNullable: true,
    },
    {
      universalIdentifier:
        SUCCESS_PLAN_RECURRING_REVENUE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.CURRENCY,
      name: 'recurringRevenue',
      label: 'Receita recorrente',
      icon: 'IconRepeat',
      isNullable: true,
    },
    {
      universalIdentifier: SUCCESS_PLAN_START_DATE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.DATE,
      name: 'startDate',
      label: 'Início',
      icon: 'IconCalendarEvent',
      isNullable: true,
    },
    {
      universalIdentifier: SUCCESS_PLAN_RENEWAL_DATE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.DATE,
      name: 'renewalDate',
      label: 'Renovação',
      icon: 'IconCalendarDue',
      isNullable: true,
    },
    {
      universalIdentifier:
        SUCCESS_PLAN_NEXT_REVIEW_AT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.DATE_TIME,
      name: 'nextReviewAt',
      label: 'Próxima revisão',
      icon: 'IconClock',
      isNullable: true,
    },
    {
      universalIdentifier: SUCCESS_PLAN_OBJECTIVES_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.RICH_TEXT,
      name: 'objectives',
      label: 'Objetivos do cliente',
      icon: 'IconTargetArrow',
      isNullable: true,
    },
    {
      universalIdentifier:
        SUCCESS_PLAN_SUCCESS_CRITERIA_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.RICH_TEXT,
      name: 'successCriteria',
      label: 'Critérios de sucesso',
      icon: 'IconChecklist',
      isNullable: true,
    },
    {
      universalIdentifier: SUCCESS_PLAN_RISKS_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.RICH_TEXT,
      name: 'risks',
      label: 'Riscos',
      icon: 'IconAlertTriangle',
      isNullable: true,
    },
    {
      universalIdentifier:
        SUCCESS_PLAN_EXECUTIVE_SUMMARY_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.RICH_TEXT,
      name: 'executiveSummary',
      label: 'Resumo executivo',
      icon: 'IconFileDescription',
      isNullable: true,
    },
    {
      universalIdentifier:
        SUCCESS_PLAN_LEGACY_DIEX_ID_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.TEXT,
      name: 'legacyDiexId',
      label: 'ID legado Diex',
      description:
        'Identificador técnico usado para migração idempotente do CRM anterior.',
      icon: 'IconDatabaseImport',
      isNullable: true,
      isUnique: true,
    },
  ],
} as const satisfies ObjectManifest;
