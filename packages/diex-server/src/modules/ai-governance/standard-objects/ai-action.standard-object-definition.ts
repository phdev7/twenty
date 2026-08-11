import { type ObjectManifest } from 'diex-shared/application';
import { FieldMetadataType } from 'diex-shared/types';

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
  EXECUTING = 'EXECUTING',
  REJECTED = 'REJECTED',
  EXECUTED = 'EXECUTED',
  FAILED = 'FAILED',
}

export enum AiActionRiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  BLOCKED = 'BLOCKED',
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
export const AI_ACTION_CONTEXT_VERSION_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e05100-0000-4000-8000-00000000000e';
export const AI_ACTION_EXECUTION_STARTED_AT_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e05100-0000-4000-8000-00000000000f';
export const AI_ACTION_FAILURE_REASON_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e05100-0000-4000-8000-000000000010';
export const AI_ACTION_ATTEMPT_COUNT_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e05100-0000-4000-8000-000000000011';
export const AI_ACTION_RISK_LEVEL_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e05100-0000-4000-8000-000000000012';
export const AI_ACTION_WRITE_SET_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e05100-0000-4000-8000-000000000013';
export const AI_ACTION_EXPIRES_AT_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e05100-0000-4000-8000-000000000014';
export const AI_ACTION_POLICY_VERSION_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e05100-0000-4000-8000-000000000015';
export const AI_ACTION_ESTIMATED_COST_CREDITS_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e05100-0000-4000-8000-000000000016';

export const AI_ACTION_RISK_LEVEL_OPTIONS = Object.values(AiActionRiskLevel).map(
  (value, position) => ({
    id: `d1e05130-0000-4000-8000-${String(position + 1).padStart(12, '0')}`,
    value,
    label: value === 'BLOCKED' ? 'Bloqueada' : value,
    position,
    color:
      value === 'HIGH' || value === 'BLOCKED'
        ? ('red' as const)
        : value === 'MEDIUM'
          ? ('orange' as const)
          : ('green' as const),
  }),
);

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
    id: 'd1e05120-0000-4000-8000-000000000007',
    value: AiActionStatus.EXECUTING,
    label: 'Em execução',
    position: 3,
    color: 'yellow' as const,
  },
  {
    id: 'd1e05120-0000-4000-8000-000000000004',
    value: AiActionStatus.REJECTED,
    label: 'Rejeitada',
    position: 4,
    color: 'red' as const,
  },
  {
    id: 'd1e05120-0000-4000-8000-000000000005',
    value: AiActionStatus.EXECUTED,
    label: 'Executada',
    position: 5,
    color: 'green' as const,
  },
  {
    id: 'd1e05120-0000-4000-8000-000000000006',
    value: AiActionStatus.FAILED,
    label: 'Falhou',
    position: 6,
    color: 'red' as const,
  },
];

