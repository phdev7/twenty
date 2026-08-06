import { type ObjectManifest } from 'twenty-shared/application';
import { DIEX_STANDARD_OBJECTS } from 'twenty-shared/metadata';
import { FieldMetadataType, TagColor } from 'twenty-shared/types';

export enum WorkspaceArchitectureArtifactType {
  OPERATION_PROFILE = 'OPERATION_PROFILE',
  BLUEPRINT = 'BLUEPRINT',
  CHANGE_SET = 'CHANGE_SET',
  SETUP_STATE = 'SETUP_STATE',
  FEEDBACK = 'FEEDBACK',
  TRAINING_EXAMPLE = 'TRAINING_EXAMPLE',
  EVALUATION_REPORT = 'EVALUATION_REPORT',
  MODEL_RELEASE = 'MODEL_RELEASE',
}

export enum WorkspaceArchitectureArtifactStatus {
  DRAFT = 'DRAFT',
  VALIDATING = 'VALIDATING',
  AWAITING_APPROVAL = 'AWAITING_APPROVAL',
  APPROVED = 'APPROVED',
  APPLYING = 'APPLYING',
  ACTIVE = 'ACTIVE',
  FAILED = 'FAILED',
  ROLLED_BACK = 'ROLLED_BACK',
  SUPERSEDED = 'SUPERSEDED',
  CANDIDATE = 'CANDIDATE',
  REJECTED = 'REJECTED',
}

export const WORKSPACE_ARCHITECTURE_ARTIFACT_UNIVERSAL_IDENTIFIER =
  'd1e18000-0000-4000-8000-000000000001';

// The field identifiers live in DIEX_STANDARD_OBJECTS, which is what the index
// builder resolves against. Deriving them from the object identifier instead
// produced the d1e18000 prefix while the registry declares d1e18100, so every
// field was created under an id no index could find and workspace creation
// threw before any schema was built.
const ARTIFACT_FIELDS =
  DIEX_STANDARD_OBJECTS.workspaceArchitectureArtifact.fields;

export const WORKSPACE_ARCHITECTURE_ARTIFACT_FIELD_IDS = {
  name: ARTIFACT_FIELDS.name.universalIdentifier,
  artifactKey: ARTIFACT_FIELDS.artifactKey.universalIdentifier,
  artifactType: ARTIFACT_FIELDS.artifactType.universalIdentifier,
  status: ARTIFACT_FIELDS.status.universalIdentifier,
  schemaVersion: ARTIFACT_FIELDS.schemaVersion.universalIdentifier,
  version: ARTIFACT_FIELDS.version.universalIdentifier,
  parentVersion: ARTIFACT_FIELDS.parentVersion.universalIdentifier,
  sourceDescription: ARTIFACT_FIELDS.sourceDescription.universalIdentifier,
  payload: ARTIFACT_FIELDS.payload.universalIdentifier,
  summary: ARTIFACT_FIELDS.summary.universalIdentifier,
  templateVersions: ARTIFACT_FIELDS.templateVersions.universalIdentifier,
  idempotencyKey: ARTIFACT_FIELDS.idempotencyKey.universalIdentifier,
  approvedAt: ARTIFACT_FIELDS.approvedAt.universalIdentifier,
  appliedAt: ARTIFACT_FIELDS.appliedAt.universalIdentifier,
  completedAt: ARTIFACT_FIELDS.completedAt.universalIdentifier,
  errorDetails: ARTIFACT_FIELDS.errorDetails.universalIdentifier,
  modelId: ARTIFACT_FIELDS.modelId.universalIdentifier,
  promptVersion: ARTIFACT_FIELDS.promptVersion.universalIdentifier,
  datasetVersion: ARTIFACT_FIELDS.datasetVersion.universalIdentifier,
  estimatedCostCents: ARTIFACT_FIELDS.estimatedCostCents.universalIdentifier,
  actualCostCents: ARTIFACT_FIELDS.actualCostCents.universalIdentifier,
} as const;

const artifactTypeOptions = Object.values(
  WorkspaceArchitectureArtifactType,
).map((value, position) => ({
  id: `d1e18110-0000-4000-8000-${String(position + 1).padStart(12, '0')}`,
  value,
  label: value.replace(/_/g, ' '),
  position,
  color: 'blue' as TagColor,
}));

