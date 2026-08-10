import { type ObjectManifest } from 'diex-shared/application';
import { FieldMetadataType } from 'diex-shared/types';

export enum WorkspaceContextStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export const WORKSPACE_CONTEXT_UNIVERSAL_IDENTIFIER =
  'd1e15000-0000-4000-8000-000000000001';
export const WORKSPACE_CONTEXT_NAME_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e15100-0000-4000-8000-000000000001';
export const WORKSPACE_CONTEXT_STATUS_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e15100-0000-4000-8000-000000000002';
export const WORKSPACE_CONTEXT_BUSINESS_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e15100-0000-4000-8000-000000000003';
export const WORKSPACE_CONTEXT_ICP_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e15100-0000-4000-8000-000000000004';
export const WORKSPACE_CONTEXT_TONE_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e15100-0000-4000-8000-000000000005';
export const WORKSPACE_CONTEXT_COMMERCIAL_RULES_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e15100-0000-4000-8000-000000000006';
export const WORKSPACE_CONTEXT_OBJECTIONS_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e15100-0000-4000-8000-000000000007';
export const WORKSPACE_CONTEXT_COMPETITORS_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e15100-0000-4000-8000-000000000008';
export const WORKSPACE_CONTEXT_FORBIDDEN_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e15100-0000-4000-8000-000000000009';
export const WORKSPACE_CONTEXT_REVIEWED_AT_FIELD_UNIVERSAL_IDENTIFIER =
  'd1e15100-0000-4000-8000-00000000000a';

export const DiexWorkspaceContextStandardObjectDefinition = {
  universalIdentifier: WORKSPACE_CONTEXT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'diexWorkspaceContext',
  namePlural: 'diexWorkspaceContexts',
  labelSingular: 'Contexto do workspace',
  labelPlural: 'Contexto do workspace',
  description:
    'Contexto comercial da empresa deste workspace, usado como base por toda IA — agentes internos e clientes MCP externos.',
  icon: 'IconBook2',
  isSearchable: true,
  labelIdentifierFieldMetadataUniversalIdentifier:
    WORKSPACE_CONTEXT_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: WORKSPACE_CONTEXT_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.TEXT,
      name: 'name',
      label: 'Nome',
      icon: 'IconAbc',
    },
    {
      universalIdentifier: WORKSPACE_CONTEXT_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.SELECT,
      name: 'status',
      label: 'Status',
      icon: 'IconProgress',
      defaultValue: `'${WorkspaceContextStatus.DRAFT}'`,
      options: [
        {
          id: 'd1e15110-0000-4000-8000-000000000001',
          value: WorkspaceContextStatus.DRAFT,
          label: 'Rascunho',
          position: 0,
          color: 'gray',
        },
        {
          id: 'd1e15110-0000-4000-8000-000000000002',
          value: WorkspaceContextStatus.ACTIVE,
          label: 'Ativo',
          position: 1,
          color: 'green',
        },
        {
          id: 'd1e15110-0000-4000-8000-000000000003',
          value: WorkspaceContextStatus.ARCHIVED,
          label: 'Arquivado',
          position: 2,
          color: 'orange',
        },
      ],
    },
    {
      universalIdentifier:
        WORKSPACE_CONTEXT_BUSINESS_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.RICH_TEXT,
      name: 'businessDescription',
      label: 'O que a empresa faz',
      description:
        'Atividade, mercado e forma de gerar receita. É a primeira coisa que a IA lê.',
      icon: 'IconBuildingSkyscraper',
      isNullable: true,
    },
    {
      universalIdentifier: WORKSPACE_CONTEXT_ICP_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.RICH_TEXT,
      name: 'idealCustomerProfile',
      label: 'Cliente ideal',
      description:
        'Porte, segmento, dor e gatilho de compra do cliente que a empresa atende melhor.',
      icon: 'IconTargetArrow',
      isNullable: true,
    },
    {
      universalIdentifier: WORKSPACE_CONTEXT_TONE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.RICH_TEXT,
      name: 'toneOfVoice',
      label: 'Tom de voz',
      description:
        'Como a empresa fala com o cliente. Governa qualquer rascunho gerado por IA.',
      icon: 'IconMessage',
      isNullable: true,
    },
    {
      universalIdentifier:
        WORKSPACE_CONTEXT_COMMERCIAL_RULES_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.RICH_TEXT,
      name: 'commercialRules',
      label: 'Regras comerciais',
      description:
        'Limites de desconto, prazos, condições de pagamento e o que exige aprovação humana.',
      icon: 'IconGavel',
      isNullable: true,
    },
    {
      universalIdentifier:
        WORKSPACE_CONTEXT_OBJECTIONS_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.RICH_TEXT,
      name: 'objectionPlaybook',
      label: 'Objeções e respostas',
      description:
        'Objeções recorrentes e a resposta que a empresa considera correta.',
      icon: 'IconShieldQuestion',
      isNullable: true,
    },
    {
      universalIdentifier:
        WORKSPACE_CONTEXT_COMPETITORS_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.RICH_TEXT,
      name: 'competitiveLandscape',
      label: 'Concorrência',
      description:
        'Concorrentes relevantes e o posicionamento da empresa diante deles.',
      icon: 'IconSwords',
      isNullable: true,
    },
    {
      universalIdentifier:
        WORKSPACE_CONTEXT_FORBIDDEN_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.RICH_TEXT,
      name: 'forbiddenClaims',
      label: 'O que nunca afirmar',
      description:
        'Promessas, garantias e comparações que a IA não pode fazer em nenhuma circunstância.',
      icon: 'IconForbid',
      isNullable: true,
    },
    {
      universalIdentifier:
        WORKSPACE_CONTEXT_REVIEWED_AT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldMetadataType.DATE_TIME,
      name: 'reviewedAt',
      label: 'Revisado em',
      description:
        'Contexto desatualizado degrada toda saída de IA; esta data mostra quando foi conferido.',
      icon: 'IconCalendarCheck',
      isNullable: true,
    },
  ],
} as const satisfies ObjectManifest;
