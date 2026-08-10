import { type ObjectManifest } from 'diex-shared/application';
import { FieldMetadataType } from 'diex-shared/types';

export enum OfferStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  RETIRED = 'RETIRED',
}

export enum OfferPricingModel {
  ONE_TIME = 'ONE_TIME',
  MONTHLY = 'MONTHLY',
  ANNUAL = 'ANNUAL',
  USAGE = 'USAGE',
  NEGOTIABLE = 'NEGOTIABLE',
}

export const OFFER_UNIVERSAL_IDENTIFIER =
  'd1e01000-0000-4000-8000-000000000001';
export const OFFER_NAME_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e01100-0000-4000-8000-000000000001';
export const OFFER_STATUS_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e01100-0000-4000-8000-000000000002';
export const OFFER_CATEGORY_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e01100-0000-4000-8000-000000000003';
export const OFFER_PRICING_MODEL_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e01100-0000-4000-8000-000000000004';
export const OFFER_BASE_PRICE_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e01100-0000-4000-8000-000000000005';
export const OFFER_VALUE_PROPOSITION_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e01100-0000-4000-8000-000000000006';
export const OFFER_ICP_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e01100-0000-4000-8000-000000000007';
export const OFFER_DIFFERENTIATORS_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e01100-0000-4000-8000-000000000008';
export const OFFER_OBJECTION_PLAYBOOK_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e01100-0000-4000-8000-000000000009';
export const OFFER_QUALIFICATION_CRITERIA_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e01100-0000-4000-8000-00000000000a';
export const OFFER_LEGACY_DIEX_ID_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e01100-0000-4000-8000-00000000000b';

export const OFFER_STATUS_OPTIONS = [
  {
    id: 'd1e01110-0000-4000-8000-000000000001',
    value: OfferStatus.DRAFT,
    label: 'Rascunho',
    position: 0,
    color: 'gray' as const,
  },
  {
    id: 'd1e01110-0000-4000-8000-000000000002',
    value: OfferStatus.ACTIVE,
    label: 'Ativa',
    position: 1,
    color: 'green' as const,
  },
  {
    id: 'd1e01110-0000-4000-8000-000000000003',
    value: OfferStatus.PAUSED,
    label: 'Pausada',
    position: 2,
    color: 'orange' as const,
  },
  {
    id: 'd1e01110-0000-4000-8000-000000000004',
    value: OfferStatus.RETIRED,
    label: 'Descontinuada',
    position: 3,
    color: 'red' as const,
  },
];

export const OfferStandardObjectDefinition = {
  universalIdentifier: OFFER_UNIVERSAL_IDENTIFIER,
  nameSingular: 'offer',
  namePlural: 'offers',
  labelSingular: 'Oferta',
  labelPlural: 'Ofertas',
  description:
    'Catálogo vendável com ICP, proposta de valor, preço e playbook comercial.',
  icon: 'IconPackage',
  labelIdentifierFieldMetadataUniversalIdentifier:
    OFFER_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: OFFER_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.TEXT,
      name: 'name',
      label: 'Nome',
      icon: 'IconAbc',
    },
    {
      universalIdentifier: OFFER_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.SELECT,
      name: 'status',
      label: 'Status',
      icon: 'IconProgress',
      defaultValue: `'${OfferStatus.DRAFT}'`,
      options: OFFER_STATUS_OPTIONS,
    },
    {
      universalIdentifier: OFFER_CATEGORY_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.TEXT,
      name: 'category',
      label: 'Categoria',
      icon: 'IconCategory',
      isNullable: true,
    },
    {
      universalIdentifier: OFFER_PRICING_MODEL_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.SELECT,
      name: 'pricingModel',
      label: 'Modelo de preço',
      icon: 'IconReceipt',
      isNullable: true,
      options: [
        {
          id: 'd1e01120-0000-4000-8000-000000000001',
          value: OfferPricingModel.ONE_TIME,
          label: 'Pagamento único',
          position: 0,
          color: 'blue',
        },
        {
          id: 'd1e01120-0000-4000-8000-000000000002',
          value: OfferPricingModel.MONTHLY,
          label: 'Mensal',
          position: 1,
          color: 'green',
        },
        {
          id: 'd1e01120-0000-4000-8000-000000000003',
          value: OfferPricingModel.ANNUAL,
          label: 'Anual',
          position: 2,
          color: 'purple',
        },
        {
          id: 'd1e01120-0000-4000-8000-000000000004',
          value: OfferPricingModel.USAGE,
          label: 'Por uso',
          position: 3,
          color: 'orange',
        },
        {
          id: 'd1e01120-0000-4000-8000-000000000005',
          value: OfferPricingModel.NEGOTIABLE,
          label: 'Sob consulta',
          position: 4,
          color: 'gray',
        },
      ],
    },
    {
      universalIdentifier: OFFER_BASE_PRICE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.CURRENCY,
      name: 'basePrice',
      label: 'Preço base',
      icon: 'IconCurrencyReal',
      isNullable: true,
    },
    {
      universalIdentifier: OFFER_VALUE_PROPOSITION_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.RICH_TEXT,
      name: 'valueProposition',
      label: 'Proposta de valor',
      icon: 'IconSparkles',
      isNullable: true,
    },
    {
      universalIdentifier: OFFER_ICP_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.RICH_TEXT,
      name: 'idealCustomerProfile',
      label: 'Perfil de cliente ideal',
      icon: 'IconTargetArrow',
      isNullable: true,
    },
    {
      universalIdentifier: OFFER_DIFFERENTIATORS_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.RICH_TEXT,
      name: 'differentiators',
      label: 'Diferenciais',
      icon: 'IconRosetteDiscountCheck',
      isNullable: true,
    },
    {
      universalIdentifier: OFFER_OBJECTION_PLAYBOOK_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.RICH_TEXT,
      name: 'objectionPlaybook',
      label: 'Playbook de objeções',
      icon: 'IconMessageQuestion',
      isNullable: true,
    },
    {
      universalIdentifier:
        OFFER_QUALIFICATION_CRITERIA_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.RICH_TEXT,
      name: 'qualificationCriteria',
      label: 'Critérios de qualificação',
      icon: 'IconChecklist',
      isNullable: true,
    },
    {
      universalIdentifier: OFFER_LEGACY_DIEX_ID_FIELD_UNIVERSAL_IDENTIFIER,
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
