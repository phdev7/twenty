import { type ObjectManifest } from 'twenty-shared/application';
import { FieldMetadataType } from 'twenty-shared/types';

export enum CustomerRenewalStage {
  PLANNING = 'PLANNING',
  VALUE_PROOF = 'VALUE_PROOF',
  NEGOTIATION = 'NEGOTIATION',
  COMMITMENT = 'COMMITMENT',
  RENEWED = 'RENEWED',
  CHURNED = 'CHURNED',
}

export enum CustomerRenewalRisk {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum CustomerRenewalForecast {
  PIPELINE = 'PIPELINE',
  BEST_CASE = 'BEST_CASE',
  COMMIT = 'COMMIT',
  CLOSED = 'CLOSED',
}

export const CUSTOMER_RENEWAL_UNIVERSAL_IDENTIFIER =
  'd1e14000-0000-4000-8000-000000000001';
export const CUSTOMER_RENEWAL_NAME_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e14100-0000-4000-8000-000000000001';
export const CUSTOMER_RENEWAL_STAGE_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e14100-0000-4000-8000-000000000002';
export const CUSTOMER_RENEWAL_RISK_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e14100-0000-4000-8000-000000000003';
export const CUSTOMER_RENEWAL_FORECAST_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e14100-0000-4000-8000-000000000004';
export const CUSTOMER_RENEWAL_VALUE_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e14100-0000-4000-8000-000000000005';
export const CUSTOMER_RENEWAL_PROBABILITY_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e14100-0000-4000-8000-000000000006';
export const CUSTOMER_RENEWAL_TARGET_DATE_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e14100-0000-4000-8000-000000000007';
export const CUSTOMER_RENEWAL_NEXT_ACTION_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e14100-0000-4000-8000-000000000008';
export const CUSTOMER_RENEWAL_NEXT_ACTION_AT_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e14100-0000-4000-8000-000000000009';
export const CUSTOMER_RENEWAL_LAST_TOUCH_AT_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e14100-0000-4000-8000-00000000000a';
export const CUSTOMER_RENEWAL_RISK_REASON_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e14100-0000-4000-8000-00000000000b';
export const CUSTOMER_RENEWAL_VALUE_EVIDENCE_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e14100-0000-4000-8000-00000000000c';
export const CUSTOMER_RENEWAL_COMMERCIAL_TERMS_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e14100-0000-4000-8000-00000000000d';
export const CUSTOMER_RENEWAL_OUTCOME_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e14100-0000-4000-8000-00000000000e';
export const CUSTOMER_RENEWAL_CLOSED_AT_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e14100-0000-4000-8000-00000000000f';
export const CUSTOMER_RENEWAL_LEGACY_DIEX_ID_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e14100-0000-4000-8000-000000000010';

export const CUSTOMER_RENEWAL_STAGE_OPTIONS = [
  {
    id: 'd1e14110-0000-4000-8000-000000000001',
    value: CustomerRenewalStage.PLANNING,
    label: 'Planejamento',
    position: 0,
    color: 'gray' as const,
  },
  {
    id: 'd1e14110-0000-4000-8000-000000000002',
    value: CustomerRenewalStage.VALUE_PROOF,
    label: 'Prova de valor',
    position: 1,
    color: 'blue' as const,
  },
  {
    id: 'd1e14110-0000-4000-8000-000000000003',
    value: CustomerRenewalStage.NEGOTIATION,
    label: 'Negociação',
    position: 2,
    color: 'orange' as const,
  },
  {
    id: 'd1e14110-0000-4000-8000-000000000004',
    value: CustomerRenewalStage.COMMITMENT,
    label: 'Compromisso',
    position: 3,
    color: 'purple' as const,
  },
  {
    id: 'd1e14110-0000-4000-8000-000000000005',
    value: CustomerRenewalStage.RENEWED,
    label: 'Renovada',
    position: 4,
    color: 'green' as const,
  },
  {
    id: 'd1e14110-0000-4000-8000-000000000006',
    value: CustomerRenewalStage.CHURNED,
    label: 'Churn',
    position: 5,
    color: 'red' as const,
  },
];

export const CUSTOMER_RENEWAL_RISK_OPTIONS = [
  {
    id: 'd1e14120-0000-4000-8000-000000000001',
    value: CustomerRenewalRisk.LOW,
    label: 'Baixo',
    position: 0,
    color: 'green' as const,
  },
  {
    id: 'd1e14120-0000-4000-8000-000000000002',
    value: CustomerRenewalRisk.MEDIUM,
    label: 'Médio',
    position: 1,
    color: 'yellow' as const,
  },
  {
    id: 'd1e14120-0000-4000-8000-000000000003',
    value: CustomerRenewalRisk.HIGH,
    label: 'Alto',
    position: 2,
    color: 'orange' as const,
  },
  {
    id: 'd1e14120-0000-4000-8000-000000000004',
    value: CustomerRenewalRisk.CRITICAL,
    label: 'Crítico',
    position: 3,
    color: 'red' as const,
  },
];

export const CUSTOMER_RENEWAL_FORECAST_OPTIONS = [
  {
    id: 'd1e14130-0000-4000-8000-000000000001',
    value: CustomerRenewalForecast.PIPELINE,
    label: 'Pipeline',
    position: 0,
    color: 'gray' as const,
  },
  {
    id: 'd1e14130-0000-4000-8000-000000000002',
    value: CustomerRenewalForecast.BEST_CASE,
    label: 'Melhor caso',
    position: 1,
    color: 'blue' as const,
  },
  {
    id: 'd1e14130-0000-4000-8000-000000000003',
    value: CustomerRenewalForecast.COMMIT,
    label: 'Compromisso',
    position: 2,
    color: 'purple' as const,
  },
  {
    id: 'd1e14130-0000-4000-8000-000000000004',
    value: CustomerRenewalForecast.CLOSED,
    label: 'Fechado',
    position: 3,
    color: 'green' as const,
  },
];

export const CustomerRenewalStandardObjectDefinition = {
  universalIdentifier: CUSTOMER_RENEWAL_UNIVERSAL_IDENTIFIER,
  nameSingular: 'customerRenewal',
  namePlural: 'customerRenewals',
  labelSingular: 'Renovação de cliente',
  labelPlural: 'Renovações de clientes',
  description:
    'Caso operacional de retenção com valor, risco, forecast, próxima ação e fechamento auditável.',
  icon: 'IconRefreshDot',
  labelIdentifierFieldMetadataUniversalIdentifier:
    CUSTOMER_RENEWAL_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: CUSTOMER_RENEWAL_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.TEXT,
      name: 'name',
      label: 'Nome',
      icon: 'IconAbc',
    },
    {
      universalIdentifier: CUSTOMER_RENEWAL_STAGE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.SELECT,
      name: 'stage',
      label: 'Etapa',
      icon: 'IconProgress',
      defaultValue: `'${CustomerRenewalStage.PLANNING}'`,
      options: CUSTOMER_RENEWAL_STAGE_OPTIONS,
    },
    {
      universalIdentifier: CUSTOMER_RENEWAL_RISK_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.SELECT,
      name: 'risk',
      label: 'Risco',
      icon: 'IconAlertTriangle',
      defaultValue: `'${CustomerRenewalRisk.MEDIUM}'`,
      options: CUSTOMER_RENEWAL_RISK_OPTIONS,
    },
    {
      universalIdentifier: CUSTOMER_RENEWAL_FORECAST_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.SELECT,
      name: 'forecast',
      label: 'Forecast',
      icon: 'IconChartDots3',
      defaultValue: `'${CustomerRenewalForecast.PIPELINE}'`,
      options: CUSTOMER_RENEWAL_FORECAST_OPTIONS,
    },
    {
      universalIdentifier: CUSTOMER_RENEWAL_VALUE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.CURRENCY,
      name: 'renewalValue',
      label: 'Valor da renovação',
      icon: 'IconCurrencyReal',
      isNullable: true,
    },
    {
      universalIdentifier:
        CUSTOMER_RENEWAL_PROBABILITY_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.NUMBER,
      name: 'probability',
      label: 'Probabilidade (%)',
      icon: 'IconPercentage',
      isNullable: true,
    },
    {
      universalIdentifier:
        CUSTOMER_RENEWAL_TARGET_DATE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.DATE,
      name: 'targetDate',
      label: 'Data-alvo',
      icon: 'IconCalendarDue',
      isNullable: true,
    },
    {
      universalIdentifier:
        CUSTOMER_RENEWAL_NEXT_ACTION_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.TEXT,
      name: 'nextAction',
      label: 'Próxima ação',
      icon: 'IconTargetArrow',
      isNullable: true,
    },
    {
      universalIdentifier:
        CUSTOMER_RENEWAL_NEXT_ACTION_AT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.DATE_TIME,
      name: 'nextActionAt',
      label: 'Prazo da próxima ação',
      icon: 'IconClock',
      isNullable: true,
    },
    {
      universalIdentifier:
        CUSTOMER_RENEWAL_LAST_TOUCH_AT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.DATE_TIME,
      name: 'lastTouchAt',
      label: 'Último contato',
      icon: 'IconMessage',
      isNullable: true,
    },
    {
      universalIdentifier:
        CUSTOMER_RENEWAL_RISK_REASON_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.RICH_TEXT,
      name: 'riskReason',
      label: 'Motivo do risco',
      icon: 'IconAlertCircle',
      isNullable: true,
    },
    {
      universalIdentifier:
        CUSTOMER_RENEWAL_VALUE_EVIDENCE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.RICH_TEXT,
      name: 'valueEvidence',
      label: 'Evidência de valor',
      icon: 'IconRosetteDiscountCheck',
      isNullable: true,
    },
    {
      universalIdentifier:
        CUSTOMER_RENEWAL_COMMERCIAL_TERMS_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.RICH_TEXT,
      name: 'commercialTerms',
      label: 'Condições comerciais',
      icon: 'IconReceipt',
      isNullable: true,
    },
    {
      universalIdentifier: CUSTOMER_RENEWAL_OUTCOME_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.RICH_TEXT,
      name: 'outcome',
      label: 'Resultado',
      icon: 'IconNotes',
      isNullable: true,
    },
    {
      universalIdentifier:
        CUSTOMER_RENEWAL_CLOSED_AT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.DATE_TIME,
      name: 'closedAt',
      label: 'Fechada em',
      icon: 'IconCircleCheck',
      isNullable: true,
    },
    {
      universalIdentifier:
        CUSTOMER_RENEWAL_LEGACY_DIEX_ID_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.TEXT,
      name: 'legacyDiexId',
      label: 'ID legado Diex',
      icon: 'IconDatabaseImport',
      isNullable: true,
      isUnique: true,
    },
  ],
} as const satisfies ObjectManifest;
