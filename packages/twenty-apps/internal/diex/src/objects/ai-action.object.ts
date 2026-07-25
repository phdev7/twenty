import { defineObject, FieldType } from 'twenty-sdk/define';

export enum AiActionType {
  QUALIFY = 'QUALIFY',
  REPLY = 'REPLY',
  FOLLOW_UP = 'FOLLOW_UP',
  PIPELINE_UPDATE = 'PIPELINE_UPDATE',
  RISK_MITIGATION = 'RISK_MITIGATION',
  CS_INTERVENTION = 'CS_INTERVENTION',
  EXPANSION = 'EXPANSION',
}

export enum AiActionStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXECUTED = 'EXECUTED',
  FAILED = 'FAILED',
}

export const AI_ACTION_UNIVERSAL_IDENTIFIER =
  'd1e05000-0000-4000-8000-000000000001';
export const AI_ACTION_NAME_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e05100-0000-4000-8000-000000000001';
export const AI_ACTION_TYPE_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e05100-0000-4000-8000-000000000002';
export const AI_ACTION_STATUS_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e05100-0000-4000-8000-000000000003';
export const AI_ACTION_CONFIDENCE_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e05100-0000-4000-8000-000000000004';
export const AI_ACTION_RATIONALE_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e05100-0000-4000-8000-000000000005';
export const AI_ACTION_PROPOSED_ACTION_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e05100-0000-4000-8000-000000000006';
export const AI_ACTION_APPROVAL_NOTES_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e05100-0000-4000-8000-000000000007';
export const AI_ACTION_REQUESTED_AT_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e05100-0000-4000-8000-000000000008';
export const AI_ACTION_APPROVED_AT_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e05100-0000-4000-8000-000000000009';
export const AI_ACTION_EXECUTED_AT_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e05100-0000-4000-8000-00000000000a';
export const AI_ACTION_EXECUTION_RECEIPT_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e05100-0000-4000-8000-00000000000b';
export const AI_ACTION_REQUIRES_APPROVAL_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e05100-0000-4000-8000-00000000000c';
export const AI_ACTION_IDEMPOTENCY_KEY_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e05100-0000-4000-8000-00000000000d';

export const AI_ACTION_STATUS_OPTIONS = [
  {
    id: 'd1e05120-0000-4000-8000-000000000001',
    value: AiActionStatus.DRAFT,
    label: 'Rascunho',
    position: 0,
    color: 'gray' as const,
  },
  {
    id: 'd1e05120-0000-4000-8000-000000000002',
    value: AiActionStatus.PENDING_APPROVAL,
    label: 'Aguardando aprovação',
    position: 1,
    color: 'orange' as const,
  },
  {
    id: 'd1e05120-0000-4000-8000-000000000003',
    value: AiActionStatus.APPROVED,
    label: 'Aprovada',
    position: 2,
    color: 'blue' as const,
  },
  {
    id: 'd1e05120-0000-4000-8000-000000000004',
    value: AiActionStatus.REJECTED,
    label: 'Rejeitada',
    position: 3,
    color: 'red' as const,
  },
  {
    id: 'd1e05120-0000-4000-8000-000000000005',
    value: AiActionStatus.EXECUTED,
    label: 'Executada',
    position: 4,
    color: 'green' as const,
  },
  {
    id: 'd1e05120-0000-4000-8000-000000000006',
    value: AiActionStatus.FAILED,
    label: 'Falhou',
    position: 5,
    color: 'red' as const,
  },
];