export const AiActionStandardObjectDefinition = {
  universalIdentifier: AI_ACTION_UNIVERSAL_IDENTIFIER,
  nameSingular: 'aiAction',
  namePlural: 'aiActions',
  labelSingular: 'Ação de IA',
  labelPlural: 'Ações de IA',
  description:
    'Proposta rastreável da IA com evidência, aprovação humana e recibo de execução.',
  icon: 'IconRobot',
  // Lifecycle fields are controlled by the governed propose/review/execute
  // endpoints. The generic record UI must not create or mutate an approval
  // receipt outside that state machine.
  isUICreatable: false,
  isUIEditable: false,
  labelIdentifierFieldMetadataUniversalIdentifier:
    AI_ACTION_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: AI_ACTION_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.TEXT,
      name: 'name',
      label: 'Título',
      icon: 'IconAbc',
    },
    {
      universalIdentifier: AI_ACTION_TYPE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.SELECT,
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
      type: FieldMetadataType.SELECT,
      name: 'status',
      label: 'Status',
      icon: 'IconProgress',
      defaultValue: `'${AiActionStatus.PENDING_APPROVAL}'`,
      options: AI_ACTION_STATUS_OPTIONS,
    },
    {
      universalIdentifier: AI_ACTION_CONFIDENCE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.NUMBER,
      name: 'confidence',
      label: 'Confiança (%)',
      icon: 'IconPercentage',
      isNullable: true,
    },
    {
      universalIdentifier: AI_ACTION_RATIONALE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.RICH_TEXT,
      name: 'rationale',
      label: 'Justificativa',
      icon: 'IconBrain',
      isNullable: true,
    },
    {
      universalIdentifier: AI_ACTION_PROPOSED_ACTION_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.RICH_TEXT,
      name: 'proposedAction',
      label: 'Ação proposta',
      icon: 'IconSparkles',
      isNullable: true,
    },
    {
      universalIdentifier: AI_ACTION_APPROVAL_NOTES_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.RICH_TEXT,
      name: 'approvalNotes',
      label: 'Notas da aprovação',
      icon: 'IconUserCheck',
      isNullable: true,
    },
    {
      universalIdentifier: AI_ACTION_REQUESTED_AT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.DATE_TIME,
      name: 'requestedAt',
      label: 'Solicitada em',
      icon: 'IconClock',
      isNullable: true,
    },
    {
      universalIdentifier: AI_ACTION_APPROVED_AT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.DATE_TIME,
      name: 'approvedAt',
      label: 'Aprovada em',
      icon: 'IconCalendarCheck',
      isNullable: true,
    },
    {
      universalIdentifier: AI_ACTION_EXECUTED_AT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.DATE_TIME,
      name: 'executedAt',
      label: 'Executada em',
      icon: 'IconPlayerPlay',
      isNullable: true,
    },
    {
      universalIdentifier:
        AI_ACTION_EXECUTION_RECEIPT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.RICH_TEXT,
      name: 'executionReceipt',
      label: 'Recibo de execução',
      icon: 'IconReceipt',
      isNullable: true,
    },
    {
      universalIdentifier:
        AI_ACTION_REQUIRES_APPROVAL_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.BOOLEAN,
      name: 'requiresApproval',
      label: 'Exige aprovação',
      icon: 'IconShieldCheck',
      defaultValue: true,
    },
    {
      universalIdentifier: AI_ACTION_IDEMPOTENCY_KEY_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.TEXT,
      name: 'idempotencyKey',
      label: 'Chave de idempotência',
      description:
        'Impede que a mesma evidência gere propostas duplicadas na fila de aprovação.',
      icon: 'IconFingerprint',
      isNullable: true,
      isUnique: true,
    },
    {
      universalIdentifier: AI_ACTION_CONTEXT_VERSION_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.TEXT,
      name: 'contextVersion',
      label: 'Versão do contexto da IA',
      description:
        'Identifica o manifesto operacional compilado usado para propor a ação.',
      icon: 'IconVersions',
      isNullable: true,
    },
    {
      universalIdentifier:
        AI_ACTION_EXECUTION_STARTED_AT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.DATE_TIME,
      name: 'executionStartedAt',
      label: 'Execução iniciada em',
      icon: 'IconPlayerPlay',
      isNullable: true,
    },
    {
      universalIdentifier: AI_ACTION_FAILURE_REASON_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.RICH_TEXT,
      name: 'failureReason',
      label: 'Motivo da falha',
      icon: 'IconAlertTriangle',
      isNullable: true,
    },
    {
      universalIdentifier: AI_ACTION_ATTEMPT_COUNT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.NUMBER,
      name: 'attemptCount',
      label: 'Tentativas de execução',
      icon: 'IconRepeat',
      defaultValue: 0,
    },
    {
      universalIdentifier: AI_ACTION_RISK_LEVEL_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.SELECT,
      name: 'riskLevel',
      label: 'Risco da ação',
      icon: 'IconShieldCheck',
      defaultValue: `'${AiActionRiskLevel.MEDIUM}'`,
      options: AI_ACTION_RISK_LEVEL_OPTIONS,
    },
    {
      universalIdentifier: AI_ACTION_WRITE_SET_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.RAW_JSON,
      name: 'writeSet',
      label: 'Escopo de escrita',
      description: 'Registros e operações que a ação está autorizada a alterar.',
      icon: 'IconLockAccess',
      isNullable: true,
    },
    {
      universalIdentifier: AI_ACTION_EXPIRES_AT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.DATE_TIME,
      name: 'expiresAt',
      label: 'Expira em',
      icon: 'IconClockCancel',
      isNullable: true,
    },
    {
      universalIdentifier: AI_ACTION_POLICY_VERSION_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.TEXT,
      name: 'policyVersion',
      label: 'Versão da política',
      icon: 'IconVersions',
      isNullable: true,
    },
    {
      universalIdentifier:
        AI_ACTION_ESTIMATED_COST_CREDITS_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.NUMBER,
      name: 'estimatedCostCredits',
      label: 'Custo estimado em créditos',
      icon: 'IconCoins',
      isNullable: true,
    },
  ],
} as const satisfies ObjectManifest;
