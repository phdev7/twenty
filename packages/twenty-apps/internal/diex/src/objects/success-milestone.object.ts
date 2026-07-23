import { defineObject, FieldType } from 'twenty-sdk/define';

export enum SuccessMilestoneCategory {
  ONBOARDING = 'ONBOARDING',
  ACTIVATION = 'ACTIVATION',
  ADOPTION = 'ADOPTION',
  VALUE = 'VALUE',
  EXPANSION = 'EXPANSION',
  RENEWAL = 'RENEWAL',
}

export enum SuccessMilestoneStatus {
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  BLOCKED = 'BLOCKED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export const SUCCESS_MILESTONE_UNIVERSAL_IDENTIFIER =
  'd1e04000-0000-4000-8000-000000000001';
export const SUCCESS_MILESTONE_NAME_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e04100-0000-4000-8000-000000000001';
export const SUCCESS_MILESTONE_CATEGORY_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e04100-0000-4000-8000-000000000002';
export const SUCCESS_MILESTONE_STATUS_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e04100-0000-4000-8000-000000000003';
export const SUCCESS_MILESTONE_DUE_AT_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e04100-0000-4000-8000-000000000004';
export const SUCCESS_MILESTONE_COMPLETED_AT_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e04100-0000-4000-8000-000000000005';
export const SUCCESS_MILESTONE_OUTCOME_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e04100-0000-4000-8000-000000000006';
export const SUCCESS_MILESTONE_EVIDENCE_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e04100-0000-4000-8000-000000000007';
export const SUCCESS_MILESTONE_IMPACT_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e04100-0000-4000-8000-000000000008';
export const SUCCESS_MILESTONE_LEGACY_DIEX_ID_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e04100-0000-4000-8000-000000000009';

export const SUCCESS_MILESTONE_STATUS_OPTIONS = [
  {
    id: 'd1e04120-0000-4000-8000-000000000001',
    value: SuccessMilestoneStatus.PLANNED,
    label: 'Planejado',
    position: 0,
    color: 'gray' as const,
  },
  {
    id: 'd1e04120-0000-4000-8000-000000000002',
    value: SuccessMilestoneStatus.IN_PROGRESS,
    label: 'Em andamento',
    position: 1,
    color: 'blue' as const,
  },
  {
    id: 'd1e04120-0000-4000-8000-000000000003',
    value: SuccessMilestoneStatus.BLOCKED,
    label: 'Bloqueado',
    position: 2,
    color: 'red' as const,
  },
  {
    id: 'd1e04120-0000-4000-8000-000000000004',
    value: SuccessMilestoneStatus.COMPLETED,
    label: 'Concluído',
    position: 3,
    color: 'green' as const,
  },
  {
    id: 'd1e04120-0000-4000-8000-000000000005',
    value: SuccessMilestoneStatus.CANCELLED,
    label: 'Cancelado',
    position: 4,
    color: 'orange' as const,
  },
];

export default defineObject({
  universalIdentifier: SUCCESS_MILESTONE_UNIVERSAL_IDENTIFIER,
  nameSingular: 'successMilestone',
  namePlural: 'successMilestones',
  labelSingular: 'Marco de sucesso',
  labelPlural: 'Marcos de sucesso',
  description:
    'Entrega ou resultado verificável dentro da jornada de sucesso do cliente.',
  icon: 'IconFlag3',
  labelIdentifierFieldMetadataUniversalIdentifier:
    SUCCESS_MILESTONE_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier:
        SUCCESS_MILESTONE_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'name',
      label: 'Nome',
      icon: 'IconAbc',
    },
    {
      universalIdentifier:
        SUCCESS_MILESTONE_CATEGORY_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.SELECT,
      name: 'category',
      label: 'Categoria',
      icon: 'IconCategory',
      options: [
        {
          id: 'd1e04110-0000-4000-8000-000000000001',
          value: SuccessMilestoneCategory.ONBOARDING,
          label: 'Onboarding',
          position: 0,
          color: 'blue',
        },
        {
          id: 'd1e04110-0000-4000-8000-000000000002',
          value: SuccessMilestoneCategory.ACTIVATION,
          label: 'Ativação',
          position: 1,
          color: 'sky',
        },
        {
          id: 'd1e04110-0000-4000-8000-000000000003',
          value: SuccessMilestoneCategory.ADOPTION,
          label: 'Adoção',
          position: 2,
          color: 'green',
        },
        {
          id: 'd1e04110-0000-4000-8000-000000000004',
          value: SuccessMilestoneCategory.VALUE,
          label: 'Valor',
          position: 3,
          color: 'purple',
        },
        {
          id: 'd1e04110-0000-4000-8000-000000000005',
          value: SuccessMilestoneCategory.EXPANSION,
          label: 'Expansão',
          position: 4,
          color: 'orange',
        },
        {
          id: 'd1e04110-0000-4000-8000-000000000006',
          value: SuccessMilestoneCategory.RENEWAL,
          label: 'Renovação',
          position: 5,
          color: 'yellow',
        },
      ],
    },
    {
      universalIdentifier:
        SUCCESS_MILESTONE_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.SELECT,
      name: 'status',
      label: 'Status',
      icon: 'IconProgress',
      defaultValue: `'${SuccessMilestoneStatus.PLANNED}'`,
      options: SUCCESS_MILESTONE_STATUS_OPTIONS,
    },
    {
      universalIdentifier:
        SUCCESS_MILESTONE_DUE_AT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE_TIME,
      name: 'dueAt',
      label: 'Prazo',
      icon: 'IconCalendarDue',
      isNullable: true,
    },
    {
      universalIdentifier:
        SUCCESS_MILESTONE_COMPLETED_AT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE_TIME,
      name: 'completedAt',
      label: 'Concluído em',
      icon: 'IconCalendarCheck',
      isNullable: true,
    },
    {
      universalIdentifier:
        SUCCESS_MILESTONE_OUTCOME_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.RICH_TEXT,
      name: 'outcome',
      label: 'Resultado',
      icon: 'IconTargetArrow',
      isNullable: true,
    },
    {
      universalIdentifier:
        SUCCESS_MILESTONE_EVIDENCE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.RICH_TEXT,
      name: 'evidence',
      label: 'Evidência',
      icon: 'IconFileCheck',
      isNullable: true,
    },
    {
      universalIdentifier:
        SUCCESS_MILESTONE_IMPACT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.RATING,
      name: 'impact',
      label: 'Impacto',
      icon: 'IconStar',
      isNullable: true,
      options: [
        {
          id: 'd1e04130-0000-4000-8000-000000000001',
          value: 'RATING_1',
          label: '1',
          position: 0,
        },
        {
          id: 'd1e04130-0000-4000-8000-000000000002',
          value: 'RATING_2',
          label: '2',
          position: 1,
        },
        {
          id: 'd1e04130-0000-4000-8000-000000000003',
          value: 'RATING_3',
          label: '3',
          position: 2,
        },
        {
          id: 'd1e04130-0000-4000-8000-000000000004',
          value: 'RATING_4',
          label: '4',
          position: 3,
        },
        {
          id: 'd1e04130-0000-4000-8000-000000000005',
          value: 'RATING_5',
          label: '5',
          position: 4,
        },
      ],
    },
    {
      universalIdentifier:
        SUCCESS_MILESTONE_LEGACY_DIEX_ID_FIELD_UNIVERSAL_IDENTIFIER,
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