export default defineObject({
  universalIdentifier: AI_ACTION_UNIVERSAL_IDENTIFIER,
  nameSingular: 'aiAction',
  namePlural: 'aiActions',
  labelSingular: 'Ação de IA',
  labelPlural: 'Ações de IA',
  description:
    'Proposta rastreável da IA com evidência, aprovação humana e recibo de execução.',
  icon: 'IconRobot',
  labelIdentifierFieldMetadataUniversalIdentifier:
    AI_ACTION_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: AI_ACTION_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'name',
      label: 'Título',
      icon: 'IconAbc',
    },
    {
      universalIdentifier: AI_ACTION_TYPE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.SELECT,
      name: 'actionType',
      label: 'Tipo',
      icon: 'IconCategory',
      options: [
        {
          id: 'd1e05110-0000-4000-8000-000000000001',
          value: AiActionType.QUALIFY,
          label: 'Qualificar',
          position: 0,
          color: 'blue',
        },
        {
          id: 'd1e05110-0000-4000-8000-000000000002',
          value: AiActionType.REPLY,
          label: 'Responder',
          position: 1,
          color: 'sky',
        },
        {
          id: 'd1e05110-0000-4000-8000-000000000003',
          value: AiActionType.FOLLOW_UP,
          label: 'Follow-up',
          position: 2,
          color: 'orange',
        },
        {
          id: 'd1e05110-0000-4000-8000-000000000004',
          value: AiActionType.PIPELINE_UPDATE,
          label: 'Atualizar pipeline',
          position: 3,
          color: 'purple',
        },
        {
          id: 'd1e05110-0000-4000-8000-000000000005',
          value: AiActionType.RISK_MITIGATION,
          label: 'Mitigar risco',
          position: 4,
          color: 'red',
        },
        {
          id: 'd1e05110-0000-4000-8000-000000000006',
          value: AiActionType.CS_INTERVENTION,
          label: 'Intervenção de CS',
          position: 5,
          color: 'green',
        },
        {
          id: 'd1e05110-0000-4000-8000-000000000007',
          value: AiActionType.EXPANSION,
          label: 'Expansão',
          position: 6,
          color: 'yellow',
        },
      ],
    },
    {
      universalIdentifier: AI_ACTION_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.SELECT,
      name: 'status',
      label: 'Status',
      icon: 'IconProgress',
      defaultValue: `'${AiActionStatus.PENDING_APPROVAL}'`,
      options: AI_ACTION_STATUS_OPTIONS,
    },
    {
      universalIdentifier: AI_ACTION_CONFIDENCE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.NUMBER,
      name: 'confidence',
      label: 'Confiança (%)',
      icon: 'IconPercentage',
      isNullable: true,
    },
    {
      universalIdentifier: AI_ACTION_RATIONALE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.RICH_TEXT,
      name: 'rationale',
      label: 'Justificativa',
      icon: 'IconBrain',
      isNullable: true,
    },
    {
      universalIdentifier:
        AI_ACTION_PROPOSED_ACTION_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.RICH_TEXT,
      name: 'proposedAction',
      label: 'Ação proposta',
      icon: 'IconSparkles',
      isNullable: true,
    },
    {
      universalIdentifier:
        AI_ACTION_APPROVAL_NOTES_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.RICH_TEXT,
      name: 'approvalNotes',
      label: 'Notas da aprovação',
      icon: 'IconUserCheck',
      isNullable: true,
    },
    {
      universalIdentifier:
        AI_ACTION_REQUESTED_AT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE_TIME,
      name: 'requestedAt',
      label: 'Solicitada em',
      icon: 'IconClock',
      isNullable: true,
    },
    {
      universalIdentifier: AI_ACTION_APPROVED_AT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE_TIME,
      name: 'approvedAt',
      label: 'Aprovada em',
      icon: 'IconCalendarCheck',
      isNullable: true,
    },
    {
      universalIdentifier: AI_ACTION_EXECUTED_AT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE_TIME,
      name: 'executedAt',
      label: 'Executada em',
      icon: 'IconPlayerPlay',
      isNullable: true,
    },
    {
      universalIdentifier:
        AI_ACTION_EXECUTION_RECEIPT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.RICH_TEXT,
      name: 'executionReceipt',
      label: 'Recibo de execução',
      icon: 'IconReceipt',
      isNullable: true,
    },
    {
      universalIdentifier:
        AI_ACTION_REQUIRES_APPROVAL_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.BOOLEAN,
      name: 'requiresApproval',
      label: 'Exige aprovação',
      icon: 'IconShieldCheck',
      defaultValue: true,
    },
    {
      universalIdentifier:
        AI_ACTION_IDEMPOTENCY_KEY_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'idempotencyKey',
      label: 'Chave de idempotência',
      description:
        'Impede que a mesma evidência gere propostas duplicadas na fila de aprovação.',
      icon: 'IconFingerprint',
      isNullable: true,
      isUnique: true,
    },
  ],
});