const statusColors: Record<WorkspaceArchitectureArtifactStatus, TagColor> = {
  DRAFT: 'gray' as TagColor,
  VALIDATING: 'yellow' as TagColor,
  AWAITING_APPROVAL: 'orange' as TagColor,
  APPROVED: 'blue' as TagColor,
  APPLYING: 'yellow' as TagColor,
  ACTIVE: 'green' as TagColor,
  FAILED: 'red' as TagColor,
  ROLLED_BACK: 'purple' as TagColor,
  SUPERSEDED: 'gray' as TagColor,
  CANDIDATE: 'turquoise' as TagColor,
  REJECTED: 'red' as TagColor,
};

const artifactStatusOptions = Object.values(
  WorkspaceArchitectureArtifactStatus,
).map((value, position) => ({
  id: `d1e18200-0000-4000-8000-${String(position + 1).padStart(12, '0')}`,
  value,
  label: value.replace(/_/g, ' '),
  position,
  color: statusColors[value],
}));

export const WorkspaceArchitectureArtifactStandardObjectDefinition = {
  universalIdentifier: WORKSPACE_ARCHITECTURE_ARTIFACT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'workspaceArchitectureArtifact',
  namePlural: 'workspaceArchitectureArtifacts',
  labelSingular: 'Artefato de arquitetura',
  labelPlural: 'Artefatos de arquitetura',
  description:
    'Histórico interno e versionado de perfis, recomendações, aprovações e publicações do Arquiteto de Workspace.',
  icon: 'IconBuildingArch',
  isSearchable: true,
  isUICreatable: false,
  isUIEditable: false,
  labelIdentifierFieldMetadataUniversalIdentifier:
    WORKSPACE_ARCHITECTURE_ARTIFACT_FIELD_IDS.name,
  fields: [
    {
      universalIdentifier: WORKSPACE_ARCHITECTURE_ARTIFACT_FIELD_IDS.name,
      type: FieldMetadataType.TEXT,
      name: 'name',
      label: 'Nome',
      icon: 'IconAbc',
    },
    {
      universalIdentifier:
        WORKSPACE_ARCHITECTURE_ARTIFACT_FIELD_IDS.artifactKey,
      type: FieldMetadataType.TEXT,
      name: 'artifactKey',
      label: 'Chave do artefato',
      icon: 'IconKey',
      isUnique: true,
    },
    {
      universalIdentifier:
        WORKSPACE_ARCHITECTURE_ARTIFACT_FIELD_IDS.artifactType,
      type: FieldMetadataType.SELECT,
      name: 'artifactType',
      label: 'Tipo',
      icon: 'IconCategory',
      options: artifactTypeOptions,
    },
    {
      universalIdentifier: WORKSPACE_ARCHITECTURE_ARTIFACT_FIELD_IDS.status,
      type: FieldMetadataType.SELECT,
      name: 'status',
      label: 'Status',
      icon: 'IconProgress',
      defaultValue: `'${WorkspaceArchitectureArtifactStatus.DRAFT}'`,
      options: artifactStatusOptions,
    },
    {
      universalIdentifier:
        WORKSPACE_ARCHITECTURE_ARTIFACT_FIELD_IDS.schemaVersion,
      type: FieldMetadataType.TEXT,
      name: 'schemaVersion',
      label: 'Versão do schema',
      icon: 'IconVersions',
      defaultValue: "'1.0.0'",
    },
    {
      universalIdentifier: WORKSPACE_ARCHITECTURE_ARTIFACT_FIELD_IDS.version,
      type: FieldMetadataType.NUMBER,
      name: 'version',
      label: 'Versão',
      icon: 'IconVersions',
      defaultValue: 1,
    },
    {
      universalIdentifier:
        WORKSPACE_ARCHITECTURE_ARTIFACT_FIELD_IDS.parentVersion,
      type: FieldMetadataType.NUMBER,
      name: 'parentVersion',
      label: 'Versão anterior',
      icon: 'IconHistory',
      isNullable: true,
    },
    {
      universalIdentifier:
        WORKSPACE_ARCHITECTURE_ARTIFACT_FIELD_IDS.sourceDescription,
      type: FieldMetadataType.RICH_TEXT,
      name: 'sourceDescription',
      label: 'Descrição original',
      icon: 'IconMessage',
      isNullable: true,
    },
    {
      universalIdentifier: WORKSPACE_ARCHITECTURE_ARTIFACT_FIELD_IDS.payload,
      type: FieldMetadataType.RAW_JSON,
      name: 'payload',
      label: 'Conteúdo estruturado',
      icon: 'IconBraces',
    },
    {
      universalIdentifier: WORKSPACE_ARCHITECTURE_ARTIFACT_FIELD_IDS.summary,
      type: FieldMetadataType.RICH_TEXT,
      name: 'summary',
      label: 'Resumo',
      icon: 'IconFileDescription',
      isNullable: true,
    },
    {
      universalIdentifier:
        WORKSPACE_ARCHITECTURE_ARTIFACT_FIELD_IDS.templateVersions,
      type: FieldMetadataType.RAW_JSON,
      name: 'templateVersions',
      label: 'Versões dos templates',
      icon: 'IconTemplate',
      isNullable: true,
    },
    {
      universalIdentifier:
        WORKSPACE_ARCHITECTURE_ARTIFACT_FIELD_IDS.idempotencyKey,
      type: FieldMetadataType.TEXT,
      name: 'idempotencyKey',
      label: 'Chave de idempotência',
      icon: 'IconFingerprint',
      isUnique: true,
      isNullable: true,
    },
    {
      universalIdentifier: WORKSPACE_ARCHITECTURE_ARTIFACT_FIELD_IDS.approvedAt,
      type: FieldMetadataType.DATE_TIME,
      name: 'approvedAt',
      label: 'Aprovado em',
      icon: 'IconCircleCheck',
      isNullable: true,
    },
    {
      universalIdentifier: WORKSPACE_ARCHITECTURE_ARTIFACT_FIELD_IDS.appliedAt,
      type: FieldMetadataType.DATE_TIME,
      name: 'appliedAt',
      label: 'Aplicado em',
      icon: 'IconPlayerPlay',
      isNullable: true,
    },
    {
      universalIdentifier:
        WORKSPACE_ARCHITECTURE_ARTIFACT_FIELD_IDS.completedAt,
      type: FieldMetadataType.DATE_TIME,
      name: 'completedAt',
      label: 'Concluído em',
      icon: 'IconFlag',
      isNullable: true,
    },
    {
      universalIdentifier:
        WORKSPACE_ARCHITECTURE_ARTIFACT_FIELD_IDS.errorDetails,
      type: FieldMetadataType.RICH_TEXT,
      name: 'errorDetails',
      label: 'Erro',
      icon: 'IconAlertTriangle',
      isNullable: true,
    },
    {
      universalIdentifier: WORKSPACE_ARCHITECTURE_ARTIFACT_FIELD_IDS.modelId,
      type: FieldMetadataType.TEXT,
      name: 'modelId',
      label: 'Modelo',
      icon: 'IconRobot',
      isNullable: true,
    },
    {
      universalIdentifier:
        WORKSPACE_ARCHITECTURE_ARTIFACT_FIELD_IDS.promptVersion,
      type: FieldMetadataType.TEXT,
      name: 'promptVersion',
      label: 'Versão do prompt',
      icon: 'IconMessageCode',
      isNullable: true,
    },
    {
      universalIdentifier:
        WORKSPACE_ARCHITECTURE_ARTIFACT_FIELD_IDS.datasetVersion,
      type: FieldMetadataType.TEXT,
      name: 'datasetVersion',
      label: 'Versão do dataset',
      icon: 'IconDatabase',
      isNullable: true,
    },
    {
      universalIdentifier:
        WORKSPACE_ARCHITECTURE_ARTIFACT_FIELD_IDS.estimatedCostCents,
      type: FieldMetadataType.NUMBER,
      name: 'estimatedCostCents',
      label: 'Custo estimado em centavos',
      icon: 'IconCoin',
      isNullable: true,
    },
    {
      universalIdentifier:
        WORKSPACE_ARCHITECTURE_ARTIFACT_FIELD_IDS.actualCostCents,
      type: FieldMetadataType.NUMBER,
      name: 'actualCostCents',
      label: 'Custo real em centavos',
      icon: 'IconCoin',
      isNullable: true,
    },
  ],
} as const satisfies ObjectManifest;
