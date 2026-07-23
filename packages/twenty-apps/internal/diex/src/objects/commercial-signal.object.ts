import { defineObject, FieldType } from 'twenty-sdk/define';

export enum CommercialSignalType {
  INTENT = 'INTENT',
  ENGAGEMENT = 'ENGAGEMENT',
  OBJECTION = 'OBJECTION',
  RISK = 'RISK',
  EXPANSION = 'EXPANSION',
  CHURN_RISK = 'CHURN_RISK',
  COMPETITOR = 'COMPETITOR',
}

export enum CommercialSignalSource {
  MANUAL = 'MANUAL',
  EMAIL = 'EMAIL',
  WHATSAPP = 'WHATSAPP',
  MEETING = 'MEETING',
  WEB = 'WEB',
  AI = 'AI',
  CUSTOMER_SUCCESS = 'CUSTOMER_SUCCESS',
}

export enum CommercialSignalStatus {
  NEW = 'NEW',
  IN_REVIEW = 'IN_REVIEW',
  ACTIONED = 'ACTIONED',
  DISMISSED = 'DISMISSED',
}

export const COMMERCIAL_SIGNAL_UNIVERSAL_IDENTIFIER =
  'd1e02000-0000-4000-8000-000000000001';
export const COMMERCIAL_SIGNAL_NAME_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e02100-0000-4000-8000-000000000001';
export const COMMERCIAL_SIGNAL_TYPE_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e02100-0000-4000-8000-000000000002';
export const COMMERCIAL_SIGNAL_SOURCE_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e02100-0000-4000-8000-000000000003';
export const COMMERCIAL_SIGNAL_STATUS_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e02100-0000-4000-8000-000000000004';
export const COMMERCIAL_SIGNAL_STRENGTH_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e02100-0000-4000-8000-000000000005';
export const COMMERCIAL_SIGNAL_EVIDENCE_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e02100-0000-4000-8000-000000000006';
export const COMMERCIAL_SIGNAL_RECOMMENDED_ACTION_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e02100-0000-4000-8000-000000000007';
export const COMMERCIAL_SIGNAL_CAPTURED_AT_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e02100-0000-4000-8000-000000000008';
export const COMMERCIAL_SIGNAL_VALID_UNTIL_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e02100-0000-4000-8000-000000000009';
export const COMMERCIAL_SIGNAL_CONFIDENCE_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e02100-0000-4000-8000-00000000000a';
export const COMMERCIAL_SIGNAL_SOURCE_REFERENCE_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e02100-0000-4000-8000-00000000000b';
export const COMMERCIAL_SIGNAL_LEGACY_DIEX_ID_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e02100-0000-4000-8000-00000000000c';

export const COMMERCIAL_SIGNAL_STATUS_OPTIONS = [
  {
    id: 'd1e02130-0000-4000-8000-000000000001',
    value: CommercialSignalStatus.NEW,
    label: 'Novo',
    position: 0,
    color: 'blue' as const,
  },
  {
    id: 'd1e02130-0000-4000-8000-000000000002',
    value: CommercialSignalStatus.IN_REVIEW,
    label: 'Em análise',
    position: 1,
    color: 'orange' as const,
  },
  {
    id: 'd1e02130-0000-4000-8000-000000000003',
    value: CommercialSignalStatus.ACTIONED,
    label: 'Tratado',
    position: 2,
    color: 'green' as const,
  },
  {
    id: 'd1e02130-0000-4000-8000-000000000004',
    value: CommercialSignalStatus.DISMISSED,
    label: 'Descartado',
    position: 3,
    color: 'gray' as const,
  },
];

