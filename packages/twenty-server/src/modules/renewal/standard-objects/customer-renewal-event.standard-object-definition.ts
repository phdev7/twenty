import { type ObjectManifest } from 'twenty-shared/application';
import { FieldMetadataType } from 'twenty-shared/types';

export enum CustomerRenewalEventType {
  CREATED = 'CREATED',
  STAGE_CHANGED = 'STAGE_CHANGED',
  PLAN_UPDATED = 'PLAN_UPDATED',
  TOUCH_RECORDED = 'TOUCH_RECORDED',
  AI_ACTION_PROPOSED = 'AI_ACTION_PROPOSED',
  CLOSED_WON = 'CLOSED_WON',
  CLOSED_LOST = 'CLOSED_LOST',
}

export const CUSTOMER_RENEWAL_EVENT_UNIVERSAL_IDENTIFIER =
  'd1e14200-0000-4000-8000-000000000001';
export const CUSTOMER_RENEWAL_EVENT_NAME_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e14300-0000-4000-8000-000000000001';
export const CUSTOMER_RENEWAL_EVENT_TYPE_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e14300-0000-4000-8000-000000000002';
export const CUSTOMER_RENEWAL_EVENT_SUMMARY_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e14300-0000-4000-8000-000000000003';
export const CUSTOMER_RENEWAL_EVENT_OCCURRED_AT_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e14300-0000-4000-8000-000000000004';

export const CustomerRenewalEventStandardObjectDefinition = {
  universalIdentifier: CUSTOMER_RENEWAL_EVENT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'customerRenewalEvent',
  namePlural: 'customerRenewalEvents',
  labelSingular: 'Evento de renovação',
  labelPlural: 'Eventos de renovação',
  description:
    'Histórico auditável das decisões e movimentações de cada renovação.',
  icon: 'IconTimelineEvent',
  labelIdentifierFieldMetadataUniversalIdentifier:
    CUSTOMER_RENEWAL_EVENT_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier:
        CUSTOMER_RENEWAL_EVENT_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.TEXT,
      name: 'name',
      label: 'Identificador',
      icon: 'IconHash',
    },
    {
      universalIdentifier:
        CUSTOMER_RENEWAL_EVENT_TYPE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.SELECT,
      name: 'eventType',
      label: 'Tipo',
      icon: 'IconCategory',
      options: [
        {
          id: 'd1e14310-0000-4000-8000-000000000001',
          value: CustomerRenewalEventType.CREATED,
          label: 'Criada',
          position: 0,
          color: 'blue',
        },
        {
          id: 'd1e14310-0000-4000-8000-000000000002',
          value: CustomerRenewalEventType.STAGE_CHANGED,
          label: 'Etapa alterada',
          position: 1,
          color: 'purple',
        },
        {
          id: 'd1e14310-0000-4000-8000-000000000003',
          value: CustomerRenewalEventType.PLAN_UPDATED,
          label: 'Plano atualizado',
          position: 2,
          color: 'gray',
        },
        {
          id: 'd1e14310-0000-4000-8000-000000000004',
          value: CustomerRenewalEventType.TOUCH_RECORDED,
          label: 'Contato registrado',
          position: 3,
          color: 'sky',
        },
        {
          id: 'd1e14310-0000-4000-8000-000000000005',
          value: CustomerRenewalEventType.AI_ACTION_PROPOSED,
          label: 'Ação de IA proposta',
          position: 4,
          color: 'orange',
        },
        {
          id: 'd1e14310-0000-4000-8000-000000000006',
          value: CustomerRenewalEventType.CLOSED_WON,
          label: 'Renovada',
          position: 5,
          color: 'green',
        },
        {
          id: 'd1e14310-0000-4000-8000-000000000007',
          value: CustomerRenewalEventType.CLOSED_LOST,
          label: 'Churn',
          position: 6,
          color: 'red',
        },
      ],
    },
    {
      universalIdentifier:
        CUSTOMER_RENEWAL_EVENT_SUMMARY_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.TEXT,
      name: 'summary',
      label: 'Resumo',
      icon: 'IconNotes',
    },
    {
      universalIdentifier:
        CUSTOMER_RENEWAL_EVENT_OCCURRED_AT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.DATE_TIME,
      name: 'occurredAt',
      label: 'Ocorrido em',
      icon: 'IconClock',
    },
  ],
} as const satisfies ObjectManifest;