export default defineObject({
  universalIdentifier: COMMERCIAL_SIGNAL_UNIVERSAL_IDENTIFIER,
  nameSingular: 'commercialSignal',
  namePlural: 'commercialSignals',
  labelSingular: 'Sinal comercial',
  labelPlural: 'Sinais comerciais',
  description:
    'Evidência de intenção, risco, objeção ou expansão ligada ao contexto do CRM.',
  icon: 'IconRadar',
  labelIdentifierFieldMetadataUniversalIdentifier:
    COMMERCIAL_SIGNAL_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier:
        COMMERCIAL_SIGNAL_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'name',
      label: 'Título',
      icon: 'IconAbc',
    },
    {
      universalIdentifier:
        COMMERCIAL_SIGNAL_TYPE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.SELECT,
      name: 'type',
      label: 'Tipo',
      icon: 'IconCategory',
      options: [
        {
          id: 'd1e02110-0000-4000-8000-000000000001',
          value: CommercialSignalType.INTENT,
          label: 'Intenção',
          position: 0,
          color: 'blue',
        },
        {
          id: 'd1e02110-0000-4000-8000-000000000002',
          value: CommercialSignalType.ENGAGEMENT,
          label: 'Engajamento',
          position: 1,
          color: 'green',
        },
        {
          id: 'd1e02110-0000-4000-8000-000000000003',
          value: CommercialSignalType.OBJECTION,
          label: 'Objeção',
          position: 2,
          color: 'orange',
        },
        {
          id: 'd1e02110-0000-4000-8000-000000000004',
          value: CommercialSignalType.RISK,
          label: 'Risco comercial',
          position: 3,
          color: 'red',
        },
        {
          id: 'd1e02110-0000-4000-8000-000000000005',
          value: CommercialSignalType.EXPANSION,
          label: 'Expansão',
          position: 4,
          color: 'purple',
        },
        {
          id: 'd1e02110-0000-4000-8000-000000000006',
          value: CommercialSignalType.CHURN_RISK,
          label: 'Risco de churn',
          position: 5,
          color: 'red',
        },
        {
          id: 'd1e02110-0000-4000-8000-000000000007',
          value: CommercialSignalType.COMPETITOR,
          label: 'Concorrente',
          position: 6,
          color: 'gray',
        },
      ],
    },
    {
      universalIdentifier:
        COMMERCIAL_SIGNAL_SOURCE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.SELECT,
      name: 'source',
      label: 'Origem',
      icon: 'IconSourceCode',
      options: [
        {
          id: 'd1e02120-0000-4000-8000-000000000001',
          value: CommercialSignalSource.MANUAL,
          label: 'Manual',
          position: 0,
          color: 'gray',
        },
        {
          id: 'd1e02120-0000-4000-8000-000000000002',
          value: CommercialSignalSource.EMAIL,
          label: 'E-mail',
          position: 1,
          color: 'blue',
        },
        {
          id: 'd1e02120-0000-4000-8000-000000000003',
          value: CommercialSignalSource.WHATSAPP,
          label: 'WhatsApp',
          position: 2,
          color: 'green',
        },
        {
          id: 'd1e02120-0000-4000-8000-000000000004',
          value: CommercialSignalSource.MEETING,
          label: 'Reunião',
          position: 3,
          color: 'purple',
        },
        {
          id: 'd1e02120-0000-4000-8000-000000000005',
          value: CommercialSignalSource.WEB,
          label: 'Web',
          position: 4,
          color: 'sky',
        },
        {
          id: 'd1e02120-0000-4000-8000-000000000006',
          value: CommercialSignalSource.AI,
          label: 'IA',
          position: 5,
          color: 'orange',
        },
        {
          id: 'd1e02120-0000-4000-8000-000000000007',
          value: CommercialSignalSource.CUSTOMER_SUCCESS,
          label: 'Customer Success',
          position: 6,
          color: 'yellow',
        },
      ],
    },
    {
      universalIdentifier:
        COMMERCIAL_SIGNAL_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.SELECT,
      name: 'status',
      label: 'Status',
      icon: 'IconProgress',
      defaultValue: `'${CommercialSignalStatus.NEW}'`,
      options: COMMERCIAL_SIGNAL_STATUS_OPTIONS,
    },
    {
      universalIdentifier:
        COMMERCIAL_SIGNAL_STRENGTH_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.RATING,
      name: 'strength',
      label: 'Força',
      icon: 'IconBolt',
      isNullable: true,
      options: [
        {
          id: 'd1e02140-0000-4000-8000-000000000001',
          value: 'RATING_1',
          label: '1',
          position: 0,
        },
        {
          id: 'd1e02140-0000-4000-8000-000000000002',
          value: 'RATING_2',
          label: '2',
          position: 1,
        },
        {
          id: 'd1e02140-0000-4000-8000-000000000003',
          value: 'RATING_3',
          label: '3',
          position: 2,
        },
        {
          id: 'd1e02140-0000-4000-8000-000000000004',
          value: 'RATING_4',
          label: '4',
          position: 3,
        },
        {
          id: 'd1e02140-0000-4000-8000-000000000005',
          value: 'RATING_5',
          label: '5',
          position: 4,
        },
      ],
    },
    {
      universalIdentifier:
        COMMERCIAL_SIGNAL_EVIDENCE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.RICH_TEXT,
      name: 'evidence',
      label: 'Evidência',
      icon: 'IconFileSearch',
      isNullable: true,
    },
    {
      universalIdentifier:
        COMMERCIAL_SIGNAL_RECOMMENDED_ACTION_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.RICH_TEXT,
      name: 'recommendedAction',
      label: 'Ação recomendada',
      icon: 'IconArrowRight',
      isNullable: true,
    },
    {
      universalIdentifier:
        COMMERCIAL_SIGNAL_CAPTURED_AT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE_TIME,
      name: 'capturedAt',
      label: 'Capturado em',
      icon: 'IconCalendarEvent',
      isNullable: true,
    },
    {
      universalIdentifier:
        COMMERCIAL_SIGNAL_VALID_UNTIL_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE_TIME,
      name: 'validUntil',
      label: 'Válido até',
      icon: 'IconCalendarDue',
      isNullable: true,
    },
    {
      universalIdentifier:
        COMMERCIAL_SIGNAL_CONFIDENCE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.NUMBER,
      name: 'confidence',
      label: 'Confiança (%)',
      icon: 'IconPercentage',
      isNullable: true,
    },
    {
      universalIdentifier:
        COMMERCIAL_SIGNAL_SOURCE_REFERENCE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'sourceReference',
      label: 'Referência da origem',
      description:
        'Chave idempotente da evidência que originou o sinal, sem armazenar credenciais ou payload bruto.',
      icon: 'IconFingerprint',
      isNullable: true,
      isUnique: true,
    },
    {
      universalIdentifier:
        COMMERCIAL_SIGNAL_LEGACY_DIEX_ID_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'legacyDiexId',
      label: 'ID legado Diex',
      description:
        'Identificador técnico usado para migração idempotente do CRM anterior.',
      icon: 'IconDatabaseImport',
      isNullable: true,
      isUnique: true,
    },
  ],
});
