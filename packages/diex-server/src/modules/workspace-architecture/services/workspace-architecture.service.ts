import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { createHash } from 'node:crypto';
import { type LanguageModelUsage, Output, generateText } from 'ai';
import { isDefined } from 'diex-shared/utils';
import { type Repository } from 'typeorm';
import { v4 } from 'uuid';

import { BillingUsageService } from 'src/engine/core-modules/billing/services/billing-usage.service';
import { CacheLockService } from 'src/engine/core-modules/cache-lock/cache-lock.service';
import { CreateManyRecordsService } from 'src/engine/core-modules/record-crud/services/create-many-records.service';
import { DeleteRecordService } from 'src/engine/core-modules/record-crud/services/delete-record.service';
import { FindRecordsService } from 'src/engine/core-modules/record-crud/services/find-records.service';
import { type ObjectRecordProperties } from 'src/engine/core-modules/record-crud/types/object-record-properties.type';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { UsageOperationType } from 'src/engine/core-modules/usage/enums/usage-operation-type.enum';
import { getWorkspaceAuthContext } from 'src/engine/core-modules/auth/storage/workspace-auth-context.storage';
import { AiBillingService } from 'src/engine/metadata-modules/ai/ai-billing/services/ai-billing.service';
import { AiModelRegistryService } from 'src/engine/metadata-modules/ai/ai-models/services/ai-model-registry.service';
import { FieldMetadataService } from 'src/engine/metadata-modules/field-metadata/services/field-metadata.service';
import { WorkspaceManyOrAllFlatEntityMapsCacheService } from 'src/engine/metadata-modules/flat-entity/services/workspace-many-or-all-flat-entity-maps-cache.service';
import { ObjectMetadataService } from 'src/engine/metadata-modules/object-metadata/object-metadata.service';
import { GlobalWorkspaceOrmManager } from 'src/engine/diex-orm/global-workspace-datasource/global-workspace-orm.manager';
import { type WorkspaceRepository } from 'src/engine/diex-orm/repository/workspace.repository';
import { buildSystemAuthContext } from 'src/engine/diex-orm/utils/build-system-auth-context.util';
import { type OfferWorkspaceEntity } from 'src/modules/commercial-intelligence/standard-objects/offer.workspace-entity';
import { OfferStatus } from 'src/modules/commercial-intelligence/standard-objects/offer.standard-object-definition';
import { type DiexWorkspaceContextWorkspaceEntity } from 'src/modules/workspace-context/standard-objects/diex-workspace-context.workspace-entity';
import { WorkspaceContextStatus } from 'src/modules/workspace-context/standard-objects/diex-workspace-context.standard-object-definition';
import {
  WORKSPACE_TEMPLATE_BY_ID,
  WORKSPACE_TEMPLATE_REGISTRY,
} from 'src/modules/workspace-architecture/constants/workspace-template-registry.constant';
import {
  WorkspaceArchitectureArtifactStatus,
  WorkspaceArchitectureArtifactType,
} from 'src/modules/workspace-architecture/standard-objects/workspace-architecture-artifact.standard-object-definition';
import { type WorkspaceArchitectureArtifactWorkspaceEntity } from 'src/modules/workspace-architecture/standard-objects/workspace-architecture-artifact.workspace-entity';
import {
  type WorkspaceBlueprint,
  type WorkspaceBlueprintComponent,
  workspaceBlueprintSchema,
} from 'src/modules/workspace-architecture/types/workspace-blueprint.schema';
import {
  type WorkspaceChangeOperation,
  type WorkspaceChangeSet,
  workspaceChangeSetSchema,
} from 'src/modules/workspace-architecture/types/workspace-change-set.schema';
import {
  type WorkspaceOperationProfile,
  workspaceOperationProfileSchema,
} from 'src/modules/workspace-architecture/types/workspace-operation-profile.schema';
import {
  type WorkspaceOperationManifest,
  workspaceOperationManifestSchema,
} from 'src/modules/workspace-architecture/types/workspace-operation-manifest.schema';
import {
  type WorkspacePageCatalogItem,
  type WorkspacePageAction,
  type WorkspacePageBlock,
  type WorkspacePageCatalogState,
  type WorkspacePageBlockType,
  type WorkspacePageDataContract,
  type WorkspacePageRenderer,
  workspacePageBlockSchema,
  workspacePageCatalogItemSchema,
  workspacePageCatalogStateSchema,
} from 'src/modules/workspace-architecture/types/workspace-page-catalog.schema';
import {
  buildWorkspacePageActions,
  inferWorkspacePageDataContracts,
  WORKSPACE_PAGE_CONTRACT_VERSION,
  WORKSPACE_PAGE_COMPONENT_REGISTRY,
  type WorkspacePageMetadataObject,
} from 'src/modules/workspace-architecture/types/workspace-page-component-contracts';
import {
  deriveWorkspaceOnboardingJourney,
  type WorkspaceOnboardingEvidence,
  type WorkspaceOnboardingEvidenceMilestone,
  workspaceOnboardingJourneySchema,
  workspaceOnboardingEvidenceSchema,
} from 'src/modules/workspace-architecture/types/workspace-onboarding-evidence.schema';
import {
  DEFAULT_WORKSPACE_AI_POLICY,
  type WorkspaceAiPolicy,
  type WorkspaceAiPolicyUpdate,
  workspaceAiPolicySchema,
} from 'src/modules/workspace-architecture/types/workspace-ai-policy.schema';
import {
  type WorkspaceImportPlan,
  workspaceImportPlanSchema,
} from 'src/modules/workspace-architecture/types/workspace-import-plan.schema';
import {
  type WorkspaceImportBatch,
  workspaceImportBatchSchema,
} from 'src/modules/workspace-architecture/types/workspace-import-batch.schema';
import {
  type WorkspaceTemplateComponent,
  type WorkspaceTemplateDefinition,
} from 'src/modules/workspace-architecture/types/workspace-template.type';
import {
  buildWorkspaceReadinessPack,
  type WorkspaceReadinessCriterion,
  type WorkspaceReadinessPack,
} from 'src/modules/workspace-architecture/types/workspace-readiness-pack';
import {
  type WorkspaceDeclarativeMaterializationStatus,
  WorkspaceDeclarativeAdapterRegistry,
} from 'src/modules/workspace-architecture/services/workspace-declarative-adapter.registry';
import {
  type GeneratedWorkspaceContext,
  generatedWorkspaceContextSchema,
  normalizeGeneratedWorkspaceContext,
} from 'src/engine/core-modules/onboarding/types/generated-workspace-context.schema';

type ArtifactPayload =
  | WorkspaceOperationProfile
  | WorkspaceBlueprint
  | WorkspaceChangeSet
  | WorkspacePageCatalogState
  | WorkspaceOnboardingEvidence
  | WorkspaceAiPolicy
  | WorkspaceImportBatch
  | Record<string, unknown>;

type ArchitectureArtifactInput = {
  artifactType: WorkspaceArchitectureArtifactType;
  status: WorkspaceArchitectureArtifactStatus;
  version: number;
  payload: ArtifactPayload;
  name: string;
  summary: string;
  sourceDescription?: string;
  parentVersion?: number;
  idempotencyKey?: string;
  templateVersions?: Record<string, string>;
  modelId?: string;
  promptVersion?: string;
  datasetVersion?: string;
};

export type WorkspaceCustomPageBlockInput = {
  key?: string;
  label: string;
  type?: WorkspacePageBlockType;
  description?: string;
  dataSources?: string[];
  dataContracts?: WorkspacePageDataContract[];
  actions?: WorkspacePageAction[];
  actionLabel?: string;
  actionRoute?: string;
  configuration?: Record<string, unknown>;
};

export type WorkspacePageDataSource = {
  contractKey: string;
  source: string;
  kind: WorkspacePageDataContract['kind'];
  objectName: string | null;
  dataClassification: WorkspacePageDataContract['dataClassification'];
  records: unknown[];
  count: number | null;
  returnedCount: number;
  totalCount: number | null;
  isPartial: boolean;
  queriedAt: string;
  sourceUpdatedAt: string | null;
  freshnessStatus: 'LIVE' | 'PARTIAL' | 'UNAVAILABLE' | 'NOT_APPLICABLE';
  fallback: string;
  error: string | null;
};

export type WorkspacePageDataResponse = {
  pageKey: string;
  contractVersion: string;
  generatedAt: string;
  isPartial: boolean;
  hasErrors: boolean;
  sources: WorkspacePageDataSource[];
};

const normalize = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const normalizeImportHeader = (value: string): string =>
  normalize(value).replace(/[^a-z0-9]/g, '');

const normalizeImportHeaders = (headers: string[]): string[] => {
  const normalizedHeaders = headers.map((header) => header.trim());
  const tokens = normalizedHeaders.map(normalizeImportHeader);

  if (normalizedHeaders.some((header, index) => !header || !tokens[index])) {
    throw new Error('A importação contém uma coluna sem nome válido.');
  }

  if (new Set(tokens).size !== tokens.length) {
    throw new Error(
      'A importação contém cabeçalhos duplicados ou ambíguos. Renomeie as colunas e gere uma nova prévia.',
    );
  }

  return normalizedHeaders;
};

const readImportRowValue = (
  row: Record<string, unknown>,
  sourceHeader: string,
): unknown => {
  if (Object.prototype.hasOwnProperty.call(row, sourceHeader)) {
    return row[sourceHeader];
  }

  return Object.entries(row).find(
    ([header]) => header.trim() === sourceHeader,
  )?.[1];
};

const tokenize = (value: string): string[] =>
  normalize(value)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 0);

const includesCriterion = (tokens: string[], criterion: string): boolean => {
  const criterionTokens = tokenize(criterion);

  return (
    criterionTokens.length > 0 &&
    tokens.some((_, index) =>
      criterionTokens.every(
        (token, offset) => tokens[index + offset] === token,
      ),
    )
  );
};

const DIEX_CORE_PAGE_KEYS = new Set([
  'inbox-commercial',
  'commercial-intelligence',
  'calendar',
  'first-steps',
]);

const DIEX_ADAPTIVE_PAGE_KEYS = new Set([
  ...DIEX_CORE_PAGE_KEYS,
  'customer-success-center',
  'customer-success-operations',
  'renewal-operations',
  'ai-governance-operations',
]);

const DIEX_NATIVE_ROUTE_BY_KEY: Record<string, string> = {
  'inbox-commercial': '/inbox',
  'commercial-intelligence': '/diex/commercial-intelligence',
  calendar: '/diex/calendar',
  'first-steps': '/diex/first-steps',
  'customer-success-center': '/diex/customer-success',
  'customer-success-operations': '/diex/customer-success',
  'renewal-operations': '/diex/renewals',
  'ai-governance-operations': '/diex/ai-command-center',
};

const toPageSlug = (value: string): string =>
  normalize(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'pagina-operacional';

const adaptOptionalChannelDataSources = (dataSources: string[]): string[] =>
  dataSources.map((source) =>
    normalize(source) === 'whatsapp' ? 'canal principal' : source,
  );

const toPageRoute = (
  key: string,
  configuration?: Record<string, unknown>,
): string => {
  const configuredRoute = configuration?.route;

  if (DIEX_ADAPTIVE_PAGE_KEYS.has(key)) {
    return `/diex/pages/${encodeURIComponent(key)}`;
  }

  return typeof configuredRoute === 'string' && configuredRoute.startsWith('/')
    ? configuredRoute
    : `/diex/pages/${encodeURIComponent(key)}`;
};

const readConfigurationString = (
  configuration: Record<string, unknown> | undefined,
  key: string,
): string | null => {
  const value = configuration?.[key];

  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : null;
};

const toNativePageRoute = (
  key: string,
  configuration?: Record<string, unknown>,
): string | null =>
  readConfigurationString(configuration, 'nativeRoute') ??
  DIEX_NATIVE_ROUTE_BY_KEY[key] ??
  null;

const readConfigurationStrings = (
  configuration: Record<string, unknown> | undefined,
  key: string,
): string[] => {
  const value = configuration?.[key];

  return Array.isArray(value)
    ? value.filter(
        (item): item is string =>
          typeof item === 'string' && item.trim().length > 0,
      )
    : [];
};

const UNIVERSAL_OPERATION_OBJECT_NAMES = new Set([
  'person',
  'company',
  'opportunity',
  'task',
  'inboxConversation',
  'diexWorkspaceContext',
]);

const getAdaptiveDefaultDataSources = (
  metadataObjects: WorkspacePageMetadataObject[],
  pageContext: string,
): string[] => {
  const pageTokens = new Set(
    tokenize(pageContext).filter(
      (token) =>
        token.length >= 3 &&
        ![
          'acao',
          'acoes',
          'dados',
          'gestao',
          'operacao',
          'operacional',
          'pagina',
          'proxima',
          'proximo',
          'visao',
        ].includes(token),
    ),
  );
  const customObjects = metadataObjects.filter(
    ({ isCustom, nameSingular }) =>
      isCustom || !UNIVERSAL_OPERATION_OBJECT_NAMES.has(nameSingular),
  );
  const scoredObjects = customObjects
    .map((object, sourcePosition) => {
      const objectTokens = new Set(
        tokenize(
          `${object.nameSingular} ${object.namePlural} ${object.labelSingular}`,
        ),
      );
      const score = [...pageTokens].reduce(
        (total, pageToken) =>
          total +
          ([...objectTokens].some(
            (objectToken) =>
              objectToken === pageToken ||
              (pageToken.length >= 4 &&
                objectToken.length >= 4 &&
                (objectToken.startsWith(pageToken.slice(0, 4)) ||
                  pageToken.startsWith(objectToken.slice(0, 4)))),
          )
            ? 1
            : 0),
        0,
      );

      return { object, score, sourcePosition };
    })
    .sort(
      (left, right) =>
        right.score - left.score || left.sourcePosition - right.sourcePosition,
    );
  const semanticMatches = scoredObjects.filter(({ score }) => score > 0);
  const customSources = [
    ...new Set(
      semanticMatches
        .map(({ object }) => object.labelSingular || object.nameSingular)
        .filter((value) => value.trim().length > 0),
    ),
  ].slice(0, 4);

  return customSources.length > 0
    ? [...customSources, 'tarefas']
    : ['contatos', 'empresas', 'oportunidades', 'tarefas'];
};

const PAGE_RENDERERS = new Set([
  'INBOX',
  'DASHBOARD',
  'PIPELINE',
  'CALENDAR',
  'OPERATIONS',
  'CUSTOM',
]);

const PAGE_BLOCK_TYPES = new Set([
  'KPI',
  'LIST',
  'PIPELINE',
  'INBOX',
  'CALENDAR',
  'TIMELINE',
  'CHECKLIST',
  'AI_SUMMARY',
]);

const toCamelCase = (value: string): string =>
  value
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, character: string) =>
      character.toUpperCase(),
    )
    .replace(/^[A-Z]/, (character) => character.toLowerCase());

@Injectable()
export class WorkspaceArchitectureService {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    private readonly flatEntityMapsCacheService: WorkspaceManyOrAllFlatEntityMapsCacheService,
    private readonly objectMetadataService: ObjectMetadataService,
    private readonly cacheLockService: CacheLockService,
    private readonly aiBillingService: AiBillingService,
    private readonly aiModelRegistryService: AiModelRegistryService,
    private readonly billingUsageService: BillingUsageService,
    private readonly fieldMetadataService: FieldMetadataService,
    private readonly declarativeAdapterRegistry: WorkspaceDeclarativeAdapterRegistry,
    private readonly createManyRecordsService: CreateManyRecordsService,
    private readonly deleteRecordService: DeleteRecordService,
    private readonly findRecordsService: FindRecordsService,
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
  ) {}

  /**
   * One extractor is shared by the onboarding endpoint and the architecture
   * tools. This prevents the MCP/AI path from silently falling back to a
   * generic B2B profile while the UI uses a different contract.
   */
  async generateWorkspaceContext({
    workspaceId,
    description,
    modelId,
    commercialGoal,
    userWorkspaceId,
  }: {
    workspaceId: string;
    description: string;
    modelId?: string;
    commercialGoal?: string | null;
    userWorkspaceId?: string | null;
  }): Promise<{
    generatedContext: GeneratedWorkspaceContext;
    operationProfile: WorkspaceOperationProfile;
    modelId: string;
  }> {
    const normalizedDescription = description.trim();

    if (normalizedDescription.length < 20) {
      throw new Error(
        'Descreva a operação com pelo menos 20 caracteres para gerar uma estrutura confiável.',
      );
    }

    await this.aiBillingService.assertWorkspaceCanUseAi(workspaceId);
    await this.billingUsageService.hasAvailableCreditsOrThrow(workspaceId);

    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
    });
    const resolvedModelId =
      modelId ??
      workspace?.fastModel ??
      this.aiModelRegistryService.getDefaultSpeedModel().modelId;

    if (workspace) {
      this.aiModelRegistryService.validateModelAvailability(
        resolvedModelId,
        workspace,
      );
    }

    const primaryChannel = workspace?.onboardingPrimaryChannel
      ?.trim()
      .toUpperCase();
    const primaryChannelLabel =
      primaryChannel === 'WHATSAPP'
        ? 'WhatsApp'
        : primaryChannel === 'EMAIL'
          ? 'E-mail'
          : primaryChannel === 'IMPORT'
            ? 'Importação de contatos e oportunidades'
            : primaryChannel === 'MANUAL'
              ? 'Cadastro manual sem integração obrigatória'
              : 'a definir';

    const registeredModel =
      await this.aiModelRegistryService.resolveModelForAgent({
        modelId: resolvedModelId,
      });
    let usage: LanguageModelUsage | undefined;

    try {
      const result = await generateText({
        model: registeredModel.model,
        system: [
          'Você é o Arquiteto de Operação do Diex.',
          'Conduza uma entrevista curta e transforme a resposta livre em um perfil operacional estruturado para qualquer nicho.',
          'Extraia somente fatos presentes no texto. Não invente preços, margens, concorrentes, garantias, metas, canais ou regras.',
          'Quando uma informação relevante não estiver comprovada, use null ou lista vazia e registre a lacuna em unconfirmedInformation.',
          'Use hypotheses apenas para inferências reversíveis e sempre escreva a hipótese como hipótese.',
          'Dê prioridade a produtos e ofertas, público ideal, aquisição, processo de atendimento ou vendas, ciclo, objeções, provas, CTA, tom de voz, regras da operação, promessas proibidas, responsáveis, metas, SLA e integrações.',
          'Descreva capacidades que possam orientar objetos, campos, pipeline, páginas, métricas, automações e permissões sem prender a empresa a um nicho fixo.',
          'A recomendação deve ser útil para gerar a primeira entrada, o primeiro registro e a próxima ação, mas nunca deve fingir que esses eventos já aconteceram.',
          'Responda em português do Brasil, com texto objetivo.',
        ].join(' '),
        prompt: [
          `Objetivo prioritário selecionado: ${commercialGoal?.trim() || 'a definir'}`,
          `Forma principal de entrada escolhida: ${primaryChannelLabel}`,
          'Descrição da operação fornecida pelo cliente:',
          normalizedDescription,
          'Antes de estruturar, identifique mentalmente as lacunas que mudariam a configuração. Não faça perguntas no lugar do JSON; registre as perguntas objetivas em unconfirmedInformation.',
        ].join('\n\n'),
        output: Output.object({ schema: generatedWorkspaceContextSchema }),
      });

      usage = result.usage;

      if (!isDefined(result.output)) {
        throw new Error('A IA não retornou o contexto operacional.');
      }

      const operationProfile = normalizeGeneratedWorkspaceContext(
        result.output,
        normalizedDescription,
      );

      if (primaryChannel === 'WHATSAPP' || primaryChannel === 'EMAIL') {
        operationProfile.acquisitionChannels = [
          ...new Set([
            ...operationProfile.acquisitionChannels,
            primaryChannelLabel,
          ]),
        ];
        operationProfile.requiredIntegrations = [
          ...new Set([
            ...operationProfile.requiredIntegrations,
            primaryChannelLabel,
          ]),
        ];
      } else if (primaryChannel === 'IMPORT') {
        operationProfile.operationalCapabilities = [
          ...new Set([
            ...operationProfile.operationalCapabilities,
            primaryChannelLabel,
          ]),
        ];
      }

      return {
        generatedContext: result.output,
        operationProfile,
        modelId: registeredModel.modelId,
      };
    } finally {
      if (isDefined(usage)) {
        void this.aiBillingService.calculateAndBillUsage(
          registeredModel.modelId,
          {
            usage,
            cacheCreationTokens: usage.inputTokenDetails?.cacheWriteTokens ?? 0,
          },
          workspaceId,
          UsageOperationType.AI_WORKFLOW_TOKEN,
          null,
          userWorkspaceId,
        );
      }
    }
  }

  listTemplates() {
    return WORKSPACE_TEMPLATE_REGISTRY.map((template) => ({
      id: template.id,
      name: template.name,
      version: template.version,
      kind: template.kind,
      description: template.description,
      activationCriteria: template.activationCriteria,
      dependencies: template.dependencies,
      conflicts: template.conflicts,
      readinessCriteria: template.readinessCriteria,
      pages: template.pages.map(({ key, label, configuration }) => ({
        key,
        label,
        route: configuration?.route ?? `/diex/pages/${encodeURIComponent(key)}`,
        nativeRoute: configuration?.nativeRoute ?? null,
        renderer: configuration?.renderer ?? 'OPERATIONS',
        navigationGroup: configuration?.navigationGroup ?? 'Operação',
        capabilities: configuration?.capabilities ?? [],
      })),
      blocks: template.blocks.map(({ key, label, configuration }) => ({
        key,
        label,
        pageKey: configuration?.pageKey ?? null,
        type: configuration?.type ?? 'LIST',
      })),
    }));
  }

  async createInitialArchitecture({
    workspaceId,
    sourceDescription,
    operationProfile,
    modelId,
    commercialGoal,
  }: {
    workspaceId: string;
    sourceDescription: string;
    operationProfile: WorkspaceOperationProfile;
    modelId: string;
    commercialGoal?: string | null;
  }): Promise<{ profileVersion: number; blueprint: WorkspaceBlueprint }> {
    const validatedProfile =
      workspaceOperationProfileSchema.parse(operationProfile);
    const profileVersion = await this.getNextVersion(
      workspaceId,
      WorkspaceArchitectureArtifactType.OPERATION_PROFILE,
    );

    await this.persistArtifact(workspaceId, {
      artifactType: WorkspaceArchitectureArtifactType.OPERATION_PROFILE,
      status: WorkspaceArchitectureArtifactStatus.ACTIVE,
      version: profileVersion,
      name: `Perfil operacional v${profileVersion}`,
      summary: this.summarizeProfile(validatedProfile),
      sourceDescription,
      payload: validatedProfile,
      modelId,
      promptVersion: 'workspace-operation-profile@1.1.0',
    });

    const blueprint = await this.recommendBlueprint({
      workspaceId,
      operationProfile: validatedProfile,
      profileVersion,
      commercialGoal,
    });

    return { profileVersion, blueprint };
  }

  async recommendBlueprint({
    workspaceId,
    operationProfile,
    profileVersion,
    commercialGoal,
  }: {
    workspaceId: string;
    operationProfile: WorkspaceOperationProfile;
    profileVersion: number;
    commercialGoal?: string | null;
  }): Promise<WorkspaceBlueprint> {
    const version = await this.getNextVersion(
      workspaceId,
      WorkspaceArchitectureArtifactType.BLUEPRINT,
    );
    const selectedTemplateIds = this.selectTemplateIds(operationProfile);
    const selectedTemplates = selectedTemplateIds.map((id) => {
      const template = WORKSPACE_TEMPLATE_BY_ID.get(id);

      if (!template) {
        throw new Error(`Workspace template ${id} is not registered.`);
      }

      return template;
    });
    const selectionCorpus = tokenize(JSON.stringify(operationProfile));
    const selectionSegmentCorpus = tokenize(
      [operationProfile.segment ?? '', ...operationProfile.businessModels].join(
        ' ',
      ),
    );
    const selectionEvidence = (template: WorkspaceTemplateDefinition) => {
      const matchedCriteria = template.activationCriteria.filter((criterion) =>
        includesCriterion(selectionCorpus, criterion),
      );
      const matchedSegments = template.compatibleSegments.filter(
        (segment) =>
          segment === '*' || includesCriterion(selectionSegmentCorpus, segment),
      );
      const excludedBy = (template.exclusionCriteria ?? []).filter(
        (criterion) => includesCriterion(selectionCorpus, criterion),
      );
      const isDependency = template.dependencies.some((dependency) =>
        selectedTemplateIds.includes(dependency),
      );
      const confidence =
        template.kind === 'BASE'
          ? 100
          : Math.round(
              Math.min(
                100,
                Math.max(
                  35,
                  (matchedCriteria.length > 0 ? 60 : 0) +
                    (matchedSegments.length > 0 ? 20 : 0) +
                    (isDependency ? 15 : 0),
                ),
              ),
            );

      return {
        matchedCriteria,
        matchedSegments,
        excludedBy,
        confidence,
        requiresConfirmation:
          template.id === 'diex.business.healthcare-clinic' || confidence < 60,
      };
    };
    const compose = (
      key: keyof Pick<
        (typeof selectedTemplates)[number],
        | 'objects'
        | 'fields'
        | 'relations'
        | 'views'
        | 'pipelines'
        | 'pages'
        | 'blocks'
        | 'dashboards'
        | 'automations'
        | 'roles'
        | 'integrations'
      >,
    ) => this.composeComponents(selectedTemplates, key);
    const recommendedPipelineStages = (
      operationProfile.customerJourneyStages.length > 0
        ? operationProfile.customerJourneyStages
        : ['Entrada', 'Qualificação', 'Proposta', 'Negociação', 'Resultado']
    ).slice(0, 10);
    const pipelines = compose('pipelines').map((pipeline) => ({
      ...pipeline,
      configuration: {
        ...(pipeline.configuration ?? {}),
        stages:
          Array.isArray(pipeline.configuration?.stages) &&
          pipeline.configuration.stages.length > 0
            ? pipeline.configuration.stages
            : recommendedPipelineStages,
      },
    }));
    const components = {
      objects: compose('objects'),
      fields: compose('fields'),
      relations: compose('relations'),
      pipelines,
      pages: compose('pages'),
      blocks: compose('blocks'),
      views: compose('views'),
      dashboards: compose('dashboards'),
      automations: compose('automations'),
      roles: compose('roles'),
      integrations: compose('integrations'),
    };
    const metrics = [
      ...new Set(selectedTemplates.flatMap(({ metrics: values }) => values)),
    ];
    const permissions = [
      ...new Set(
        selectedTemplates.flatMap(({ permissions: values }) => values),
      ),
    ];
    const operationalRules = [
      ...new Set(
        selectedTemplates.flatMap(({ operationalRules: values }) => values),
      ),
    ];
    const glossary = Object.fromEntries(
      selectedTemplates.flatMap(({ glossary: values }) =>
        Object.entries(values),
      ),
    );
    const operationManifest = this.buildOperationManifest({
      version,
      profileVersion,
      operationProfile,
      commercialGoal,
      selectedTemplates,
      components,
      metrics,
      permissions,
      operationalRules,
      glossary,
    });
    const blueprint = workspaceBlueprintSchema.parse({
      id: v4(),
      version,
      status: 'AWAITING_APPROVAL',
      profileVersion,
      operationProfile,
      operationManifest,
      selectedTemplates: selectedTemplates.map((template) => {
        const evidence = selectionEvidence(template);

        return {
          id: template.id,
          version: template.version,
          reason:
            template.kind === 'BASE'
              ? 'Fundação obrigatória do Diex CRM.'
              : evidence.matchedCriteria.length > 0
                ? `Compatível com evidências da operação: ${evidence.matchedCriteria.slice(0, 3).join(', ')}.`
                : `Incluído como dependência estrutural da operação: ${template.dependencies.slice(0, 3).join(', ')}.`,
          confidence: evidence.confidence,
          optional: template.kind === 'CAPABILITY',
          matchedCriteria: evidence.matchedCriteria,
          matchedSegments: evidence.matchedSegments,
          excludedBy: evidence.excludedBy,
          requiresConfirmation: evidence.requiresConfirmation,
        };
      }),
      objects: components.objects,
      fields: components.fields,
      relations: components.relations,
      pipelines: components.pipelines,
      pages: components.pages,
      blocks: components.blocks,
      views: components.views,
      navigation: components.pages,
      dashboards: components.dashboards,
      metrics,
      automations: components.automations,
      roles: components.roles,
      permissions,
      aiContext: {
        segment: operationProfile.segment,
        businessModels: operationProfile.businessModels,
        operationalCapabilities: operationProfile.operationalCapabilities,
        customerJourneyStages: operationProfile.customerJourneyStages,
        objectionsAndResponses: operationProfile.objectionsAndResponses,
        proofsAndDifferentiators: operationProfile.proofsAndDifferentiators,
        callsToAction: operationProfile.callsToAction,
        responsibilityRules: operationProfile.responsibilityRules,
        slaTargets: operationProfile.slaTargets,
        approvalRules: operationProfile.approvalRules,
        priorityObjectives: operationProfile.priorityObjectives,
        hypotheses: operationProfile.hypotheses,
      },
      integrations: components.integrations,
      operationalRules,
      filters: [
        ...new Set(selectedTemplates.flatMap(({ filters }) => filters)),
      ],
      glossary,
      aiInstructions: [
        ...new Set(
          selectedTemplates.flatMap(({ aiInstructions }) => aiInstructions),
        ),
      ],
      forbiddenRules: [
        ...new Set(
          selectedTemplates.flatMap(({ forbiddenRules }) => forbiddenRules),
        ),
      ],
      readinessCriteria: [
        ...new Set(
          selectedTemplates.flatMap(
            ({ readinessCriteria }) => readinessCriteria,
          ),
        ),
      ],
      selectedCapabilities: selectedTemplates
        .filter(({ kind }) => kind === 'CAPABILITY')
        .map(({ id }) => id),
      hypotheses: operationProfile.hypotheses,
      optionalItems: selectedTemplates
        .filter(({ kind }) => kind === 'CAPABILITY')
        .map(({ id }) => id),
      rejectedItems: [],
      alerts: operationProfile.unconfirmedInformation,
      dependencies: [
        ...new Set(
          selectedTemplates.flatMap(({ dependencies }) => dependencies),
        ),
      ],
      publishedOperations: [],
      createdAt: new Date().toISOString(),
    });

    await this.persistArtifact(workspaceId, {
      artifactType: WorkspaceArchitectureArtifactType.BLUEPRINT,
      status: WorkspaceArchitectureArtifactStatus.AWAITING_APPROVAL,
      version,
      parentVersion: version > 1 ? version - 1 : undefined,
      name: `Blueprint do workspace v${version}`,
      summary: `Estrutura recomendada com ${selectedTemplates.length} templates, ${blueprint.objects.length} objetos e ${blueprint.pages.length} páginas operacionais.`,
      payload: blueprint,
      templateVersions: Object.fromEntries(
        selectedTemplates.map(({ id, version: templateVersion }) => [
          id,
          templateVersion,
        ]),
      ),
      promptVersion: 'workspace-blueprint@1.1.0',
    });

    return blueprint;
  }

  async inspectWorkspaceArchitecture(workspaceId: string) {
    const {
      flatObjectMetadataMaps,
      flatFieldMetadataMaps,
      flatViewMaps,
      flatPageLayoutMaps,
      flatNavigationMenuItemMaps,
      flatAgentMaps,
      flatRoleMaps,
    } =
      await this.flatEntityMapsCacheService.getOrRecomputeManyOrAllFlatEntityMaps(
        {
          workspaceId,
          flatMapsKeys: [
            'flatObjectMetadataMaps',
            'flatFieldMetadataMaps',
            'flatViewMaps',
            'flatPageLayoutMaps',
            'flatNavigationMenuItemMaps',
            'flatAgentMaps',
            'flatRoleMaps',
          ],
        },
      );
    const activeValues = <T extends { isActive?: boolean }>(
      values: Record<string, T | undefined>,
    ) =>
      Object.values(values).filter(
        (value): value is T => isDefined(value) && value.isActive !== false,
      );
    const objects = activeValues(flatObjectMetadataMaps.byUniversalIdentifier);
    const fields = activeValues(flatFieldMetadataMaps.byUniversalIdentifier);

    return {
      objects: objects.map((objectMetadata) => ({
        id: objectMetadata.id,
        nameSingular: objectMetadata.nameSingular,
        namePlural: objectMetadata.namePlural,
        labelSingular: objectMetadata.labelSingular,
        isCustom: objectMetadata.isCustom,
        fields: fields
          .filter(
            ({ objectMetadataId }) => objectMetadataId === objectMetadata.id,
          )
          .map(({ id, name, label, type, isNullable, options }) => ({
            id,
            name,
            label,
            type,
            isNullable: isNullable ?? false,
            options: (options ?? []).map(({ value, label, position }) => ({
              value,
              label,
              position,
            })),
          })),
      })),
      views: activeValues(flatViewMaps.byUniversalIdentifier).map(
        ({ id, name, type, objectMetadataId }) => ({
          id,
          name,
          type,
          objectMetadataId,
        }),
      ),
      pageLayouts: Object.values(flatPageLayoutMaps.byUniversalIdentifier)
        .filter(isDefined)
        .map(({ id, name, type }) => ({ id, name, type })),
      navigation: Object.values(
        flatNavigationMenuItemMaps.byUniversalIdentifier,
      )
        .filter(isDefined)
        .map(({ id, name, type, position }) => ({ id, name, type, position })),
      agents: Object.values(flatAgentMaps.byUniversalIdentifier)
        .filter(isDefined)
        .map(({ id, name, label }) => ({ id, name, label })),
      roles: Object.values(flatRoleMaps.byUniversalIdentifier)
        .filter(isDefined)
        .map(({ id, label }) => ({ id, label })),
    };
  }

  async previewWorkspaceImport({
    workspaceId,
    objectName,
    headers,
    sampleRows,
  }: {
    workspaceId: string;
    objectName: string;
    headers: string[];
    sampleRows: Array<Record<string, unknown>>;
  }): Promise<WorkspaceImportPlan> {
    const architecture = await this.inspectWorkspaceArchitecture(workspaceId);
    const normalizedHeaders = normalizeImportHeaders(headers);
    const normalized = (value: string) =>
      normalize(value).replace(/[^a-z0-9]/g, '');
    const requestedObject = normalized(objectName);
    const object = architecture.objects.find(
      (candidate) =>
        normalized(candidate.nameSingular) === requestedObject ||
        normalized(candidate.labelSingular) === requestedObject,
    );

    if (!object) {
      throw new Error(
        `O objeto ${objectName} não existe neste workspace. A importação não foi iniciada.`,
      );
    }

    const aliases: Record<string, string> = {
      email: 'email',
      emailprincipal: 'email',
      telefone: 'phone',
      celular: 'phone',
      whatsapp: 'phone',
      empresa: 'name',
      company: 'name',
      nome: 'name',
      name: 'name',
      idexterno: 'externalid',
      externalid: 'externalid',
    };
    const fieldByToken = new Map<string, (typeof object.fields)[number]>();
    for (const field of object.fields) {
      fieldByToken.set(normalized(field.name), field);
      fieldByToken.set(normalized(field.label), field);
    }
    const mappingConfidence = (
      header: string,
    ): {
      field: (typeof object.fields)[number] | null;
      confidence: 'EXACT' | 'ALIAS' | 'UNMAPPED';
    } => {
      const exact = fieldByToken.get(normalized(header));

      if (exact) {
        return { field: exact, confidence: 'EXACT' };
      }

      const alias = aliases[normalized(header)];
      const aliasField = alias ? fieldByToken.get(alias) : undefined;

      return aliasField
        ? { field: aliasField, confidence: 'ALIAS' }
        : { field: null, confidence: 'UNMAPPED' };
    };
    const mappings = normalizedHeaders.map((header) => {
      const match = mappingConfidence(header);

      return {
        sourceHeader: header,
        targetField: match.field?.name ?? null,
        confidence: match.confidence,
        sampleValues: sampleRows
          .map((row) => readImportRowValue(row, header))
          .filter((value): value is string | number | boolean =>
            ['string', 'number', 'boolean'].includes(typeof value),
          )
          .map(String)
          .slice(0, 5),
      };
    });
    const mappedFieldNames = new Set(
      mappings.flatMap(({ targetField }) => (targetField ? [targetField] : [])),
    );
    const dedupeKeys = object.fields
      .filter(({ name }) => ['email', 'phone', 'externalId'].includes(name))
      .filter(({ name }) => mappedFieldNames.has(name))
      .map(({ name }) => name);
    const requiredFieldsWithoutMapping = object.fields
      .filter(({ isNullable }) => isNullable === false)
      .filter(({ name }) => !mappedFieldNames.has(name))
      .map(({ name }) => name);
    const requiredFields = object.fields
      .filter(({ isNullable }) => isNullable === false)
      .map(({ name }) => name);
    const warnings = [
      ...mappings
        .filter(({ confidence }) => confidence === 'UNMAPPED')
        .map(
          ({ sourceHeader }) => `Coluna sem correspondência: ${sourceHeader}.`,
        ),
      ...(dedupeKeys.length === 0
        ? ['Nenhuma chave segura de deduplicação foi encontrada.']
        : []),
      ...(requiredFieldsWithoutMapping.length > 0
        ? [
            `Campos obrigatórios sem mapeamento: ${requiredFieldsWithoutMapping.join(', ')}.`,
          ]
        : []),
    ];
    const plan = workspaceImportPlanSchema.parse({
      schemaVersion: '1.0.0',
      planId: createHash('sha256')
        .update(
          JSON.stringify({
            workspaceId,
            objectName: object.nameSingular,
            headers: normalizedHeaders,
            mappings,
          }),
        )
        .digest('hex'),
      objectName: object.nameSingular,
      objectLabel: object.labelSingular,
      headers: normalizedHeaders,
      mappings,
      dedupeKeys,
      requiredFields,
      requiredFieldsWithoutMapping,
      warnings,
      rollback: {
        strategy: 'STAGED_IMPORT',
        reversible: true,
        guidance:
          'Aplique primeiro em lote de prévia; somente confirme a gravação após revisar mapeamento, duplicatas e campos obrigatórios.',
      },
      createdAt: new Date().toISOString(),
    });

    const batch = workspaceImportBatchSchema.parse({
      schemaVersion: '1.0.0',
      batchId: v4(),
      planId: plan.planId,
      plan,
      status: 'AWAITING_APPROVAL',
      sourceHash: null,
      totalRows: sampleRows.length,
      acceptedRows: 0,
      skippedRows: 0,
      failedRows: 0,
      recordIds: [],
      rowErrors: [],
      createdAt: plan.createdAt,
      approvedAt: null,
      appliedAt: null,
      rolledBackAt: null,
      error: null,
    });
    const version = await this.getNextVersion(
      workspaceId,
      WorkspaceArchitectureArtifactType.IMPORT_BATCH,
    );

    await this.persistArtifact(workspaceId, {
      artifactType: WorkspaceArchitectureArtifactType.IMPORT_BATCH,
      status: WorkspaceArchitectureArtifactStatus.AWAITING_APPROVAL,
      version,
      name: `Importação ${plan.objectLabel}`,
      summary: `Prévia de importação para ${plan.objectLabel}; aguarda aprovação explícita.`,
      payload: batch,
      idempotencyKey: plan.planId,
    });

    return plan;
  }

  async approveWorkspaceImport({
    workspaceId,
    planId,
  }: {
    workspaceId: string;
    planId: string;
  }) {
    const artifact = await this.getImportBatchByPlanId(workspaceId, planId);
    const batch = workspaceImportBatchSchema.parse(artifact.payload);

    if (batch.status === 'APPROVED' || batch.status === 'ACTIVE') {
      return {
        approved: true,
        idempotentReplay: true,
        planId,
        batchId: batch.batchId,
      };
    }

    if (batch.status !== 'AWAITING_APPROVAL') {
      throw new Error(
        `A importação ${planId} está ${batch.status} e não pode ser aprovada.`,
      );
    }

    const approvedAt = new Date();
    const approvedBatch = workspaceImportBatchSchema.parse({
      ...batch,
      status: 'APPROVED',
      approvedAt: approvedAt.toISOString(),
    });

    await this.updateArtifact(workspaceId, artifact.id, {
      status: WorkspaceArchitectureArtifactStatus.APPROVED,
      approvedAt,
      payload: approvedBatch,
    });

    return {
      approved: true,
      idempotentReplay: false,
      planId,
      batchId: batch.batchId,
      approvedAt,
    };
  }

  async getWorkspaceImportBatch({
    workspaceId,
    planId,
  }: {
    workspaceId: string;
    planId: string;
  }) {
    const artifact = await this.getImportBatchByPlanId(workspaceId, planId);
    const batch = workspaceImportBatchSchema.parse(artifact.payload);

    return {
      version: artifact.version,
      artifactStatus: artifact.status,
      batch,
    };
  }

  async applyWorkspaceImport({
    workspaceId,
    planId,
    headers,
    rows,
  }: {
    workspaceId: string;
    planId: string;
    headers: string[];
    rows: Array<Record<string, unknown>>;
  }) {
    if (rows.length === 0) {
      throw new Error('A importação precisa conter pelo menos uma linha.');
    }

    if (rows.length > 500) {
      throw new Error(
        'A importação inicial aceita no máximo 500 linhas por lote.',
      );
    }

    const artifact = await this.getImportBatchByPlanId(workspaceId, planId);
    const batch = workspaceImportBatchSchema.parse(artifact.payload);

    if (batch.status === 'ACTIVE') {
      return {
        applied: true,
        idempotentReplay: true,
        planId,
        batchId: batch.batchId,
        recordIds: batch.recordIds,
      };
    }

    if (batch.status !== 'APPROVED') {
      throw new Error(
        `A importação ${planId} precisa de aprovação explícita antes da gravação.`,
      );
    }

    const normalizedHeaders = normalizeImportHeaders(headers);

    if (
      JSON.stringify(normalizedHeaders) !== JSON.stringify(batch.plan.headers)
    ) {
      throw new Error(
        'Os cabeçalhos enviados não correspondem à prévia aprovada. Gere uma nova prévia.',
      );
    }

    const expectedPlanId = createHash('sha256')
      .update(
        JSON.stringify({
          workspaceId,
          objectName: batch.plan.objectName,
          headers: batch.plan.headers,
          mappings: batch.plan.mappings,
        }),
      )
      .digest('hex');

    if (expectedPlanId !== planId) {
      throw new Error(
        'A prévia de importação não corresponde ao workspace atual.',
      );
    }

    const records: ObjectRecordProperties[] = [];
    const rowErrors: Array<{ row: number; message: string }> = [];
    const seenDedupeKeys = new Set<string>();
    let skippedRows = 0;

    rows.forEach((row, rowIndex) => {
      const mappedRecord = batch.plan.mappings.reduce<ObjectRecordProperties>(
        (record, mapping) => {
          const value = readImportRowValue(row, mapping.sourceHeader);

          if (mapping.targetField && value !== undefined) {
            record[mapping.targetField] = value;
          }

          return record;
        },
        {},
      );
      const requiredFields =
        batch.plan.requiredFields.length > 0
          ? batch.plan.requiredFields
          : batch.plan.requiredFieldsWithoutMapping;
      const missingFields = requiredFields.filter((fieldName) => {
        const value = mappedRecord[fieldName];

        return (
          value === undefined || value === null || String(value).trim() === ''
        );
      });

      if (missingFields.length > 0) {
        rowErrors.push({
          row: rowIndex,
          message: `Campos obrigatórios ausentes: ${missingFields.join(', ')}.`,
        });

        return;
      }

      if (batch.plan.dedupeKeys.length > 0) {
        const dedupeKey = batch.plan.dedupeKeys
          .map((fieldName) => String(mappedRecord[fieldName] ?? '').trim())
          .join('|');

        if (dedupeKey.replace(/\|/g, '').length > 0) {
          if (seenDedupeKeys.has(dedupeKey)) {
            skippedRows += 1;

            return;
          }

          seenDedupeKeys.add(dedupeKey);
        }
      }

      records.push(mappedRecord);
    });

    if (rowErrors.length > 0) {
      const validationError = `A importação foi bloqueada: ${rowErrors.length} linha(s) não atendem aos campos obrigatórios.`;
      const failedBatch = workspaceImportBatchSchema.parse({
        ...batch,
        status: 'FAILED',
        totalRows: rows.length,
        failedRows: rowErrors.length,
        rowErrors,
        error: validationError,
      });

      await this.updateArtifact(workspaceId, artifact.id, {
        status: WorkspaceArchitectureArtifactStatus.FAILED,
        payload: failedBatch,
        errorDetails: { markdown: validationError },
      });

      throw new Error(validationError);
    }

    if (records.length === 0) {
      const validationError =
        'Nenhuma linha válida restou após a deduplicação.';
      const failedBatch = workspaceImportBatchSchema.parse({
        ...batch,
        status: 'FAILED',
        totalRows: rows.length,
        skippedRows,
        error: validationError,
      });

      await this.updateArtifact(workspaceId, artifact.id, {
        status: WorkspaceArchitectureArtifactStatus.FAILED,
        payload: failedBatch,
        errorDetails: { markdown: validationError },
      });

      throw new Error('Nenhuma linha válida restou após a deduplicação.');
    }

    const applyingBatch = workspaceImportBatchSchema.parse({
      ...batch,
      status: 'APPLYING',
      totalRows: rows.length,
      acceptedRows: records.length,
      skippedRows,
      failedRows: 0,
      rowErrors: [],
      sourceHash: createHash('sha256')
        .update(JSON.stringify({ headers: normalizedHeaders, rows }))
        .digest('hex'),
      error: null,
    });

    await this.updateArtifact(workspaceId, artifact.id, {
      status: WorkspaceArchitectureArtifactStatus.APPLYING,
      payload: applyingBatch,
    });

    let createdRecordIds: string[] = [];

    try {
      const output = await this.createManyRecordsService.execute({
        objectName: batch.plan.objectName,
        objectRecords: records,
        authContext: buildSystemAuthContext(workspaceId),
        slimResponse: true,
      });

      if (!output.success) {
        throw new Error(output.error ?? output.message);
      }

      const recordIds = (output.recordReferences ?? [])
        .map(({ recordId }) => recordId)
        .filter((recordId): recordId is string => typeof recordId === 'string');
      createdRecordIds = recordIds;

      if (recordIds.length !== records.length) {
        throw new Error(
          'A gravação não retornou todos os identificadores necessários para rollback.',
        );
      }

      const appliedAt = new Date();
      const activeBatch = workspaceImportBatchSchema.parse({
        ...applyingBatch,
        status: 'ACTIVE',
        recordIds,
        appliedAt: appliedAt.toISOString(),
      });

      await this.updateArtifact(workspaceId, artifact.id, {
        status: WorkspaceArchitectureArtifactStatus.ACTIVE,
        appliedAt,
        completedAt: appliedAt,
        payload: activeBatch,
        errorDetails: null,
      });

      return {
        applied: true,
        idempotentReplay: false,
        planId,
        batchId: batch.batchId,
        recordIds,
        totalRows: rows.length,
        acceptedRows: records.length,
        skippedRows,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Falha na importação.';
      const rollbackFailedRecordIds: string[] = [];

      for (const recordId of createdRecordIds) {
        try {
          const rollbackOutput = await this.deleteRecordService.execute({
            objectName: batch.plan.objectName,
            objectRecordId: recordId,
            authContext: buildSystemAuthContext(workspaceId),
            soft: true,
          });

          if (!rollbackOutput.success) {
            rollbackFailedRecordIds.push(recordId);
          }
        } catch {
          rollbackFailedRecordIds.push(recordId);
        }
      }
      const failedBatch = workspaceImportBatchSchema.parse({
        ...applyingBatch,
        status: 'FAILED',
        failedRows: rows.length,
        recordIds: rollbackFailedRecordIds,
        error: message,
      });

      await this.updateArtifact(workspaceId, artifact.id, {
        status: WorkspaceArchitectureArtifactStatus.FAILED,
        payload: failedBatch,
        errorDetails: { markdown: message },
      });

      throw error;
    }
  }

  async rollbackWorkspaceImport({
    workspaceId,
    planId,
  }: {
    workspaceId: string;
    planId: string;
  }) {
    const artifact = await this.getImportBatchByPlanId(workspaceId, planId);
    const batch = workspaceImportBatchSchema.parse(artifact.payload);

    if (batch.status === 'ROLLED_BACK') {
      return {
        rolledBack: true,
        idempotentReplay: true,
        planId,
        batchId: batch.batchId,
        recordIds: [],
      };
    }

    if (batch.status !== 'ACTIVE') {
      throw new Error(
        `A importação ${planId} está ${batch.status} e não pode sofrer rollback.`,
      );
    }

    const failedRecordIds: string[] = [];

    for (const recordId of batch.recordIds) {
      try {
        const output = await this.deleteRecordService.execute({
          objectName: batch.plan.objectName,
          objectRecordId: recordId,
          authContext: buildSystemAuthContext(workspaceId),
          soft: true,
        });

        if (!output.success) {
          failedRecordIds.push(recordId);
        }
      } catch {
        failedRecordIds.push(recordId);
      }
    }

    const rolledBack = failedRecordIds.length === 0;
    const rolledBackAt = new Date();
    const finalBatch = workspaceImportBatchSchema.parse({
      ...batch,
      status: rolledBack ? 'ROLLED_BACK' : 'ROLLBACK_FAILED',
      recordIds: failedRecordIds,
      rolledBackAt: rolledBackAt.toISOString(),
      error: rolledBack
        ? null
        : `Não foi possível remover ${failedRecordIds.length} registro(s).`,
    });

    await this.updateArtifact(workspaceId, artifact.id, {
      status: rolledBack
        ? WorkspaceArchitectureArtifactStatus.ROLLED_BACK
        : WorkspaceArchitectureArtifactStatus.FAILED,
      completedAt: rolledBackAt,
      payload: finalBatch,
      errorDetails: rolledBack ? null : { markdown: finalBatch.error ?? '' },
    });

    return {
      rolledBack,
      idempotentReplay: false,
      planId,
      batchId: batch.batchId,
      recordIds: failedRecordIds,
    };
  }

  async createChangeSet({
    workspaceId,
    blueprint,
  }: {
    workspaceId: string;
    blueprint: WorkspaceBlueprint;
  }): Promise<WorkspaceChangeSet> {
    const current = await this.inspectWorkspaceArchitecture(workspaceId);
    const existingObjectNames = new Set(
      current.objects.flatMap(({ nameSingular, namePlural }) => [
        nameSingular,
        namePlural,
      ]),
    );
    const objectOperations: WorkspaceChangeOperation[] = blueprint.objects.map(
      (object) => {
        const resourceName = toCamelCase(object.key);
        const exists = existingObjectNames.has(resourceName);

        return {
          id: v4(),
          action: exists ? 'NO_CHANGE' : 'CREATE',
          resourceType: 'OBJECT',
          resourceKey: resourceName,
          label: object.label,
          reason: object.description,
          impact: exists
            ? 'A estrutura nativa já atende esta recomendação.'
            : object.benefit,
          dependencies: object.sourceTemplateIds,
          reversible: true,
          risk: 'LOW',
          requiresMigration: !exists,
          dataImpact: exists
            ? 'Nenhum.'
            : 'Cria uma tabela nova sem alterar dados existentes.',
          requiredPermission: 'DATA_MODEL',
          currentState: exists ? { nameSingular: resourceName } : null,
          desiredState: exists
            ? null
            : {
                nameSingular: resourceName,
                namePlural: `${resourceName}s`,
                labelSingular: object.label,
                labelPlural: object.label,
                description: object.description,
                icon: 'IconBox',
              },
          blockedReason: null,
        };
      },
    );
    const fieldOperations: WorkspaceChangeOperation[] = blueprint.fields.map(
      (field) => {
        const configuration = field.configuration ?? {};
        const objectKey =
          typeof configuration.objectKey === 'string'
            ? toCamelCase(configuration.objectKey)
            : toCamelCase(field.key.split('.')[0] ?? '');
        const fieldName =
          typeof configuration.name === 'string'
            ? toCamelCase(configuration.name)
            : toCamelCase(field.key.split('.').slice(1).join('-'));
        const object = current.objects.find(
          ({ nameSingular, namePlural }) =>
            nameSingular === objectKey || namePlural === `${objectKey}s`,
        );
        const existingField = object
          ? current.fields.find(
              ({ objectMetadataId, name }) =>
                objectMetadataId === object.id && name === fieldName,
            )
          : undefined;

        return {
          id: v4(),
          action: existingField ? 'NO_CHANGE' : 'CREATE',
          resourceType: 'FIELD',
          resourceKey: `${objectKey}.${fieldName}`,
          label: field.label,
          reason: field.description,
          impact: existingField
            ? 'O campo nativo já atende esta recomendação.'
            : field.benefit,
          dependencies: [objectKey, ...field.sourceTemplateIds],
          reversible: true,
          risk: 'LOW',
          requiresMigration: !existingField,
          dataImpact: existingField
            ? 'Nenhum.'
            : 'Cria um campo novo sem alterar valores existentes.',
          requiredPermission: 'DATA_MODEL',
          currentState: existingField
            ? {
                id: existingField.id,
                objectMetadataId: existingField.objectMetadataId,
                name: existingField.name,
              }
            : null,
          desiredState: existingField
            ? null
            : {
                objectKey,
                name: fieldName,
                label: field.label,
                description: field.description,
                type:
                  typeof configuration.type === 'string'
                    ? configuration.type
                    : 'TEXT',
                isNullable: configuration.isNullable !== false,
                icon:
                  typeof configuration.icon === 'string'
                    ? configuration.icon
                    : 'IconListDetails',
              },
          blockedReason:
            object ||
            objectOperations.some(
              ({ resourceKey }) => resourceKey === objectKey,
            )
              ? null
              : `O objeto ${objectKey} será criado antes deste campo ou não foi encontrado.`,
        };
      },
    );
    const buildDeclarativeOperations = (
      values: WorkspaceBlueprintComponent[],
      resourceType: WorkspaceChangeOperation['resourceType'],
      risk: WorkspaceChangeOperation['risk'] = 'LOW',
    ): WorkspaceChangeOperation[] =>
      values.map((component) => ({
        id: v4(),
        action: 'CREATE',
        resourceType,
        resourceKey: toCamelCase(component.key),
        label: component.label,
        reason: component.description,
        impact: component.benefit,
        dependencies: component.sourceTemplateIds,
        reversible: true,
        risk,
        requiresMigration: false,
        dataImpact:
          'Ativa a configuração declarativa da operação sem criar registros ou apagar dados.',
        requiredPermission:
          resourceType === 'PERMISSION' || resourceType === 'ROLE'
            ? 'SETTINGS'
            : 'WORKSPACE_CONFIGURATION',
        currentState: null,
        desiredState: {
          key: component.key,
          label: component.label,
          description: component.description,
          required: component.required,
          benefit: component.benefit,
          sourceTemplateIds: component.sourceTemplateIds,
          configuration: component.configuration ?? {},
        },
        blockedReason: null,
      }));
    const declarativeOperations = [
      ...buildDeclarativeOperations(blueprint.relations, 'RELATION'),
      ...buildDeclarativeOperations(blueprint.views, 'VIEW'),
      ...buildDeclarativeOperations(blueprint.pipelines, 'PIPELINE'),
      ...buildDeclarativeOperations(blueprint.pages, 'PAGE_LAYOUT'),
      ...buildDeclarativeOperations(blueprint.blocks, 'PAGE_LAYOUT'),
      ...buildDeclarativeOperations(blueprint.navigation, 'NAVIGATION'),
      ...buildDeclarativeOperations(blueprint.dashboards, 'DASHBOARD'),
      ...buildDeclarativeOperations(
        blueprint.automations,
        'WORKFLOW',
        'MEDIUM',
      ),
      ...buildDeclarativeOperations(blueprint.roles, 'ROLE', 'MEDIUM'),
      ...buildDeclarativeOperations(
        blueprint.integrations,
        'INTEGRATION',
        'MEDIUM',
      ),
      ...blueprint.permissions.map((permission) => ({
        id: v4(),
        action: 'CREATE' as const,
        resourceType: 'PERMISSION' as const,
        resourceKey: toCamelCase(permission),
        label: permission,
        reason: 'Regra de governança recomendada para esta operação.',
        impact: 'Mantém a operação compatível com a política do workspace.',
        dependencies: [],
        reversible: true,
        risk: 'MEDIUM' as const,
        requiresMigration: false,
        dataImpact: 'Nenhum registro é alterado.',
        requiredPermission: 'SETTINGS',
        currentState: null,
        desiredState: { key: permission, value: true },
        blockedReason: null,
      })),
      {
        id: v4(),
        action: 'UPDATE' as const,
        resourceType: 'AI_CONTEXT' as const,
        resourceKey: 'workspace-ai-operating-context',
        label: 'Contexto operacional da IA',
        reason: 'Mantém a IA alinhada ao manifesto aprovado da operação.',
        impact:
          'Evita respostas genéricas e ações baseadas em contexto antigo.',
        dependencies: [],
        reversible: true,
        risk: 'MEDIUM' as const,
        requiresMigration: false,
        dataImpact: 'Nenhum registro operacional é alterado.',
        requiredPermission: 'AI_CONFIGURATION',
        currentState: null,
        desiredState: {
          operationManifest: blueprint.operationManifest,
          operationProfile: blueprint.operationProfile,
          forbiddenRules: blueprint.forbiddenRules,
          aiInstructions: blueprint.aiInstructions,
        },
        blockedReason: null,
      },
    ];
    const operations = [
      ...objectOperations,
      ...fieldOperations,
      ...declarativeOperations,
    ];
    const id = v4();
    const idempotencyKey = createHash('sha256')
      .update(`${workspaceId}:${blueprint.id}:${blueprint.version}`)
      .digest('hex');
    const validationErrors = operations
      .filter(
        ({ action, risk, blockedReason }) =>
          action === 'ARCHIVE' || risk === 'BLOCKED' || blockedReason !== null,
      )
      .map(
        ({ label, blockedReason }) =>
          `${label}: ${blockedReason ?? 'operação destrutiva bloqueada.'}`,
      );
    const changeSet = workspaceChangeSetSchema.parse({
      id,
      blueprintId: blueprint.id,
      blueprintVersion: blueprint.version,
      idempotencyKey,
      status:
        validationErrors.length === 0 ? 'AWAITING_APPROVAL' : 'VALIDATING',
      operations,
      warnings: [
        ...blueprint.alerts,
        'Recursos declarativos serão ativados no manifesto operacional após a aprovação; nenhuma exclusão automática será executada.',
      ],
      validationErrors,
      approvedAt: null,
      appliedAt: null,
      createdAt: new Date().toISOString(),
    });
    const version = await this.getNextVersion(
      workspaceId,
      WorkspaceArchitectureArtifactType.CHANGE_SET,
    );

    await this.persistArtifact(workspaceId, {
      artifactType: WorkspaceArchitectureArtifactType.CHANGE_SET,
      status:
        validationErrors.length === 0
          ? WorkspaceArchitectureArtifactStatus.AWAITING_APPROVAL
          : WorkspaceArchitectureArtifactStatus.VALIDATING,
      version,
      name: `Alterações do blueprint v${blueprint.version}`,
      summary: `${operations.filter(({ action }) => action !== 'NO_CHANGE').length} alterações propostas e ${operations.filter(({ action }) => action === 'NO_CHANGE').length} itens já atendidos.`,
      payload: changeSet,
      idempotencyKey,
      templateVersions: Object.fromEntries(
        blueprint.selectedTemplates.map(
          ({ id: templateId, version: templateVersion }) => [
            templateId,
            templateVersion,
          ],
        ),
      ),
    });

    return changeSet;
  }

  async getHistory(workspaceId: string, limit = 30) {
    return this.withArtifactRepository(workspaceId, async (repository) =>
      repository.find({
        order: { createdAt: 'DESC' },
        take: Math.min(limit, 100),
      }),
    );
  }

  async getLatestArtifact(
    workspaceId: string,
    artifactType: WorkspaceArchitectureArtifactType,
  ) {
    return this.withArtifactRepository(workspaceId, async (repository) => {
      const [artifact] = await repository.find({
        where: { artifactType },
        order: { version: 'DESC' },
        take: 1,
      });

      return artifact ?? null;
    });
  }

  async getOnboardingEvidence(
    workspaceId: string,
  ): Promise<WorkspaceOnboardingEvidence | null> {
    const artifact = await this.getLatestArtifact(
      workspaceId,
      WorkspaceArchitectureArtifactType.ONBOARDING_EVIDENCE,
    );
    const parsed = artifact
      ? workspaceOnboardingEvidenceSchema.safeParse(artifact.payload)
      : null;

    return parsed?.success ? parsed.data : null;
  }

  async getAiPolicy(workspaceId: string): Promise<WorkspaceAiPolicy> {
    const artifact = await this.getLatestArtifact(
      workspaceId,
      WorkspaceArchitectureArtifactType.AI_POLICY,
    );
    const parsed = artifact
      ? workspaceAiPolicySchema.safeParse(artifact.payload)
      : null;

    return parsed?.success ? parsed.data : DEFAULT_WORKSPACE_AI_POLICY;
  }

  async getWorkspaceReadinessPack(
    workspaceId: string,
  ): Promise<WorkspaceReadinessPack> {
    const [workspace, profileArtifact, blueprintArtifact] = await Promise.all([
      this.workspaceRepository.findOne({ where: { id: workspaceId } }),
      this.getLatestArtifact(
        workspaceId,
        WorkspaceArchitectureArtifactType.OPERATION_PROFILE,
      ),
      this.getLatestArtifact(
        workspaceId,
        WorkspaceArchitectureArtifactType.BLUEPRINT,
      ),
    ]);
    const profile = profileArtifact
      ? workspaceOperationProfileSchema.safeParse(profileArtifact.payload)
      : null;
    const blueprint = blueprintArtifact
      ? workspaceBlueprintSchema.safeParse(blueprintArtifact.payload)
      : null;
    const selectedTemplateIds = blueprint?.success
      ? blueprint.data.selectedTemplates.map(({ id }) => id)
      : ['diex.base.universal'];
    const templates = selectedTemplateIds
      .map((id) => WORKSPACE_TEMPLATE_BY_ID.get(id))
      .filter((template): template is WorkspaceTemplateDefinition =>
        Boolean(template),
      );

    if (templates.length === 0) {
      const baseTemplate = WORKSPACE_TEMPLATE_BY_ID.get('diex.base.universal');

      if (baseTemplate) {
        templates.push(baseTemplate);
      }
    }

    return buildWorkspaceReadinessPack({
      templates,
      goal: workspace?.onboardingPrimaryGoal,
      primaryChannel: workspace?.onboardingPrimaryChannel,
      teamCount: profile?.success ? profile.data.teamCount : null,
      hasSlaTargets:
        profile?.success === true && profile.data.slaTargets.length > 0,
      hasApprovalRules:
        profile?.success === true && profile.data.approvalRules.length > 0,
      operationLabel:
        profile?.success === true
          ? (profile.data.segment ?? profile.data.businessModels[0] ?? null)
          : null,
    });
  }

  async recordWhatsappChannelHealth({
    workspaceId,
    state,
    instanceName,
    message,
    validatedByRealMessage = false,
  }: {
    workspaceId: string;
    state:
      | 'CONNECTED'
      | 'AWAITING_SCAN'
      | 'CONNECTING'
      | 'NOT_PROVISIONED'
      | 'UNAVAILABLE';
    instanceName: string | null;
    message: string;
    validatedByRealMessage?: boolean;
  }): Promise<WorkspaceOnboardingEvidence> {
    const readinessPack = await this.getWorkspaceReadinessPack(workspaceId);

    return this.cacheLockService.withRenewableLock(
      async () => {
        const artifact = await this.getLatestArtifact(
          workspaceId,
          WorkspaceArchitectureArtifactType.ONBOARDING_EVIDENCE,
        );
        const parsed = artifact
          ? workspaceOnboardingEvidenceSchema.safeParse(artifact.payload)
          : null;
        const current = parsed?.success ? parsed.data : null;
        const now = new Date().toISOString();
        const previousJourney =
          current?.journey &&
          current.journey.startedAt !== new Date(0).toISOString()
            ? current.journey
            : undefined;
        const previousChannel = current?.channel;
        const lastCheckedAt = previousChannel?.lastCheckedAt
          ? Date.parse(previousChannel.lastCheckedAt)
          : 0;
        const heartbeatDue =
          !lastCheckedAt || lastCheckedAt + 60_000 <= Date.now();
        const shouldClearValidation =
          state === 'NOT_PROVISIONED' ||
          state === 'AWAITING_SCAN' ||
          state === 'CONNECTING' ||
          (Boolean(previousChannel?.instanceName) &&
            previousChannel?.instanceName !== instanceName);
        const changed =
          !previousChannel ||
          previousChannel.state !== state ||
          previousChannel.instanceName !== instanceName ||
          (validatedByRealMessage && !previousChannel.validatedAt) ||
          (shouldClearValidation && previousChannel.validatedAt !== null) ||
          previousChannel.lastError !==
            (state === 'UNAVAILABLE' ? message : null);

        if (current && !changed && !heartbeatDue) {
          return current;
        }

        const nextChannel = {
          provider: 'WHATSAPP' as const,
          state,
          instanceName,
          lastCheckedAt: now,
          validatedAt:
            validatedByRealMessage && state === 'CONNECTED'
              ? previousChannel?.instanceName === instanceName
                ? (previousChannel?.validatedAt ?? now)
                : now
              : shouldClearValidation
                ? null
                : (previousChannel?.validatedAt ?? null),
          lastError: state === 'UNAVAILABLE' ? message : null,
        };
        const event = {
          id: v4(),
          key: 'channel_health',
          ready: state === 'CONNECTED' && nextChannel.validatedAt !== null,
          recordId: instanceName,
          source: 'evolution-connection',
          occurredAt: now,
          details: {
            provider: 'WHATSAPP',
            state,
            previousState: previousChannel?.state ?? 'UNKNOWN',
            message,
          },
        };
        const journey = deriveWorkspaceOnboardingJourney({
          milestones: current?.milestones ?? [],
          previousJourney,
          readinessCriteria: readinessPack.criteria,
          now,
        });
        const nextEvidence = workspaceOnboardingEvidenceSchema.parse({
          schemaVersion: '1.3.0',
          version: (current?.version ?? 0) + 1,
          milestones: current?.milestones ?? [],
          events: [...(current?.events ?? []), event].slice(-500),
          activation: current?.activation,
          channel: nextChannel,
          firstValueRun: current?.firstValueRun ?? null,
          journey,
          lastReconciledAt: now,
          reconciliationSource: 'evolution-connection',
        });

        if (artifact) {
          await this.updateArtifact(workspaceId, artifact.id, {
            status: WorkspaceArchitectureArtifactStatus.SUPERSEDED,
          });
        }

        await this.persistArtifact(workspaceId, {
          artifactType: WorkspaceArchitectureArtifactType.ONBOARDING_EVIDENCE,
          status: WorkspaceArchitectureArtifactStatus.ACTIVE,
          version: nextEvidence.version,
          parentVersion: current?.version,
          name: `Saúde do WhatsApp v${nextEvidence.version}`,
          summary: `Canal WhatsApp ${state.toLowerCase()} sem expor QR code ou segredo.`,
          payload: nextEvidence,
          promptVersion: 'workspace-onboarding-evidence@1.3.0',
        });

        return nextEvidence;
      },
      `diex:workspace-onboarding-evidence:${workspaceId}`,
      { ttl: 15_000, renewalIntervalMs: 4_000, maxRetries: 20 },
    );
  }

  async updateAiPolicy({
    workspaceId,
    update,
  }: {
    workspaceId: string;
    update: WorkspaceAiPolicyUpdate;
  }): Promise<WorkspaceAiPolicy> {
    return this.cacheLockService.withRenewableLock(
      async () => {
        const artifact = await this.getLatestArtifact(
          workspaceId,
          WorkspaceArchitectureArtifactType.AI_POLICY,
        );
        const current = await this.getAiPolicy(workspaceId);
        const now = new Date().toISOString();
        const nextPolicy = workspaceAiPolicySchema.parse({
          ...current,
          version: artifact ? artifact.version + 1 : current.version,
          limits: {
            ...current.limits,
            ...(update.limits ?? {}),
          },
          operatingWindow: {
            ...current.operatingWindow,
            ...(update.operatingWindow ?? {}),
          },
          allowedChannels: update.allowedChannels ?? current.allowedChannels,
          blockedActionTypes:
            update.blockedActionTypes ?? current.blockedActionTypes,
          minimumApprovalRisk:
            update.minimumApprovalRisk ?? current.minimumApprovalRisk,
          updatedAt: now,
          updatedBy:
            update.updatedBy === undefined
              ? current.updatedBy
              : update.updatedBy,
        });

        if (artifact) {
          await this.updateArtifact(workspaceId, artifact.id, {
            status: WorkspaceArchitectureArtifactStatus.SUPERSEDED,
          });
        }

        await this.persistArtifact(workspaceId, {
          artifactType: WorkspaceArchitectureArtifactType.AI_POLICY,
          status: WorkspaceArchitectureArtifactStatus.ACTIVE,
          version: nextPolicy.version,
          parentVersion: artifact?.version,
          name: `Política de IA v${nextPolicy.version}`,
          summary:
            'Limites, canais, horário operacional e aprovação da IA definidos pelo administrador.',
          payload: nextPolicy,
          promptVersion: 'workspace-ai-policy@1.0.0',
        });

        return nextPolicy;
      },
      `diex:workspace-ai-policy:${workspaceId}`,
      { ttl: 15_000, renewalIntervalMs: 4_000, maxRetries: 20 },
    );
  }

  async reconcileOnboardingEvidence({
    workspaceId,
    milestones,
    readinessCriteria,
    firstValueRun,
    source = 'workspace-commercial-readiness',
  }: {
    workspaceId: string;
    milestones: Array<
      Pick<WorkspaceOnboardingEvidenceMilestone, 'key' | 'ready' | 'recordId'>
    >;
    readinessCriteria?: WorkspaceReadinessCriterion[];
    firstValueRun?: WorkspaceOnboardingEvidence['firstValueRun'];
    source?: string;
  }): Promise<WorkspaceOnboardingEvidence> {
    return this.cacheLockService.withRenewableLock(
      async () => {
        const artifact = await this.getLatestArtifact(
          workspaceId,
          WorkspaceArchitectureArtifactType.ONBOARDING_EVIDENCE,
        );
        const parsedCurrent = artifact
          ? workspaceOnboardingEvidenceSchema.safeParse(artifact.payload)
          : null;
        const current = parsedCurrent?.success ? parsedCurrent.data : null;
        const now = new Date().toISOString();
        const previousJourney =
          current?.journey &&
          current.journey.startedAt !== new Date(0).toISOString()
            ? current.journey
            : undefined;
        const currentByKey = new Map(
          (current?.milestones ?? []).map((milestone) => [
            milestone.key,
            milestone,
          ]),
        );
        const newEvents = [] as WorkspaceOnboardingEvidence['events'];
        const nextMilestones = milestones.map((milestone) => {
          const previous = currentByKey.get(milestone.key);
          const changed =
            !previous ||
            previous.ready !== milestone.ready ||
            previous.recordId !== milestone.recordId;

          if (changed) {
            newEvents.push({
              id: v4(),
              key: milestone.key,
              ready: milestone.ready,
              recordId: milestone.recordId,
              source,
              occurredAt: now,
              details: {
                previousReady: previous?.ready ?? null,
                previousRecordId: previous?.recordId ?? null,
              },
            });
          }

          return {
            key: milestone.key,
            ready: milestone.ready,
            recordId: milestone.recordId,
            firstSeenAt:
              previous?.firstSeenAt ?? (milestone.ready ? now : null),
            lastSeenAt: changed ? now : (previous?.lastSeenAt ?? null),
            source,
          };
        });

        const completedCount = nextMilestones.filter(
          ({ ready }) => ready,
        ).length;
        const totalCount = nextMilestones.length;
        const configuredFirstValueKeys = new Set(
          readinessCriteria
            ?.filter(({ firstValue }) => firstValue)
            .map(({ key }) => key) ?? [],
        );
        const firstValueMilestone = nextMilestones.find(({ key, ready }) => {
          if (!ready) {
            return false;
          }

          return configuredFirstValueKeys.size > 0
            ? configuredFirstValueKeys.has(key)
            : ['first_opportunity_created', 'first_follow_up_created'].includes(
                key,
              );
        });
        const blockers = nextMilestones
          .filter(({ ready }) => !ready)
          .map(({ key }) => key);
        const journey = deriveWorkspaceOnboardingJourney({
          milestones: nextMilestones,
          previousJourney,
          readinessCriteria,
          now,
        });
        const activationChanged =
          !current ||
          current.activation.completedCount !== completedCount ||
          current.activation.totalCount !== totalCount ||
          current.activation.firstValueAt !==
            (firstValueMilestone?.firstSeenAt ?? null) ||
          JSON.stringify(current.activation.blockers) !==
            JSON.stringify(blockers);

        const journeyChanged =
          JSON.stringify(current?.journey ?? null) !== JSON.stringify(journey);
        const nextFirstValueRun =
          firstValueRun ?? current?.firstValueRun ?? null;
        const firstValueRunChanged =
          JSON.stringify(current?.firstValueRun ?? null) !==
          JSON.stringify(nextFirstValueRun);

        if (
          current &&
          newEvents.length === 0 &&
          !activationChanged &&
          !journeyChanged &&
          !firstValueRunChanged
        ) {
          return current;
        }

        const nextEvidence = workspaceOnboardingEvidenceSchema.parse({
          schemaVersion: '1.3.0',
          version: (current?.version ?? 0) + 1,
          milestones: nextMilestones,
          events: [...(current?.events ?? []), ...newEvents].slice(-500),
          activation: {
            completedCount,
            totalCount,
            score: totalCount
              ? Math.round((completedCount / totalCount) * 100)
              : 0,
            firstValueAt: firstValueMilestone?.firstSeenAt ?? null,
            blockers,
          },
          firstValueRun: nextFirstValueRun,
          journey,
          lastReconciledAt: now,
          reconciliationSource: source,
        });

        if (artifact) {
          await this.updateArtifact(workspaceId, artifact.id, {
            status: WorkspaceArchitectureArtifactStatus.SUPERSEDED,
          });
        }

        await this.persistArtifact(workspaceId, {
          artifactType: WorkspaceArchitectureArtifactType.ONBOARDING_EVIDENCE,
          status: WorkspaceArchitectureArtifactStatus.ACTIVE,
          version: nextEvidence.version,
          parentVersion: current?.version,
          name: `Evidências do onboarding v${nextEvidence.version}`,
          summary: `${nextMilestones.filter(({ ready }) => ready).length}/${nextMilestones.length} marcos comerciais confirmados.`,
          payload: nextEvidence,
          promptVersion: 'workspace-onboarding-evidence@1.3.0',
        });

        return nextEvidence;
      },
      `diex:workspace-onboarding-evidence:${workspaceId}`,
      { ttl: 15_000, renewalIntervalMs: 4_000, maxRetries: 20 },
    );
  }

  private async getActiveCommercialContext(workspaceId: string) {
    const authContext = buildSystemAuthContext(workspaceId);

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const [contextRepository, offerRepository] = await Promise.all([
          this.globalWorkspaceOrmManager.getRepository<DiexWorkspaceContextWorkspaceEntity>(
            workspaceId,
            'diexWorkspaceContext',
            { shouldBypassPermissionChecks: true },
          ),
          this.globalWorkspaceOrmManager.getRepository<OfferWorkspaceEntity>(
            workspaceId,
            'offer',
            { shouldBypassPermissionChecks: true },
          ),
        ]);
        const [contexts, offers] = await Promise.all([
          contextRepository.find({
            where: { status: WorkspaceContextStatus.ACTIVE },
            order: { updatedAt: 'DESC' },
            take: 1,
          }),
          offerRepository.find({
            where: { status: OfferStatus.ACTIVE },
            take: 20,
          }),
        ]);
        const context = contexts[0] ?? null;
        const text = (value: { markdown?: string | null } | null) =>
          value?.markdown?.trim() || null;

        return {
          businessDescription: text(context?.businessDescription ?? null),
          idealCustomerProfile: text(context?.idealCustomerProfile ?? null),
          toneOfVoice: text(context?.toneOfVoice ?? null),
          commercialRules: text(context?.commercialRules ?? null),
          objectionPlaybook: text(context?.objectionPlaybook ?? null),
          competitiveLandscape: text(context?.competitiveLandscape ?? null),
          forbiddenClaims: text(context?.forbiddenClaims ?? null),
          reviewedAt: context?.reviewedAt ?? null,
          activeOffers: offers.map((offer) => ({
            name: offer.name?.trim() || 'Oferta sem nome',
            category: offer.category ?? null,
            pricingModel: offer.pricingModel ?? null,
            basePrice: offer.basePrice ?? null,
            valueProposition: text(offer.valueProposition),
            idealCustomerProfile: text(offer.idealCustomerProfile),
            differentiators: text(offer.differentiators),
            objectionPlaybook: text(offer.objectionPlaybook),
            qualificationCriteria: text(offer.qualificationCriteria),
          })),
        };
      },
      authContext,
    );
  }

  async getAiOperatingContext(workspaceId: string) {
    const [
      workspace,
      profileArtifact,
      blueprintArtifact,
      pageCatalog,
      commercialContext,
      aiPolicy,
      onboardingEvidence,
      readinessPack,
    ] = await Promise.all([
      this.workspaceRepository.findOne({ where: { id: workspaceId } }),
      this.getLatestArtifact(
        workspaceId,
        WorkspaceArchitectureArtifactType.OPERATION_PROFILE,
      ),
      this.getLatestArtifact(
        workspaceId,
        WorkspaceArchitectureArtifactType.BLUEPRINT,
      ),
      this.getPageCatalog(workspaceId),
      this.getActiveCommercialContext(workspaceId),
      this.getAiPolicy(workspaceId),
      this.getOnboardingEvidence(workspaceId),
      this.getWorkspaceReadinessPack(workspaceId),
    ]);
    const profile = profileArtifact
      ? workspaceOperationProfileSchema.safeParse(profileArtifact.payload)
      : null;
    const blueprint = blueprintArtifact
      ? workspaceBlueprintSchema.safeParse(blueprintArtifact.payload)
      : null;
    const operationProfile = profile?.success ? profile.data : null;
    const operationBlueprint = blueprint?.success ? blueprint.data : null;
    const pageOverrides = pageCatalog.items.map((page) => ({
      key: page.key,
      label: page.label,
      description: page.description,
      route: page.route,
      nativeRoute: page.nativeRoute,
      renderer: page.renderer,
      navigationGroup: page.navigationGroup,
      capabilities: page.capabilities,
      primaryAction: page.primaryAction,
      dataSources: page.dataSources,
      dataContracts: page.dataContracts,
      actions: page.actions,
      showInNavigation: page.showInNavigation,
      status: page.status,
      blocks: page.blocks.map((block) => ({
        key: block.key,
        type: block.type,
        title: block.title,
        dataSources: block.dataSources,
        dataContracts: block.dataContracts,
        actions: block.actions,
      })),
    }));
    const contextPayload = {
      workspaceId,
      goal:
        operationBlueprint?.operationManifest?.goal ??
        workspace?.onboardingPrimaryGoal ??
        null,
      profileVersion: profileArtifact?.version ?? null,
      blueprintVersion: blueprintArtifact?.version ?? null,
      pageCatalogVersion: pageCatalog.version,
      onboardingJourney:
        onboardingEvidence?.journey ??
        workspaceOnboardingJourneySchema.parse(undefined),
      readinessPack,
      commercialContext,
      operationProfile,
      operationManifest: operationBlueprint?.operationManifest ?? null,
      pageOverrides,
      policy: {
        structuralChangesRequireApproval: true,
        externalCommunicationRequiresHumanApproval: true,
        aiActionPolicyVersion: '1.0.0',
        workspaceAiPolicy: aiPolicy,
        aiActionExecutionRequiresApprovedScope: true,
        aiActionProposalExpires: true,
        aiActionMaxExecutionAttempts: 3,
        forbiddenClaims: operationBlueprint?.forbiddenRules ?? [],
        unresolvedInformation:
          operationBlueprint?.operationManifest?.unresolved ??
          operationProfile?.unconfirmedInformation ??
          [],
      },
    };
    const contextVersion = createHash('sha256')
      .update(JSON.stringify(contextPayload))
      .digest('hex')
      .slice(0, 24);

    return {
      contextVersion,
      ...contextPayload,
    };
  }

  async getAiOperatingContextPrompt(workspaceId: string): Promise<string> {
    const context = await this.getAiOperatingContext(workspaceId);
    const compactText = (value: string | null | undefined, limit = 360) =>
      value && value.length > limit ? `${value.slice(0, limit - 1)}…` : value;
    const compactValue = (value: unknown): unknown => {
      if (typeof value === 'string') {
        return compactText(value);
      }

      if (Array.isArray(value)) {
        return value.slice(0, 20).map(compactValue);
      }

      if (value instanceof Date) {
        return value.toISOString();
      }

      if (value && typeof value === 'object') {
        return Object.fromEntries(
          Object.entries(value)
            .slice(0, 30)
            .map(([key, nestedValue]) => [key, compactValue(nestedValue)]),
        );
      }

      return value;
    };
    const compactItems = (
      items: Array<{
        key: string;
        label: string;
        description: string;
        source: string;
        enabled: boolean;
        confirmed: boolean;
        configuration: Record<string, unknown>;
      }>,
    ) =>
      items.map((item) => ({
        key: item.key,
        label: item.label,
        description: compactText(item.description as string | undefined),
        source: item.source,
        enabled: item.enabled,
        confirmed: item.confirmed,
        configuration: compactValue(item.configuration),
      }));
    const operationProfile = context.operationProfile
      ? Object.fromEntries(
          Object.entries(context.operationProfile).map(([key, value]) => [
            key,
            compactValue(value),
          ]),
        )
      : null;
    const operationManifest = context.operationManifest
      ? {
          schemaVersion: context.operationManifest.schemaVersion,
          version: context.operationManifest.version,
          profileVersion: context.operationManifest.profileVersion,
          blueprintVersion: context.operationManifest.blueprintVersion,
          goal: context.operationManifest.goal,
          segment: context.operationManifest.segment,
          capabilities: compactItems(context.operationManifest.capabilities),
          entities: compactItems(context.operationManifest.entities),
          fields: compactItems(context.operationManifest.fields),
          relations: compactItems(context.operationManifest.relations),
          pipelines: compactItems(context.operationManifest.pipelines),
          pages: compactItems(context.operationManifest.pages),
          dashboards: compactItems(context.operationManifest.dashboards),
          automations: compactItems(context.operationManifest.automations),
          roles: compactItems(context.operationManifest.roles),
          channels: compactItems(context.operationManifest.channels),
          metrics: context.operationManifest.metrics,
          policies: context.operationManifest.policies,
          glossary: context.operationManifest.glossary,
          unresolved: context.operationManifest.unresolved,
        }
      : null;

    return [
      '## Contexto operacional compilado do workspace Diex',
      'Use este contexto como fonte de verdade para adaptar respostas, dados, páginas e ações a esta operação. Não trate hipóteses ou lacunas como fatos.',
      'Mudanças estruturais exigem aprovação explícita; comunicação externa e promessas comerciais exigem revisão humana.',
      JSON.stringify({
        contextVersion: context.contextVersion,
        goal: context.goal,
        profileVersion: context.profileVersion,
        blueprintVersion: context.blueprintVersion,
        pageCatalogVersion: context.pageCatalogVersion,
        onboardingJourney: context.onboardingJourney,
        readinessPack: compactValue(context.readinessPack),
        commercialContext: compactValue(context.commercialContext),
        operationProfile,
        operationManifest,
        pages: compactValue(context.pageOverrides),
        policy: context.policy,
      }),
    ].join('\n');
  }

  async getPageCatalog(
    workspaceId: string,
  ): Promise<WorkspacePageCatalogState> {
    const [blueprintArtifact, profileArtifact] = await Promise.all([
      this.getLatestArtifact(
        workspaceId,
        WorkspaceArchitectureArtifactType.BLUEPRINT,
      ),
      this.getLatestArtifact(
        workspaceId,
        WorkspaceArchitectureArtifactType.OPERATION_PROFILE,
      ),
    ]);
    const blueprint = blueprintArtifact
      ? workspaceBlueprintSchema.parse(blueprintArtifact.payload)
      : null;

    return this.cacheLockService.withRenewableLock(
      async () =>
        this.synchronizePageCatalog({
          workspaceId,
          blueprint,
          profileVersion: profileArtifact?.version ?? null,
        }),
      `diex:workspace-page-catalog:${workspaceId}`,
      { ttl: 15_000, renewalIntervalMs: 4_000, maxRetries: 20 },
    );
  }

  async getPage(workspaceId: string, key: string) {
    const catalog = await this.getPageCatalog(workspaceId);

    return catalog.items.find((item) => item.key === key) ?? null;
  }

  async getPageData(
    workspaceId: string,
    pageKey: string,
  ): Promise<WorkspacePageDataResponse> {
    const [page, architecture] = await Promise.all([
      this.getPage(workspaceId, pageKey),
      this.inspectWorkspaceArchitecture(workspaceId),
    ]);

    if (!page) {
      throw new Error('Página operacional não encontrada.');
    }

    const contracts = [
      ...page.dataContracts,
      ...page.blocks.flatMap((block) => block.dataContracts),
    ]
      .filter(
        (contract, index, allContracts) =>
          allContracts.findIndex(({ key }) => key === contract.key) === index,
      )
      .slice(0, 24);
    const authContext = (() => {
      try {
        return getWorkspaceAuthContext();
      } catch {
        throw new ForbiddenException(
          'A leitura da página exige um membro autenticado no workspace.',
        );
      }
    })();

    if (authContext.workspace.id !== workspaceId) {
      throw new ForbiddenException(
        'A página operacional não pertence ao workspace autenticado.',
      );
    }
    const sources = await Promise.all(
      contracts.map(async (contract): Promise<WorkspacePageDataSource> => {
        const queriedAt = new Date().toISOString();

        if (!contract.objectName) {
          return {
            contractKey: contract.key,
            source: contract.source,
            kind: contract.kind,
            objectName: null,
            dataClassification: contract.dataClassification,
            records: [],
            count: null,
            returnedCount: 0,
            totalCount: null,
            isPartial: false,
            queriedAt,
            sourceUpdatedAt: null,
            freshnessStatus: 'NOT_APPLICABLE',
            fallback: contract.fallback,
            error: null,
          };
        }

        const object = architecture.objects.find(
          ({ nameSingular, namePlural, labelSingular }) =>
            nameSingular === contract.objectName ||
            namePlural === contract.objectName ||
            labelSingular === contract.objectName,
        );

        if (!object) {
          return {
            contractKey: contract.key,
            source: contract.source,
            kind: contract.kind,
            objectName: contract.objectName,
            dataClassification: contract.dataClassification,
            records: [],
            count: null,
            returnedCount: 0,
            totalCount: null,
            isPartial: false,
            queriedAt,
            sourceUpdatedAt: null,
            freshnessStatus: 'UNAVAILABLE',
            fallback: contract.fallback,
            error: 'O objeto configurado não está disponível neste workspace.',
          };
        }

        const selectableFields = contract.fieldNames.filter((fieldName) =>
          object.fields.some(({ name }) => name === fieldName),
        );
        const hasUpdatedAt = object.fields.some(
          ({ name }) => name === 'updatedAt',
        );

        if (hasUpdatedAt && !selectableFields.includes('updatedAt')) {
          selectableFields.push('updatedAt');
        }

        if (selectableFields.length === 0) {
          return {
            contractKey: contract.key,
            source: contract.source,
            kind: contract.kind,
            objectName: object.nameSingular,
            dataClassification: contract.dataClassification,
            records: [],
            count: null,
            returnedCount: 0,
            totalCount: null,
            isPartial: false,
            queriedAt,
            sourceUpdatedAt: null,
            freshnessStatus: 'UNAVAILABLE',
            fallback: contract.fallback,
            error:
              'O objeto ainda não possui campos publicáveis para esta página.',
          };
        }

        try {
          const result = await this.findRecordsService.execute({
            objectName: object.nameSingular,
            limit: 25,
            select: selectableFields,
            shouldBuildEffectiveSelectFields: true,
            authContext,
          });
          const records = result.success ? (result.result?.records ?? []) : [];
          const count = result.success ? (result.result?.count ?? 0) : null;
          const sourceUpdatedAt = records.reduce<string | null>(
            (latest, record) => {
              if (!record || typeof record !== 'object') {
                return latest;
              }

              const updatedAt = (record as Record<string, unknown>).updatedAt;

              if (typeof updatedAt !== 'string') {
                return latest;
              }

              return !latest || Date.parse(updatedAt) > Date.parse(latest)
                ? updatedAt
                : latest;
            },
            null,
          );
          const isPartial = count !== null && count > records.length;

          return {
            contractKey: contract.key,
            source: contract.source,
            kind: contract.kind,
            objectName: object.nameSingular,
            dataClassification: contract.dataClassification,
            records,
            count,
            returnedCount: records.length,
            totalCount: count,
            isPartial,
            queriedAt,
            sourceUpdatedAt,
            freshnessStatus: result.success
              ? isPartial
                ? 'PARTIAL'
                : 'LIVE'
              : 'UNAVAILABLE',
            fallback: contract.fallback,
            error: result.success
              ? null
              : (result.error ?? 'Não foi possível carregar esta fonte.'),
          };
        } catch (error) {
          return {
            contractKey: contract.key,
            source: contract.source,
            kind: contract.kind,
            objectName: object.nameSingular,
            dataClassification: contract.dataClassification,
            records: [],
            count: null,
            returnedCount: 0,
            totalCount: null,
            isPartial: false,
            queriedAt,
            sourceUpdatedAt: null,
            freshnessStatus: 'UNAVAILABLE',
            fallback: contract.fallback,
            error:
              error instanceof Error
                ? error.message
                : 'Não foi possível carregar esta fonte.',
          };
        }
      }),
    );

    const generatedAt = new Date().toISOString();

    return {
      pageKey,
      contractVersion: WORKSPACE_PAGE_CONTRACT_VERSION,
      generatedAt,
      isPartial: sources.some(({ isPartial }) => isPartial),
      hasErrors: sources.some(({ error }) => error !== null),
      sources,
    };
  }

  async getAdaptiveDrift(workspaceId: string) {
    const [
      blueprintArtifact,
      profileArtifact,
      pageCatalog,
      changeSetArtifact,
      architecture,
    ] = await Promise.all([
      this.getLatestArtifact(
        workspaceId,
        WorkspaceArchitectureArtifactType.BLUEPRINT,
      ),
      this.getLatestArtifact(
        workspaceId,
        WorkspaceArchitectureArtifactType.OPERATION_PROFILE,
      ),
      this.getPageCatalog(workspaceId),
      this.getLatestArtifact(
        workspaceId,
        WorkspaceArchitectureArtifactType.CHANGE_SET,
      ),
      this.inspectWorkspaceArchitecture(workspaceId),
    ]);
    const blueprint = blueprintArtifact
      ? workspaceBlueprintSchema.safeParse(blueprintArtifact.payload)
      : null;
    const expectedPages = blueprint?.success ? blueprint.data.pages : [];
    const normalizeArchitectureKey = (value: string) =>
      value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '');
    const catalogByKey = new Map(
      pageCatalog.items.map((page) => [page.key, page]),
    );
    const drift: Array<{
      key: string;
      severity: 'INFO' | 'WARNING' | 'BLOCKED';
      message: string;
      action: string;
    }> = [];

    if (!profileArtifact) {
      drift.push({
        key: 'profile-missing',
        severity: 'BLOCKED',
        message: 'O perfil operacional ainda não foi compilado.',
        action: 'Executar a entrevista de onboarding.',
      });
    }
    if (!blueprintArtifact || !blueprint?.success) {
      drift.push({
        key: 'blueprint-missing',
        severity: 'BLOCKED',
        message: 'A recomendação estrutural ainda não foi revisada.',
        action: 'Gerar e aprovar a arquitetura recomendada.',
      });
    }
    if (
      blueprint?.success &&
      !['ACTIVE', 'PARTIALLY_APPLIED'].includes(blueprint.data.status)
    ) {
      drift.push({
        key: 'blueprint-not-active',
        severity: 'WARNING',
        message: `O blueprint está ${blueprint.data.status}, não ativo.`,
        action: 'Revisar, aprovar e publicar o change set pendente.',
      });
    }

    const publication = (
      changeSetArtifact?.payload as {
        publication?: { pendingNativeMaterialization?: boolean };
      }
    )?.publication;
    if (publication?.pendingNativeMaterialization) {
      drift.push({
        key: 'publication-materialization-pending',
        severity: 'WARNING',
        message:
          'Parte da arquitetura está registrada no manifesto, mas ainda não foi materializada por um adaptador nativo.',
        action:
          'Revisar os adaptadores pendentes antes de tratar a estrutura como completamente publicada.',
      });
    }

    if (blueprint?.success) {
      for (const component of blueprint.data.objects.filter(
        ({ required }) => required,
      )) {
        const expectedObjectName =
          typeof component.configuration?.objectName === 'string'
            ? component.configuration.objectName
            : component.key;
        const objectExists = architecture.objects.some((object) =>
          [object.nameSingular, object.namePlural, object.labelSingular].some(
            (candidate) =>
              normalizeArchitectureKey(candidate) ===
              normalizeArchitectureKey(expectedObjectName),
          ),
        );

        if (!objectExists) {
          drift.push({
            key: `object-missing:${component.key}`,
            severity: 'BLOCKED',
            message: `O objeto recomendado ${component.label} não está publicado no workspace.`,
            action:
              'Publicar o change set aprovado ou remapear o objeto antes de usar as páginas dependentes.',
          });
        }
      }

      for (const component of blueprint.data.fields.filter(
        ({ required }) => required,
      )) {
        const configuration = component.configuration ?? {};
        const objectName =
          typeof configuration.objectKey === 'string'
            ? configuration.objectKey
            : typeof configuration.objectName === 'string'
              ? configuration.objectName
              : null;
        const fieldName =
          typeof configuration.name === 'string'
            ? configuration.name
            : (component.key.split('.').pop() ?? component.key);
        const object = objectName
          ? architecture.objects.find((candidate) =>
              [
                candidate.nameSingular,
                candidate.namePlural,
                candidate.labelSingular,
              ].some(
                (value) =>
                  normalizeArchitectureKey(value) ===
                  normalizeArchitectureKey(objectName),
              ),
            )
          : null;

        if (object && !object.fields.some(({ name }) => name === fieldName)) {
          drift.push({
            key: `field-missing:${component.key}`,
            severity: 'BLOCKED',
            message: `O campo recomendado ${component.label} não existe em ${object.labelSingular}.`,
            action:
              'Publicar o campo aprovado ou remapear o contrato para um campo existente.',
          });
        }
      }
    }

    for (const page of expectedPages) {
      const current = catalogByKey.get(page.key);

      if (!current) {
        drift.push({
          key: `page-missing:${page.key}`,
          severity: page.required ? 'BLOCKED' : 'WARNING',
          message: `A página recomendada ${page.label} não está no catálogo.`,
          action:
            'Sincronizar a arquitetura aprovada com o catálogo adaptativo.',
        });
        continue;
      }
      if (page.required && current.status !== 'ACTIVE') {
        drift.push({
          key: `page-inactive:${page.key}`,
          severity: page.key === 'first-steps' ? 'BLOCKED' : 'WARNING',
          message: `A página obrigatória ${current.label} está ${current.status}.`,
          action: 'Restaurar a página e preservar sua posição operacional.',
        });
      }
      if (
        !current.capabilityContract ||
        current.dataContracts.length === 0 ||
        current.actions.length === 0 ||
        current.blocks.some(
          (block) =>
            block.dataContracts.length === 0 || block.actions.length === 0,
        )
      ) {
        drift.push({
          key: `page-contract:${page.key}`,
          severity: 'WARNING',
          message: `A página ${current.label} tem componente sem contrato de dados ou ação.`,
          action:
            'Recompilar os contratos adaptativos antes de exibir a página.',
        });
      }
      for (const contract of [
        ...current.dataContracts,
        ...current.blocks.flatMap((block) => block.dataContracts),
      ]) {
        if (!contract.objectName) {
          continue;
        }

        const object = architecture.objects.find(
          ({ nameSingular, namePlural, labelSingular }) =>
            nameSingular === contract.objectName ||
            namePlural === contract.objectName ||
            labelSingular === contract.objectName,
        );

        if (!object) {
          drift.push({
            key: `contract-object:${page.key}:${contract.key}`,
            severity: contract.required ? 'BLOCKED' : 'WARNING',
            message: `O contrato ${contract.key} aponta para um objeto que não está publicado.`,
            action:
              'Remapear o contrato para um objeto existente ou publicar o objeto aprovado.',
          });
          continue;
        }

        const missingFields = contract.fieldNames.filter(
          (fieldName) => !object.fields.some(({ name }) => name === fieldName),
        );

        if (missingFields.length > 0) {
          drift.push({
            key: `contract-fields:${page.key}:${contract.key}`,
            severity: contract.required ? 'BLOCKED' : 'WARNING',
            message: `O contrato ${contract.key} perdeu campos: ${missingFields.join(', ')}.`,
            action:
              'Remapear os campos ou gerar uma nova versão do contrato da página.',
          });
        }
      }
      if (current.emptyState.actionRoute !== '/diex/first-steps') {
        drift.push({
          key: `page-empty-state:${page.key}`,
          severity: 'WARNING',
          message: `A página ${current.label} encaminha um workspace vazio para uma tela operacional sem dados.`,
          action:
            'Direcionar o estado vazio para a próxima ação da ativação operacional.',
        });
      }
    }

    const expectedPageKeys = new Set(expectedPages.map(({ key }) => key));
    for (const page of pageCatalog.items) {
      if (
        !expectedPageKeys.has(page.key) &&
        page.emptyState.actionRoute !== '/diex/first-steps'
      ) {
        drift.push({
          key: `custom-page-empty-state:${page.key}`,
          severity: 'WARNING',
          message: `A página personalizada ${page.label} não possui uma rota segura para workspace sem dados.`,
          action:
            'Direcionar o estado vazio para a próxima ação operacional ou configurar um contrato de dados.',
        });
      }
    }

    return {
      status: drift.some(({ severity }) => severity === 'BLOCKED')
        ? 'REVIEW_REQUIRED'
        : drift.length > 0
          ? 'ADJUSTMENT_RECOMMENDED'
          : 'ALIGNED',
      blueprintVersion: blueprintArtifact?.version ?? null,
      pageCatalogVersion: pageCatalog.version,
      drift,
      nextReview:
        drift.length > 0
          ? 'imediata'
          : 'após nova aprovação ou mudança de contexto',
    };
  }

  private normalizeCustomPageBlocks({
    pageKey,
    pageLabel,
    blocks,
    dataSources,
    metadataObjects = [],
  }: {
    pageKey: string;
    pageLabel: string;
    blocks: WorkspaceCustomPageBlockInput[];
    dataSources: string[];
    metadataObjects?: WorkspacePageMetadataObject[];
  }): WorkspacePageBlock[] {
    return blocks.slice(0, 12).map((block, position) => {
      const blockKey =
        block.key?.trim() || `${toPageSlug(block.label)}-${position + 1}`;
      const blockType = PAGE_BLOCK_TYPES.has(block.type ?? '')
        ? block.type
        : 'LIST';
      const blockDataSources = block.dataSources
        ? [...new Set(block.dataSources.map((source) => source.trim()))].filter(
            Boolean,
          )
        : [];
      const resolvedDataSources =
        blockDataSources.length > 0 ? blockDataSources : dataSources;

      return workspacePageBlockSchema.parse({
        key: `${pageKey}-${blockKey}`,
        label: block.label.trim(),
        type: blockType,
        title: block.label.trim(),
        description:
          block.description?.trim() ||
          `Acompanha ${block.label.trim().toLowerCase()} em ${pageLabel.toLowerCase()}.`,
        dataSources: resolvedDataSources,
        dataContracts: inferWorkspacePageDataContracts({
          pageKey: `${pageKey}-${blockKey}`,
          dataSources: resolvedDataSources,
          metadataObjects,
        }),
        actions: buildWorkspacePageActions({
          pageKey: `${pageKey}-${blockKey}`,
          route: block.actionRoute?.startsWith('/')
            ? block.actionRoute
            : '/diex/first-steps',
          nativeRoute: null,
        }),
        actionLabel: block.actionLabel?.trim() || 'Abrir primeiros passos',
        actionRoute: block.actionRoute?.startsWith('/')
          ? block.actionRoute
          : '/diex/first-steps',
        sourceTemplateIds: [],
        configuration: {
          pageKey,
          ...(block.configuration ?? {}),
        },
        position,
      });
    });
  }

  async createCustomPage({
    workspaceId,
    label,
    description,
    aiGenerated = false,
    renderer = 'CUSTOM',
    icon = 'chart',
    navigationGroup = 'Operação personalizada',
    capabilities = [],
    dataSources,
    blocks = [],
  }: {
    workspaceId: string;
    label: string;
    description?: string;
    aiGenerated?: boolean;
    renderer?: WorkspacePageRenderer;
    icon?: string;
    navigationGroup?: string;
    capabilities?: string[];
    dataSources?: string[];
    blocks?: WorkspaceCustomPageBlockInput[];
  }) {
    const [catalog, architecture] = await Promise.all([
      this.getPageCatalog(workspaceId),
      this.inspectWorkspaceArchitecture(workspaceId),
    ]);
    const baseSlug = toPageSlug(label);
    const key = `custom-${baseSlug}-${v4().slice(0, 8)}`;
    const now = new Date().toISOString();
    const normalizedDescription =
      description?.trim() ||
      `Página operacional para acompanhar ${label.trim().toLowerCase()}.`;
    const normalizedCapabilities = [
      ...new Set(capabilities.map((capability) => capability.trim())),
    ].filter(Boolean);
    const normalizedDataSources = [
      ...new Set((dataSources ?? []).map((source) => source.trim())),
    ].filter(Boolean);
    const adaptiveDefaultDataSources = getAdaptiveDefaultDataSources(
      architecture.objects,
      `${label} ${normalizedDescription}`,
    );
    const pageDataSources =
      normalizedDataSources.length > 0
        ? normalizedDataSources
        : adaptiveDefaultDataSources;
    const customBlocks = this.normalizeCustomPageBlocks({
      pageKey: key,
      pageLabel: label.trim(),
      blocks,
      dataSources: pageDataSources,
      metadataObjects: architecture.objects,
    });
    const item = workspacePageCatalogItemSchema.parse({
      key,
      label: label.trim(),
      description: normalizedDescription,
      route: toPageRoute(key),
      renderer,
      icon: icon.trim() || 'chart',
      navigationGroup: navigationGroup.trim() || 'Operação personalizada',
      capabilities: normalizedCapabilities,
      blocks:
        customBlocks.length > 0
          ? customBlocks
          : this.buildPageBlocks({
              page: {
                key,
                label: label.trim(),
                description: normalizedDescription,
                required: false,
                benefit: 'Centraliza uma decisão operacional específica.',
                sourceTemplateIds: [],
                configuration: { renderer },
              },
              blueprintBlocks: [],
              renderer,
              dataSources: pageDataSources,
              route: toPageRoute(key),
              metadataObjects: architecture.objects,
            }),
      lifecycle: 'CUSTOM',
      copyOrigin: aiGenerated ? 'AI' : 'USER',
      status: 'ACTIVE',
      sourceTemplateIds: [],
      primaryAction: 'Definir a próxima ação da operação',
      dataSources: pageDataSources,
      capabilityContract: {
        version: WORKSPACE_PAGE_CONTRACT_VERSION,
        key,
        dependencies: [
          ...new Set([...normalizedCapabilities, ...pageDataSources]),
        ],
        fallbackRoute: '/diex/first-steps',
      },
      dataContracts: inferWorkspacePageDataContracts({
        pageKey: key,
        dataSources: pageDataSources,
        metadataObjects: architecture.objects,
      }),
      actions: buildWorkspacePageActions({
        pageKey: key,
        route: toPageRoute(key),
        nativeRoute: null,
      }),
      emptyState: {
        title: `${label.trim()} começa aqui`,
        description:
          'Use esta página para centralizar decisões, próximos passos e resultados da operação.',
        actionLabel: 'Abrir primeiros passos',
        actionRoute: '/diex/first-steps',
      },
      permissions: ['workspace_access'],
      aiGenerated,
      editable: true,
      showInNavigation: true,
      position: catalog.items.length,
      createdAt: now,
    });

    return this.savePageCatalog(workspaceId, {
      ...catalog,
      items: [...catalog.items, item],
      updatedAt: now,
    });
  }

  async updatePage({
    workspaceId,
    key,
    label,
    description,
    showInNavigation,
    position,
    renderer,
    icon,
    navigationGroup,
    capabilities,
    dataSources,
    primaryAction,
    blocks,
  }: {
    workspaceId: string;
    key: string;
    label?: string;
    description?: string;
    showInNavigation?: boolean;
    position?: number;
    renderer?: WorkspacePageRenderer;
    icon?: string;
    navigationGroup?: string;
    capabilities?: string[];
    dataSources?: string[];
    primaryAction?: string;
    blocks?: WorkspaceCustomPageBlockInput[];
  }) {
    const [catalog, architecture] = await Promise.all([
      this.getPageCatalog(workspaceId),
      this.inspectWorkspaceArchitecture(workspaceId),
    ]);
    const current = catalog.items.find((item) => item.key === key);

    if (!current) {
      throw new Error('Página operacional não encontrada.');
    }

    if (!current.editable) {
      throw new Error(
        'Esta página está protegida contra edição neste workspace.',
      );
    }

    const normalizedCapabilities = capabilities
      ? [
          ...new Set(capabilities.map((capability) => capability.trim())),
        ].filter(Boolean)
      : undefined;
    const normalizedDataSources = dataSources
      ? [...new Set(dataSources.map((source) => source.trim()))].filter(Boolean)
      : undefined;
    const pageDataSources = normalizedDataSources ?? current.dataSources;
    const hasUpdatedPageDataSources = normalizedDataSources !== undefined;
    const rebuiltBlocksFromPageSources = hasUpdatedPageDataSources
      ? current.blocks.map((block) => {
          const blockUsesPageSources =
            block.dataSources.length === current.dataSources.length &&
            block.dataSources.every(
              (source, index) => source === current.dataSources[index],
            );
          const blockKeyPrefix = `${current.key}-`;

          return {
            key: block.key.startsWith(blockKeyPrefix)
              ? block.key.slice(blockKeyPrefix.length)
              : block.key,
            label: block.label,
            type: block.type,
            description: block.description,
            dataSources: blockUsesPageSources
              ? pageDataSources
              : block.dataSources,
            actionLabel: block.actionLabel,
            actionRoute: block.actionRoute,
            configuration: block.configuration,
          };
        })
      : null;
    const normalizedBlocks =
      blocks !== undefined
        ? this.normalizeCustomPageBlocks({
            pageKey: current.key,
            pageLabel: label?.trim() || current.label,
            blocks,
            dataSources: pageDataSources,
            metadataObjects: architecture.objects,
          })
        : rebuiltBlocksFromPageSources
          ? this.normalizeCustomPageBlocks({
              pageKey: current.key,
              pageLabel: label?.trim() || current.label,
              blocks: rebuiltBlocksFromPageSources,
              dataSources: pageDataSources,
              metadataObjects: architecture.objects,
            })
          : current.blocks;
    const updatedBlocks =
      normalizedBlocks.length > 0
        ? normalizedBlocks
        : this.buildPageBlocks({
            page: {
              key: current.key,
              label: label?.trim() || current.label,
              description: description?.trim() || current.description,
              required: false,
              benefit: 'Centraliza uma decisão operacional específica.',
              sourceTemplateIds: current.sourceTemplateIds,
              configuration: {
                renderer: renderer ?? current.renderer,
              },
            },
            blueprintBlocks: [],
            renderer: renderer ?? current.renderer,
            dataSources: pageDataSources,
            route: current.route,
            metadataObjects: architecture.objects,
          });
    const hasAdaptiveContentUpdate = Boolean(
      label?.trim() ||
      description?.trim() ||
      renderer ||
      icon?.trim() ||
      navigationGroup?.trim() ||
      normalizedCapabilities ||
      normalizedDataSources ||
      primaryAction?.trim() ||
      blocks !== undefined,
    );
    const updated = workspacePageCatalogItemSchema.parse({
      ...current,
      ...(label?.trim() ? { label: label.trim() } : {}),
      ...(description?.trim() ? { description: description.trim() } : {}),
      ...(typeof showInNavigation === 'boolean' ? { showInNavigation } : {}),
      ...(typeof position === 'number' && position >= 0
        ? { position: Math.floor(position) }
        : {}),
      ...(renderer ? { renderer } : {}),
      ...(icon?.trim() ? { icon: icon.trim() } : {}),
      ...(navigationGroup?.trim()
        ? { navigationGroup: navigationGroup.trim() }
        : {}),
      ...(normalizedCapabilities
        ? {
            capabilities: normalizedCapabilities,
          }
        : {}),
      ...(normalizedDataSources !== undefined
        ? { dataSources: pageDataSources }
        : {}),
      ...(primaryAction?.trim() ? { primaryAction: primaryAction.trim() } : {}),
      copyOrigin: hasAdaptiveContentUpdate ? 'USER' : current.copyOrigin,
      dataContracts: inferWorkspacePageDataContracts({
        pageKey: current.key,
        dataSources: pageDataSources,
        metadataObjects: architecture.objects,
      }),
      actions: buildWorkspacePageActions({
        pageKey: current.key,
        route: current.route,
        nativeRoute: current.nativeRoute,
      }),
      capabilityContract: {
        version: WORKSPACE_PAGE_CONTRACT_VERSION,
        key: current.key,
        dependencies: [
          ...new Set([
            ...(normalizedCapabilities ?? current.capabilities),
            ...pageDataSources,
          ]),
        ],
        fallbackRoute:
          current.capabilityContract?.fallbackRoute ===
          '/diex/pages/first-steps'
            ? '/diex/first-steps'
            : (current.capabilityContract?.fallbackRoute ??
              '/diex/first-steps'),
      },
      ...(blocks !== undefined || rebuiltBlocksFromPageSources !== null
        ? { blocks: updatedBlocks }
        : {}),
    });

    const nextItems = catalog.items.map((item) =>
      item.key === key ? updated : item,
    );
    const reorderedItems =
      typeof position === 'number' && position >= 0
        ? (() => {
            const itemsWithoutCurrent = nextItems.filter(
              (item) => item.key !== key,
            );
            const targetPosition = Math.min(
              Math.floor(position),
              itemsWithoutCurrent.length,
            );

            itemsWithoutCurrent.splice(targetPosition, 0, updated);

            return itemsWithoutCurrent.map((item, itemPosition) => ({
              ...item,
              position: itemPosition,
            }));
          })()
        : nextItems;

    return this.savePageCatalog(workspaceId, {
      ...catalog,
      items: reorderedItems,
      updatedAt: new Date().toISOString(),
    });
  }

  async archivePage(workspaceId: string, key: string) {
    const catalog = await this.getPageCatalog(workspaceId);
    const current = catalog.items.find((item) => item.key === key);

    if (!current) {
      throw new Error('Página operacional não encontrada.');
    }

    if (current.key === 'first-steps') {
      throw new Error(
        'A página de ativação permanece disponível para recuperar a operação. Você pode ocultá-la do menu, mas não arquivá-la.',
      );
    }

    return this.savePageCatalog(workspaceId, {
      ...catalog,
      items: catalog.items.map((item) =>
        item.key === key
          ? { ...item, status: 'ARCHIVED', showInNavigation: false }
          : item,
      ),
      updatedAt: new Date().toISOString(),
    });
  }

  async restorePage(workspaceId: string, key: string) {
    const catalog = await this.getPageCatalog(workspaceId);
    const current = catalog.items.find((item) => item.key === key);

    if (!current) {
      throw new Error('Página operacional não encontrada.');
    }

    return this.savePageCatalog(workspaceId, {
      ...catalog,
      items: catalog.items.map((item) =>
        item.key === key
          ? { ...item, status: 'ACTIVE', showInNavigation: true }
          : item,
      ),
      updatedAt: new Date().toISOString(),
    });
  }

  async validateChangeSet(changeSet: WorkspaceChangeSet) {
    const parsed = workspaceChangeSetSchema.safeParse(changeSet);
    const errors = parsed.success
      ? []
      : parsed.error.issues.map(
          ({ path, message }) => `${path.join('.') || 'changeSet'}: ${message}`,
        );
    const blockedOperations = changeSet.operations.filter(
      ({ action, risk, blockedReason }) =>
        action === 'ARCHIVE' || risk === 'BLOCKED' || isDefined(blockedReason),
    );

    errors.push(
      ...blockedOperations.map(
        ({ label, blockedReason }) =>
          `${label}: ${blockedReason ?? 'operação destrutiva bloqueada'}`,
      ),
    );

    return {
      valid: errors.length === 0,
      errors,
      warnings: changeSet.warnings,
      operationCount: changeSet.operations.length,
      mutatingOperationCount: changeSet.operations.filter(
        ({ action }) => action !== 'NO_CHANGE',
      ).length,
    };
  }

  async approveChangeSet({
    workspaceId,
    version,
  }: {
    workspaceId: string;
    version: number;
  }) {
    const [artifact, latestChangeSetArtifact, latestBlueprintArtifact] =
      await Promise.all([
        this.getArtifactByVersion(
          workspaceId,
          WorkspaceArchitectureArtifactType.CHANGE_SET,
          version,
        ),
        this.getLatestArtifact(
          workspaceId,
          WorkspaceArchitectureArtifactType.CHANGE_SET,
        ),
        this.getLatestArtifact(
          workspaceId,
          WorkspaceArchitectureArtifactType.BLUEPRINT,
        ),
      ]);
    const changeSet = workspaceChangeSetSchema.parse(artifact.payload);

    if (
      !latestChangeSetArtifact ||
      latestChangeSetArtifact.id !== artifact.id
    ) {
      throw new Error(
        'Somente o pacote de mudanças mais recente pode ser aprovado.',
      );
    }

    if (
      !latestBlueprintArtifact ||
      changeSet.blueprintVersion !== latestBlueprintArtifact.version
    ) {
      throw new Error(
        'O pacote de mudanças não corresponde ao blueprint mais recente.',
      );
    }

    const validation = await this.validateChangeSet(changeSet);

    if (!validation.valid) {
      throw new Error(
        `Workspace change set cannot be approved: ${validation.errors.join('; ')}`,
      );
    }

    if (
      artifact.status === WorkspaceArchitectureArtifactStatus.ACTIVE ||
      artifact.status ===
        WorkspaceArchitectureArtifactStatus.PARTIALLY_APPLIED ||
      changeSet.status === 'ACTIVE' ||
      changeSet.status === 'PARTIALLY_APPLIED'
    ) {
      return {
        approved: true,
        idempotentReplay: true,
        alreadyPublished: true,
        version,
        changeSetId: changeSet.id,
        approvedAt: artifact.approvedAt,
        nextAction: null,
      };
    }

    if (
      artifact.status === WorkspaceArchitectureArtifactStatus.APPROVED &&
      changeSet.status === 'APPROVED'
    ) {
      return {
        approved: true,
        idempotentReplay: true,
        version,
        changeSetId: changeSet.id,
        approvedAt: artifact.approvedAt,
        nextAction: 'publish_approved_architecture_in_admin_ui',
      };
    }

    if (
      artifact.status !==
        WorkspaceArchitectureArtifactStatus.AWAITING_APPROVAL ||
      changeSet.status !== 'AWAITING_APPROVAL'
    ) {
      throw new Error(
        'O pacote de mudanças não está em estado válido para aprovação.',
      );
    }

    const approvedAt = new Date();
    const approvedChangeSet = workspaceChangeSetSchema.parse({
      ...changeSet,
      status: 'APPROVED',
      approvedAt: approvedAt.toISOString(),
    });

    await this.updateArtifact(workspaceId, artifact.id, {
      status: WorkspaceArchitectureArtifactStatus.APPROVED,
      approvedAt,
      payload: approvedChangeSet,
    });

    return {
      approved: true,
      version,
      changeSetId: approvedChangeSet.id,
      approvedAt,
      nextAction: 'publish_approved_architecture_in_admin_ui',
    };
  }

  async applyApprovedChangeSet({
    workspaceId,
    version,
  }: {
    workspaceId: string;
    version: number;
  }) {
    return this.cacheLockService.withRenewableLock(
      async (lock) => {
        const artifact = await this.getArtifactByVersion(
          workspaceId,
          WorkspaceArchitectureArtifactType.CHANGE_SET,
          version,
        );
        const changeSet = workspaceChangeSetSchema.parse(artifact.payload);

        if (
          artifact.status === WorkspaceArchitectureArtifactStatus.ACTIVE ||
          artifact.status ===
            WorkspaceArchitectureArtifactStatus.PARTIALLY_APPLIED ||
          changeSet.status === 'ACTIVE' ||
          changeSet.status === 'PARTIALLY_APPLIED'
        ) {
          return {
            applied: true,
            idempotentReplay: true,
            version,
            changeSetId: changeSet.id,
            status: changeSet.status,
            publication: changeSet.publication,
          };
        }

        const [latestChangeSetArtifact, latestBlueprintArtifact] =
          await Promise.all([
            this.getLatestArtifact(
              workspaceId,
              WorkspaceArchitectureArtifactType.CHANGE_SET,
            ),
            this.getLatestArtifact(
              workspaceId,
              WorkspaceArchitectureArtifactType.BLUEPRINT,
            ),
          ]);

        if (
          !latestChangeSetArtifact ||
          latestChangeSetArtifact.id !== artifact.id
        ) {
          throw new Error(
            'Somente o pacote de mudanças aprovado mais recente pode ser publicado.',
          );
        }

        if (
          !latestBlueprintArtifact ||
          changeSet.blueprintVersion !== latestBlueprintArtifact.version
        ) {
          throw new Error(
            'O pacote aprovado não corresponde ao blueprint mais recente.',
          );
        }

        if (
          artifact.status !== WorkspaceArchitectureArtifactStatus.APPROVED ||
          changeSet.status !== 'APPROVED'
        ) {
          throw new Error(
            'Workspace change set requires explicit approval before application.',
          );
        }

        await this.updateArtifact(workspaceId, artifact.id, {
          status: WorkspaceArchitectureArtifactStatus.APPLYING,
          payload: { ...changeSet, status: 'APPLYING' },
        });

        const applied: Array<{
          operationId: string;
          resourceId?: string;
          adapter?: string;
          materialization?: 'DIEX_CATALOG' | 'MANIFEST';
          materializationStatus?: WorkspaceDeclarativeMaterializationStatus;
        }> = [];
        const createdNativeOperations: Array<{
          operationId: string;
          resourceType: 'OBJECT' | 'FIELD';
          resourceId: string;
        }> = [];

        try {
          for (const operation of changeSet.operations) {
            await lock.assertOwnership();

            if (operation.action === 'NO_CHANGE') {
              applied.push({ operationId: operation.id });
              continue;
            }

            if (!operation.desiredState) {
              throw new Error(
                `${operation.label}: a operação aprovada não possui estado desejado.`,
              );
            }

            if (!['OBJECT', 'FIELD'].includes(operation.resourceType)) {
              const adapterResult = this.declarativeAdapterRegistry.apply({
                workspaceId,
                operation,
              });
              applied.push({
                operationId: operation.id,
                resourceId: adapterResult.resourceId,
                adapter: adapterResult.adapter,
                materialization: adapterResult.materialization,
                materializationStatus: adapterResult.materializationStatus,
              });
              continue;
            }

            if (operation.action !== 'CREATE') {
              throw new Error(
                `${operation.label}: somente criação nativa de objeto ou campo é suportada neste change set.`,
              );
            }

            const current =
              await this.inspectWorkspaceArchitecture(workspaceId);
            const existing =
              operation.resourceType === 'OBJECT'
                ? current.objects.find(
                    ({ nameSingular }) =>
                      nameSingular === operation.resourceKey,
                  )
                : (() => {
                    const [objectKey, fieldName] =
                      operation.resourceKey.split('.');
                    const object = current.objects.find(
                      ({ nameSingular }) => nameSingular === objectKey,
                    );

                    return current.fields.find(
                      ({ objectMetadataId, name }) =>
                        objectMetadataId === object?.id && name === fieldName,
                    );
                  })();

            if (existing) {
              applied.push({
                operationId: operation.id,
                resourceId: existing.id,
              });
              continue;
            }

            const created =
              operation.resourceType === 'OBJECT'
                ? await this.objectMetadataService.createOneObject({
                    workspaceId,
                    createObjectInput: operation.desiredState as Parameters<
                      typeof this.objectMetadataService.createOneObject
                    >[0]['createObjectInput'],
                  })
                : await this.createFieldFromChangeOperation({
                    workspaceId,
                    desiredState: operation.desiredState,
                  });

            applied.push({ operationId: operation.id, resourceId: created.id });
            createdNativeOperations.push({
              operationId: operation.id,
              resourceType: operation.resourceType as 'OBJECT' | 'FIELD',
              resourceId: created.id,
            });
          }

          await this.flatEntityMapsCacheService.invalidateFlatEntityMaps({
            workspaceId,
          });
          const appliedAt = new Date();
          const manifestApplications = applied.filter(
            ({ materialization }) => materialization === 'MANIFEST',
          );
          const pendingNativeResourceTypes = [
            ...new Set(
              manifestApplications
                .map(
                  ({ operationId }) =>
                    changeSet.operations.find(
                      (operation) => operation.id === operationId,
                    )?.resourceType,
                )
                .filter((resourceType): resourceType is string =>
                  Boolean(resourceType),
                ),
            ),
          ];
          const nativeOperationCount = applied.filter(
            ({ operationId, materialization }) =>
              materialization === undefined &&
              changeSet.operations.some(
                (operation) =>
                  operation.id === operationId &&
                  operation.action !== 'NO_CHANGE',
              ),
          ).length;
          const publication = {
            nativeOperationCount,
            manifestOperationCount: manifestApplications.length,
            pendingNativeMaterialization: manifestApplications.length > 0,
            pendingNativeResourceTypes,
            materializedAdapters: [
              ...new Set(
                manifestApplications
                  .map(({ adapter }) => adapter)
                  .filter((adapter): adapter is string => Boolean(adapter)),
              ),
            ],
            rollback: {
              attempted: false,
              completed: false,
              rolledBackOperationIds: [],
              failedOperationIds: [],
            },
          };
          const publicationStatus = publication.pendingNativeMaterialization
            ? ('PARTIALLY_APPLIED' as const)
            : ('ACTIVE' as const);
          const artifactPublicationStatus =
            publication.pendingNativeMaterialization
              ? WorkspaceArchitectureArtifactStatus.PARTIALLY_APPLIED
              : WorkspaceArchitectureArtifactStatus.ACTIVE;
          const activeChangeSet = workspaceChangeSetSchema.parse({
            ...changeSet,
            status: publicationStatus,
            appliedAt: appliedAt.toISOString(),
            publication,
          });

          await this.updateArtifact(workspaceId, artifact.id, {
            status: artifactPublicationStatus,
            appliedAt,
            completedAt: appliedAt,
            payload: activeChangeSet,
            errorDetails: null,
          });
          const blueprintArtifact = await this.getArtifactByVersion(
            workspaceId,
            WorkspaceArchitectureArtifactType.BLUEPRINT,
            changeSet.blueprintVersion,
          );
          const publishedOperations = [
            ...new Map(
              [
                ...((blueprintArtifact.payload as WorkspaceBlueprint)
                  .publishedOperations ?? []),
                ...changeSet.operations
                  .filter(({ action }) => action !== 'NO_CHANGE')
                  .map((operation) => {
                    const appliedOperation = applied.find(
                      ({ operationId }) => operationId === operation.id,
                    );

                    return {
                      operationId: operation.id,
                      resourceType: operation.resourceType,
                      resourceKey: operation.resourceKey,
                      publishedAt: appliedAt.toISOString(),
                      adapter:
                        appliedOperation?.adapter ??
                        'workspace-native-metadata-adapter@1.0.0',
                      materialization:
                        appliedOperation?.materialization ?? 'MANIFEST',
                    };
                  }),
              ].map((operation) => [
                `${operation.resourceType}:${operation.resourceKey}`,
                operation,
              ]),
            ).values(),
          ];
          const activeBlueprint = workspaceBlueprintSchema.parse({
            ...blueprintArtifact.payload,
            status: publicationStatus,
            publishedOperations,
          });

          await this.updateArtifact(workspaceId, blueprintArtifact.id, {
            status: artifactPublicationStatus,
            appliedAt,
            completedAt: appliedAt,
            payload: activeBlueprint,
          });
          await this.synchronizePageCatalog({
            workspaceId,
            blueprint: activeBlueprint,
            profileVersion: activeBlueprint.profileVersion,
          });
          return {
            applied: true,
            idempotentReplay: false,
            version,
            changeSetId: changeSet.id,
            status: publicationStatus,
            appliedOperations: applied,
            publication,
            appliedAt,
          };
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : 'Unknown publication error';
          const rollback = await this.compensateNativeOperations({
            workspaceId,
            operations: createdNativeOperations,
          });
          const rollbackCompleted = rollback.failedOperationIds.length === 0;
          const rollbackStatus = rollbackCompleted ? 'ROLLED_BACK' : 'FAILED';
          const rollbackArtifactStatus = rollbackCompleted
            ? WorkspaceArchitectureArtifactStatus.ROLLED_BACK
            : WorkspaceArchitectureArtifactStatus.FAILED;
          const rollbackMessage = rollbackCompleted
            ? `${message} Publicação nativa compensada.`
            : `${message} A compensação nativa não foi concluída para todas as operações.`;

          await this.updateArtifact(workspaceId, artifact.id, {
            status: rollbackArtifactStatus,
            payload: {
              ...changeSet,
              status: rollbackStatus,
              publication: {
                ...changeSet.publication,
                rollback,
              },
            },
            errorDetails: { markdown: rollbackMessage },
          });

          throw error;
        }
      },
      `diex:workspace-architecture:apply:${workspaceId}`,
      { ttl: 30_000, renewalIntervalMs: 8_000, maxRetries: 100 },
    );
  }

  private async compensateNativeOperations({
    workspaceId,
    operations,
  }: {
    workspaceId: string;
    operations: Array<{
      operationId: string;
      resourceType: 'OBJECT' | 'FIELD';
      resourceId: string;
    }>;
  }) {
    const rolledBackOperationIds: string[] = [];
    const failedOperationIds: string[] = [];

    for (const operation of [...operations].reverse()) {
      try {
        if (operation.resourceType === 'FIELD') {
          await this.fieldMetadataService.deleteOneField({
            workspaceId,
            deleteOneFieldInput: { id: operation.resourceId },
          });
        } else {
          await this.objectMetadataService.deleteOneObject({
            workspaceId,
            deleteObjectInput: { id: operation.resourceId },
          });
        }

        rolledBackOperationIds.push(operation.operationId);
      } catch {
        failedOperationIds.push(operation.operationId);
      }
    }

    if (operations.length > 0) {
      await this.flatEntityMapsCacheService.invalidateFlatEntityMaps({
        workspaceId,
      });
    }

    return {
      attempted: operations.length > 0,
      completed: failedOperationIds.length === 0,
      rolledBackOperationIds,
      failedOperationIds,
    };
  }

  private async createFieldFromChangeOperation({
    workspaceId,
    desiredState,
  }: {
    workspaceId: string;
    desiredState: Record<string, unknown>;
  }) {
    const objectKey = desiredState.objectKey;
    const objectName =
      typeof objectKey === 'string' ? toCamelCase(objectKey) : null;

    if (!objectName) {
      throw new Error('Campo sem objeto de destino.');
    }

    const current = await this.inspectWorkspaceArchitecture(workspaceId);
    const object = current.objects.find(
      ({ nameSingular }) => nameSingular === objectName,
    );

    if (!object) {
      throw new Error(
        `Objeto ${objectName} não encontrado para publicar o campo.`,
      );
    }

    return this.fieldMetadataService.createOneField({
      workspaceId,
      createFieldInput: {
        objectMetadataId: object.id,
        type: (desiredState.type ?? 'TEXT') as never,
        name: desiredState.name as string,
        label: desiredState.label as string,
        description: desiredState.description as string,
        isNullable: desiredState.isNullable !== false,
        icon: desiredState.icon as string,
      } as never,
    });
  }

  async requestRollback({
    workspaceId,
    blueprintVersion,
  }: {
    workspaceId: string;
    blueprintVersion: number;
  }) {
    const blueprintArtifact = await this.getArtifactByVersion(
      workspaceId,
      WorkspaceArchitectureArtifactType.BLUEPRINT,
      blueprintVersion,
    );

    return {
      requested: true,
      requiresApproval: true,
      blueprintVersion,
      blueprintId: (blueprintArtifact.payload as { id?: string }).id ?? null,
      guidance:
        'O rollback será convertido em um novo change set não destrutivo. Dados criados após a publicação serão preservados.',
    };
  }

  async explainRecommendation({
    workspaceId,
    version,
  }: {
    workspaceId: string;
    version?: number;
  }) {
    const artifact = version
      ? await this.getArtifactByVersion(
          workspaceId,
          WorkspaceArchitectureArtifactType.BLUEPRINT,
          version,
        )
      : await this.getLatestArtifact(
          workspaceId,
          WorkspaceArchitectureArtifactType.BLUEPRINT,
        );

    if (!artifact) {
      return {
        explanation: 'Nenhum blueprint encontrado para este workspace.',
        templates: [],
        businessBenefits: [],
      };
    }

    const blueprint = workspaceBlueprintSchema.parse(artifact.payload);
    const templatesSummary = blueprint.selectedTemplates
      .map((t) => `${t.id} (confiança: ${t.confidence}%): ${t.reason}`)
      .join('\n- ');
    const objectsSummary = blueprint.objects
      .map((o) => `${o.label}: ${o.benefit}`)
      .join('\n- ');

    const explanation =
      `O Arquiteto de Workspace recomendou uma estrutura baseada no seu perfil operacional:\n\n` +
      `**Templates selecionados:**\n- ${templatesSummary}\n\n` +
      `**Módulos e Objetos Principais:**\n- ${objectsSummary}\n\n` +
      `**Benefício Operacional e Econômico Esperado:**\nRedução de tempo em cadastros manuais, visibilidade das prioridades e acompanhamento automatizado da operação sem alterar dados existentes.`;

    return {
      version: blueprint.version,
      explanation,
      selectedTemplates: blueprint.selectedTemplates,
      recommendedObjectsCount: blueprint.objects.length,
      hypotheses: blueprint.hypotheses,
      alerts: blueprint.alerts,
    };
  }

  async updateAiContext({
    workspaceId,
    aiContext,
  }: {
    workspaceId: string;
    aiContext: Record<string, unknown>;
  }) {
    const artifact = await this.getLatestArtifact(
      workspaceId,
      WorkspaceArchitectureArtifactType.BLUEPRINT,
    );

    if (artifact) {
      const blueprint = workspaceBlueprintSchema.parse(artifact.payload);
      const updatedBlueprint = workspaceBlueprintSchema.parse({
        ...blueprint,
        aiContext: {
          ...blueprint.aiContext,
          ...aiContext,
        },
      });

      await this.updateArtifact(workspaceId, artifact.id, {
        payload: updatedBlueprint,
      });
    }

    return {
      updated: true,
      aiContext,
    };
  }

  async extractOperationProfileFromText({
    workspaceId,
    description,
    modelId,
  }: {
    workspaceId: string;
    description: string;
    modelId?: string;
  }) {
    const { operationProfile: extractedProfile, modelId: resolvedModelId } =
      await this.generateWorkspaceContext({
        workspaceId,
        description,
        modelId,
      });

    return this.createInitialArchitecture({
      workspaceId,
      sourceDescription: description,
      operationProfile: extractedProfile,
      modelId: resolvedModelId,
    });
  }

  private async synchronizePageCatalog({
    workspaceId,
    blueprint,
    profileVersion = blueprint?.profileVersion ?? null,
  }: {
    workspaceId: string;
    blueprint: WorkspaceBlueprint | null;
    profileVersion?: number | null;
  }): Promise<WorkspacePageCatalogState> {
    const [artifact, architecture] = await Promise.all([
      this.getLatestArtifact(
        workspaceId,
        WorkspaceArchitectureArtifactType.SETUP_STATE,
      ),
      this.inspectWorkspaceArchitecture(workspaceId),
    ]);
    const parsedCurrent = artifact
      ? workspacePageCatalogStateSchema.safeParse(artifact.payload)
      : null;
    const current = parsedCurrent?.success ? parsedCurrent.data : null;
    const recommendedItems = this.buildPageCatalogItems(
      blueprint,
      architecture.objects,
      blueprint?.operationProfile.segment?.trim() ||
        blueprint?.operationProfile.businessModels[0]?.trim() ||
        'Operação',
    );
    const currentByKey = new Map(
      (current?.items ?? []).map((item) => [item.key, item]),
    );
    const recommendationsActive =
      blueprint === null ||
      ['ACTIVE', 'PARTIALLY_APPLIED'].includes(blueprint.status);
    const mergedItems = recommendedItems.map((item) => {
      const existing = currentByKey.get(item.key);
      const shouldPreservePublishedRecommendation = Boolean(
        existing &&
        existing.lifecycle === 'RECOMMENDED' &&
        existing.status === 'ACTIVE' &&
        item.status === 'HIDDEN',
      );
      const shouldRefreshProfileCopy = Boolean(
        existing?.copyOrigin === 'PROFILE' &&
        !shouldPreservePublishedRecommendation,
      );

      return existing
        ? {
            ...item,
            // A new blueprint may change the recommendation, but it must not
            // erase the workspace's deliberate camaleon adjustments.
            ...(existing.editable &&
            (existing.copyOrigin !== 'PROFILE' ||
              shouldPreservePublishedRecommendation)
              ? {
                  label: shouldRefreshProfileCopy ? item.label : existing.label,
                  description: shouldRefreshProfileCopy
                    ? item.description
                    : existing.description,
                  renderer: existing.renderer,
                  icon: existing.icon,
                  navigationGroup: existing.navigationGroup,
                  capabilities: existing.capabilities,
                  blocks:
                    existing.blocks.length > 0
                      ? existing.blocks.map((block) => ({
                          ...block,
                          dataContracts: inferWorkspacePageDataContracts({
                            pageKey: block.key,
                            dataSources: block.dataSources,
                            metadataObjects: architecture.objects,
                          }),
                          actions: buildWorkspacePageActions({
                            pageKey: block.key,
                            route: block.actionRoute,
                            nativeRoute: null,
                          }),
                        }))
                      : item.blocks,
                  primaryAction: shouldRefreshProfileCopy
                    ? item.primaryAction
                    : existing.primaryAction,
                  dataSources: existing.dataSources,
                  dataContracts: inferWorkspacePageDataContracts({
                    pageKey: existing.key,
                    dataSources: existing.dataSources,
                    metadataObjects: architecture.objects,
                  }),
                  actions: buildWorkspacePageActions({
                    pageKey: existing.key,
                    route: existing.route,
                    nativeRoute: existing.nativeRoute,
                  }),
                  capabilityContract: {
                    version: WORKSPACE_PAGE_CONTRACT_VERSION,
                    key: existing.key,
                    dependencies: [
                      ...new Set([
                        ...existing.capabilities,
                        ...existing.dataSources,
                      ]),
                    ],
                    fallbackRoute:
                      existing.capabilityContract?.fallbackRoute ===
                      '/diex/pages/first-steps'
                        ? '/diex/first-steps'
                        : (existing.capabilityContract?.fallbackRoute ??
                          '/diex/first-steps'),
                  },
                }
              : {}),
            copyOrigin: shouldRefreshProfileCopy
              ? item.copyOrigin
              : existing.copyOrigin,
            status:
              existing.status === 'ARCHIVED'
                ? 'ARCHIVED'
                : existing.status === 'HIDDEN' && item.status === 'ACTIVE'
                  ? 'ACTIVE'
                  : existing.status,
            showInNavigation:
              existing.status === 'HIDDEN' && item.status === 'ACTIVE'
                ? true
                : existing.showInNavigation,
            position: existing.position,
            createdAt: existing.createdAt,
          }
        : item;
    });
    const recommendedKeys = new Set(recommendedItems.map(({ key }) => key));
    const customItems = (current?.items ?? [])
      .filter(({ key }) => !recommendedKeys.has(key))
      .map((item) => {
        const isObsoleteProfileRecommendation =
          recommendationsActive &&
          item.lifecycle === 'RECOMMENDED' &&
          item.copyOrigin === 'PROFILE';

        return {
          ...item,
          ...(isObsoleteProfileRecommendation
            ? {
                status:
                  item.status === 'ARCHIVED'
                    ? ('ARCHIVED' as const)
                    : ('HIDDEN' as const),
                showInNavigation: false,
              }
            : {}),
          dataContracts: inferWorkspacePageDataContracts({
            pageKey: item.key,
            dataSources: item.dataSources,
            metadataObjects: architecture.objects,
          }),
          actions: buildWorkspacePageActions({
            pageKey: item.key,
            route: item.route,
            nativeRoute: item.nativeRoute,
          }),
          blocks: item.blocks.map((block) => ({
            ...block,
            dataContracts: inferWorkspacePageDataContracts({
              pageKey: block.key,
              dataSources: block.dataSources,
              metadataObjects: architecture.objects,
            }),
            actions: buildWorkspacePageActions({
              pageKey: block.key,
              route: block.actionRoute,
              nativeRoute: null,
            }),
          })),
          capabilityContract: {
            version: WORKSPACE_PAGE_CONTRACT_VERSION,
            key: item.key,
            dependencies: [
              ...new Set([...item.capabilities, ...item.dataSources]),
            ],
            fallbackRoute:
              item.capabilityContract?.fallbackRoute ===
              '/diex/pages/first-steps'
                ? '/diex/first-steps'
                : (item.capabilityContract?.fallbackRoute ??
                  '/diex/first-steps'),
          },
        };
      });
    const items = [...mergedItems, ...customItems]
      .sort((left, right) => left.position - right.position)
      .map((item, position) =>
        item.key === 'first-steps'
          ? {
              ...item,
              route: '/diex/first-steps',
              nativeRoute: '/diex/first-steps',
              capabilityContract: {
                version: WORKSPACE_PAGE_CONTRACT_VERSION,
                key: 'first-steps',
                dependencies: [
                  'onboarding',
                  'contexto',
                  'arquitetura',
                  'canal principal',
                  'pipeline',
                ],
                fallbackRoute: '/diex/first-steps',
              },
              dataContracts: inferWorkspacePageDataContracts({
                pageKey: item.key,
                dataSources: adaptOptionalChannelDataSources(item.dataSources),
                metadataObjects: architecture.objects,
              }),
              dataSources: adaptOptionalChannelDataSources(item.dataSources),
              actions: buildWorkspacePageActions({
                pageKey: item.key,
                route: '/diex/first-steps',
                nativeRoute: '/diex/first-steps',
              }),
              position,
            }
          : { ...item, position },
      );
    const recommendedItemsHaveAdaptiveConfiguration = recommendedItems.every(
      (recommendedItem) => {
        const currentItem = currentByKey.get(recommendedItem.key);

        return Boolean(
          currentItem &&
          currentItem.route === recommendedItem.route &&
          currentItem.nativeRoute === recommendedItem.nativeRoute &&
          currentItem.editable === recommendedItem.editable &&
          currentItem.capabilityContract?.version ===
            WORKSPACE_PAGE_CONTRACT_VERSION &&
          currentItem.dataContracts.length > 0 &&
          currentItem.actions.length > 0 &&
          (recommendedItem.blocks.length === 0 ||
            (currentItem.blocks.length > 0 &&
              currentItem.blocks.every(
                (block) =>
                  block.dataContracts.length > 0 && block.actions.length > 0,
              ))),
        );
      },
    );
    const compiledItemsByKey = new Map(items.map((item) => [item.key, item]));
    const currentItemsHaveAdaptiveConfiguration =
      recommendedItemsHaveAdaptiveConfiguration &&
      (current?.items ?? []).every((currentItem) => {
        const compiledItem = compiledItemsByKey.get(currentItem.key);

        return Boolean(
          compiledItem &&
          currentItem.status === compiledItem.status &&
          currentItem.showInNavigation === compiledItem.showInNavigation &&
          JSON.stringify(currentItem.dataContracts) ===
            JSON.stringify(compiledItem.dataContracts) &&
          JSON.stringify(currentItem.actions) ===
            JSON.stringify(compiledItem.actions) &&
          currentItem.blocks.length === compiledItem.blocks.length &&
          currentItem.blocks.every(
            (block, index) =>
              JSON.stringify(block.dataContracts) ===
                JSON.stringify(compiledItem.blocks[index]?.dataContracts) &&
              JSON.stringify(block.actions) ===
                JSON.stringify(compiledItem.blocks[index]?.actions),
          ),
        );
      });
    const firstStepsItem = current?.items.find(
      ({ key }) => key === 'first-steps',
    );
    const firstStepsConfigured = Boolean(
      firstStepsItem &&
      firstStepsItem.capabilityContract?.version ===
        WORKSPACE_PAGE_CONTRACT_VERSION &&
      firstStepsItem.dataContracts.length > 0 &&
      firstStepsItem.actions.length > 0,
    );
    const profileCopyNeedsRefresh = recommendedItems.some((item) => {
      const currentItem = currentByKey.get(item.key);

      return Boolean(
        currentItem &&
        currentItem.copyOrigin === 'PROFILE' &&
        !(
          currentItem.lifecycle === 'RECOMMENDED' &&
          currentItem.status === 'ACTIVE' &&
          item.status === 'HIDDEN'
        ) &&
        (currentItem.label !== item.label ||
          currentItem.description !== item.description ||
          currentItem.primaryAction !== item.primaryAction),
      );
    });
    const isCurrentCatalogValid =
      current &&
      current.blueprintVersion === (blueprint?.version ?? null) &&
      current.profileVersion === profileVersion &&
      recommendedItems.every(
        ({ key, status }) =>
          currentByKey.has(key) &&
          (currentByKey.get(key)?.status === status ||
            (currentByKey.get(key)?.lifecycle === 'RECOMMENDED' &&
              currentByKey.get(key)?.status === 'ACTIVE' &&
              status === 'HIDDEN') ||
            currentByKey.get(key)?.status === 'ARCHIVED'),
      ) &&
      currentItemsHaveAdaptiveConfiguration &&
      firstStepsConfigured &&
      !profileCopyNeedsRefresh;

    if (isCurrentCatalogValid && current) {
      return current;
    }

    const nextState = workspacePageCatalogStateSchema.parse({
      version: (current?.version ?? 0) + 1,
      blueprintVersion: blueprint?.version ?? null,
      profileVersion,
      navigationMode: 'ADAPTIVE',
      items,
      updatedAt: new Date().toISOString(),
    });

    if (artifact) {
      await this.updateArtifact(workspaceId, artifact.id, {
        status: WorkspaceArchitectureArtifactStatus.SUPERSEDED,
      });
    }

    return this.persistArtifact(workspaceId, {
      artifactType: WorkspaceArchitectureArtifactType.SETUP_STATE,
      status: WorkspaceArchitectureArtifactStatus.ACTIVE,
      version: nextState.version,
      parentVersion: current?.version,
      name: `Catálogo operacional v${nextState.version}`,
      summary: `${items.filter(({ showInNavigation }) => showInNavigation).length} páginas disponíveis na navegação adaptativa.`,
      payload: nextState,
      promptVersion: `workspace-page-catalog@${WORKSPACE_PAGE_CONTRACT_VERSION}`,
    }).then(() => nextState);
  }

  private buildPageCatalogItems(
    blueprint: WorkspaceBlueprint | null,
    metadataObjects: WorkspacePageMetadataObject[] = [],
    operationLabel = 'Operação',
  ): WorkspacePageCatalogItem[] {
    const blueprintPages: WorkspaceBlueprint['pages'] = blueprint?.pages ?? [
      {
        key: 'inbox-commercial',
        label: 'Inbox Comercial',
        description: 'Concentra conversas, responsáveis e próximos passos.',
        required: true,
        benefit: 'Não perder leads por falta de resposta.',
        sourceTemplateIds: ['diex.base.universal'],
        configuration: {
          renderer: 'INBOX',
          icon: 'inbox',
          navigationGroup: 'Receita',
          route: '/diex/pages/inbox-commercial',
          nativeRoute: '/inbox',
        },
      },
      {
        key: 'commercial-intelligence',
        label: 'Inteligência Comercial',
        description: 'Prioriza decisões de receita, pipeline e risco.',
        required: true,
        benefit: 'Saber qual ação gera mais receita hoje.',
        sourceTemplateIds: ['diex.base.universal'],
        configuration: {
          renderer: 'DASHBOARD',
          icon: 'chart',
          navigationGroup: 'Receita',
          route: '/diex/pages/commercial-intelligence',
          nativeRoute: '/diex/commercial-intelligence',
        },
      },
      {
        key: 'calendar',
        label: 'Agenda',
        description: 'Organiza tarefas, prazos e follow-ups.',
        required: true,
        benefit: 'Transformar oportunidade em execução.',
        sourceTemplateIds: ['diex.base.universal'],
        configuration: {
          renderer: 'CALENDAR',
          icon: 'calendar',
          navigationGroup: 'Execução',
          route: '/diex/pages/calendar',
          nativeRoute: '/diex/calendar',
        },
      },
      {
        key: 'customer-success-center',
        label: 'Customer Success',
        description:
          'Acompanha saúde, riscos, marcos e a próxima ação da carteira.',
        required: false,
        benefit: 'Reduzir churn e aumentar renovação e expansão.',
        sourceTemplateIds: ['diex.base.universal'],
        configuration: {
          renderer: 'OPERATIONS',
          icon: 'heart-handshake',
          navigationGroup: 'Carteira',
          route: '/diex/pages/customer-success-center',
          nativeRoute: '/diex/customer-success',
          capabilities: ['customer-success'],
          dataSources: [
            'empresas',
            'planos de sucesso',
            'renovações',
            'tarefas',
          ],
          primaryAction: 'Proteger a próxima renovação',
          showInNavigation: false,
        },
      },
      {
        key: 'renewal-operations',
        label: 'Renovações',
        description:
          'Prioriza contratos em risco, datas de renovação e expansão.',
        required: false,
        benefit: 'Proteger receita recorrente antes do vencimento.',
        sourceTemplateIds: ['diex.base.universal'],
        configuration: {
          renderer: 'PIPELINE',
          icon: 'refresh',
          navigationGroup: 'Carteira',
          route: '/diex/pages/renewal-operations',
          nativeRoute: '/diex/renewals',
          capabilities: ['renewal'],
          dataSources: ['renovações', 'empresas', 'tarefas', 'indicadores'],
          primaryAction: 'Agir sobre a renovação mais próxima',
          showInNavigation: false,
        },
      },
      {
        key: 'ai-governance-operations',
        label: 'Governança da IA',
        description:
          'Revisa propostas, aprovações, riscos e recibos de execução da IA.',
        required: false,
        benefit:
          'Aumentar produtividade sem liberar ações comerciais sem controle.',
        sourceTemplateIds: ['diex.base.universal'],
        configuration: {
          renderer: 'OPERATIONS',
          icon: 'robot',
          navigationGroup: 'Governança',
          route: '/diex/pages/ai-governance-operations',
          nativeRoute: '/diex/ai-command-center',
          capabilities: ['ai-governance'],
          dataSources: ['ações de IA', 'oportunidades', 'tarefas'],
          primaryAction: 'Aprovar a próxima ação segura',
          showInNavigation: false,
        },
      },
    ];
    const blueprintBlocks = blueprint?.blocks ?? [];
    const now = new Date().toISOString();
    const recommendationsActive =
      blueprint === null ||
      ['ACTIVE', 'PARTIALLY_APPLIED'].includes(blueprint.status);
    const selectedCapabilities = new Set(blueprint?.selectedCapabilities ?? []);
    const selectedTemplateIds = new Set(
      blueprint?.selectedTemplates.map(({ id }) => id) ?? [],
    );
    const usesCompanyAccounts = [...selectedTemplateIds].some(
      (templateId) =>
        WORKSPACE_TEMPLATE_BY_ID.get(templateId)?.requiresCompanyAccount ===
        true,
    );
    const items = blueprintPages.map((page, position) => {
      const configuration = page.configuration;
      const normalizedOperationLabel = operationLabel.toLowerCase();
      const adaptiveCoreCopy: Record<
        string,
        { label: string; description: string; primaryAction: string }
      > = {
        'inbox-commercial': {
          label: `Inbox da ${operationLabel}`,
          description: `Concentra entradas, responsáveis e próximas ações da ${normalizedOperationLabel}.`,
          primaryAction: `Responder e priorizar a próxima entrada da ${normalizedOperationLabel}`,
        },
        'commercial-intelligence': {
          label: `Cockpit da ${operationLabel}`,
          description: `Prioriza decisões, sinais, resultados e riscos da ${normalizedOperationLabel}.`,
          primaryAction: `Escolher a ação prioritária da ${normalizedOperationLabel}`,
        },
        calendar: {
          label: `Agenda da ${operationLabel}`,
          description: `Organiza tarefas, prazos e compromissos da ${normalizedOperationLabel}.`,
          primaryAction: `Executar a próxima ação da ${normalizedOperationLabel}`,
        },
        'first-steps': {
          label: `Ativação da ${operationLabel}`,
          description: `Conduz contexto, aprovação, canal e primeiro resultado da ${normalizedOperationLabel}.`,
          primaryAction: `Concluir a ativação da ${normalizedOperationLabel}`,
        },
      };
      const coreCopy = adaptiveCoreCopy[page.key];
      const displayLabel = coreCopy?.label ?? page.label;
      const displayDescription = coreCopy?.description ?? page.description;
      const configuredRenderer = readConfigurationString(
        configuration,
        'renderer',
      );
      const renderer = PAGE_RENDERERS.has(configuredRenderer ?? '')
        ? (configuredRenderer as WorkspacePageCatalogItem['renderer'])
        : 'OPERATIONS';
      const icon =
        readConfigurationString(configuration, 'icon') ??
        (renderer === 'INBOX'
          ? 'inbox'
          : renderer === 'CALENDAR'
            ? 'calendar'
            : renderer === 'DASHBOARD'
              ? 'chart'
              : 'briefcase');
      const configuredLifecycle = readConfigurationString(
        configuration,
        'lifecycle',
      );
      const isCore =
        DIEX_CORE_PAGE_KEYS.has(page.key) || configuredLifecycle === 'CORE';
      const explicitDataSources = readConfigurationStrings(
        configuration,
        'dataSources',
      );
      const pageTemplateIds = new Set(page.sourceTemplateIds);
      const templateObjectSources = [
        ...new Set(
          (blueprint?.objects ?? [])
            .filter(({ sourceTemplateIds }) =>
              sourceTemplateIds.some((templateId) =>
                pageTemplateIds.has(templateId),
              ),
            )
            .filter(({ key }) => !UNIVERSAL_OPERATION_OBJECT_NAMES.has(key))
            .map(({ label }) => label.trim())
            .filter(Boolean),
        ),
      ].slice(0, 4);
      const configuredDataSources =
        explicitDataSources.length > 0
          ? explicitDataSources
          : templateObjectSources.length > 0
            ? [...templateObjectSources, 'tarefas']
            : getAdaptiveDefaultDataSources(
                metadataObjects,
                `${page.key} ${page.label} ${page.description} ${page.benefit}`,
              );
      const dataSources =
        isCore && !usesCompanyAccounts
          ? configuredDataSources.filter(
              (source) =>
                !tokenize(source).some((token) =>
                  [
                    'empresa',
                    'empresas',
                    'company',
                    'companies',
                    'conta',
                    'contas',
                  ].includes(token),
                ),
            )
          : configuredDataSources;
      const configuredCapabilities = readConfigurationStrings(
        configuration,
        'capabilities',
      );
      const capabilities = isCore
        ? configuredCapabilities.filter(
            (capability) =>
              capability === 'onboarding' ||
              selectedCapabilities.has(capability),
          )
        : configuredCapabilities;
      const status = isCore || recommendationsActive ? 'ACTIVE' : 'HIDDEN';
      const route = toPageRoute(page.key, configuration);
      const nativeRoute = toNativePageRoute(page.key, configuration);
      const configuredShowInNavigation = configuration?.showInNavigation;
      const blocks = this.buildPageBlocks({
        page: {
          ...page,
          label: displayLabel,
          description: displayDescription,
        },
        blueprintBlocks,
        renderer,
        dataSources,
        route,
        metadataObjects,
      });
      const dataContracts = inferWorkspacePageDataContracts({
        pageKey: page.key,
        dataSources,
        metadataObjects,
      });
      const actions = buildWorkspacePageActions({
        pageKey: page.key,
        route,
        nativeRoute,
      });

      return workspacePageCatalogItemSchema.parse({
        key: page.key,
        label: displayLabel,
        description: displayDescription,
        route,
        nativeRoute,
        renderer,
        icon,
        navigationGroup:
          readConfigurationString(configuration, 'navigationGroup') ??
          'Operação',
        capabilities,
        blocks,
        dataContracts,
        actions,
        lifecycle: isCore ? 'CORE' : 'RECOMMENDED',
        status,
        sourceTemplateIds: page.sourceTemplateIds,
        primaryAction:
          coreCopy?.primaryAction ??
          readConfigurationString(configuration, 'primaryAction') ??
          `Operar ${displayLabel.toLowerCase()}`,
        dataSources,
        capabilityContract: {
          version: WORKSPACE_PAGE_CONTRACT_VERSION,
          key: page.key,
          dependencies: [...new Set([...capabilities, ...dataSources])],
          fallbackRoute: '/diex/first-steps',
        },
        emptyState: {
          title: `${displayLabel} começa aqui`,
          description: `${displayDescription} O próximo passo está indicado para você não operar diante de uma tela vazia.`,
          actionLabel: 'Continuar ativação da operação',
          actionRoute: '/diex/first-steps',
        },
        permissions: ['workspace_access'],
        aiGenerated: false,
        // Core pages remain fully workspace-configurable. The activation page
        // is the only recovery route protected from archival.
        editable: true,
        showInNavigation:
          status === 'ACTIVE' &&
          (typeof configuredShowInNavigation === 'boolean'
            ? configuredShowInNavigation
            : isCore || page.required !== false),
        position,
        createdAt: now,
      });
    });
    const hasFirstSteps = items.some(({ key }) => key === 'first-steps');

    if (!hasFirstSteps) {
      items.unshift(
        workspacePageCatalogItemSchema.parse({
          key: 'first-steps',
          label: `Ativação da ${operationLabel}`,
          description: `Conduz contexto, aprovação, canal e primeiro resultado da ${operationLabel.toLowerCase()}.`,
          route: '/diex/first-steps',
          nativeRoute: '/diex/first-steps',
          renderer: 'OPERATIONS',
          icon: 'rocket',
          navigationGroup: 'Ativação',
          capabilities: ['onboarding'],
          blocks: [],
          dataContracts: inferWorkspacePageDataContracts({
            pageKey: 'first-steps',
            dataSources: [
              'contexto',
              'arquitetura',
              'canal principal',
              'pipeline',
            ],
            metadataObjects,
          }),
          actions: buildWorkspacePageActions({
            pageKey: 'first-steps',
            route: '/diex/first-steps',
            nativeRoute: '/diex/first-steps',
          }),
          lifecycle: 'CORE',
          status: 'ACTIVE',
          sourceTemplateIds: ['diex.base.universal'],
          primaryAction: `Chegar ao primeiro resultado da ${operationLabel.toLowerCase()}`,
          dataSources: [
            'contexto',
            'arquitetura',
            'canal principal',
            'pipeline',
          ],
          capabilityContract: {
            version: WORKSPACE_PAGE_CONTRACT_VERSION,
            key: 'first-steps',
            dependencies: [
              'onboarding',
              'contexto',
              'arquitetura',
              'canal principal',
              'pipeline',
            ],
            fallbackRoute: '/diex/first-steps',
          },
          emptyState: {
            title: 'Sua operação começa aqui',
            description:
              'Defina o contexto, escolha a forma de entrada e transforme o primeiro registro real em resultado operacional.',
            actionLabel: 'Continuar onboarding',
            actionRoute: '/diex/first-steps',
          },
          permissions: ['workspace_access'],
          aiGenerated: false,
          editable: true,
          showInNavigation: true,
          position: 0,
          createdAt: now,
        }),
      );
    }

    return items.map((item, position) => ({ ...item, position }));
  }

  private buildPageBlocks({
    page,
    blueprintBlocks,
    renderer,
    dataSources,
    route,
    metadataObjects = [],
  }: {
    page: WorkspaceBlueprint['pages'][number];
    blueprintBlocks: WorkspaceBlueprint['blocks'];
    renderer: WorkspacePageCatalogItem['renderer'];
    dataSources: string[];
    route: string;
    metadataObjects?: WorkspacePageMetadataObject[];
  }): WorkspacePageBlock[] {
    const configuration = page.configuration;
    const configuredBlockKeys = readConfigurationStrings(
      configuration,
      'blockKeys',
    );
    const matchingBlocks = blueprintBlocks.filter((block) => {
      const blockPageKey = readConfigurationString(
        block.configuration,
        'pageKey',
      );

      return (
        blockPageKey === page.key || configuredBlockKeys.includes(block.key)
      );
    });

    const mapBlock = (
      block: WorkspaceBlueprint['blocks'][number],
      position: number,
    ) => {
      const blockConfiguration = block.configuration;
      const configuredType = readConfigurationString(
        blockConfiguration,
        'type',
      );
      const type = PAGE_BLOCK_TYPES.has(configuredType ?? '')
        ? (configuredType as WorkspacePageBlockType)
        : 'LIST';
      const configuredSources = readConfigurationStrings(
        blockConfiguration,
        'dataSources',
      );
      const blockDataSources =
        configuredSources.length > 0 ? configuredSources : dataSources;
      const componentContract = WORKSPACE_PAGE_COMPONENT_REGISTRY[renderer];
      const safeType = componentContract.supportedBlockTypes.includes(type)
        ? type
        : 'LIST';
      const actionRoute =
        readConfigurationString(blockConfiguration, 'actionRoute') ??
        '/diex/first-steps';

      return workspacePageBlockSchema.parse({
        key: block.key,
        label: block.label,
        type: safeType,
        title:
          readConfigurationString(blockConfiguration, 'title') ?? block.label,
        description: block.description,
        dataSources: blockDataSources,
        dataContracts: inferWorkspacePageDataContracts({
          pageKey: block.key,
          dataSources: blockDataSources,
          metadataObjects,
        }),
        actions: buildWorkspacePageActions({
          pageKey: block.key,
          route: actionRoute,
          nativeRoute: null,
        }),
        actionLabel:
          readConfigurationString(blockConfiguration, 'actionLabel') ??
          'Abrir primeiros passos',
        actionRoute,
        sourceTemplateIds: block.sourceTemplateIds,
        configuration: blockConfiguration ?? {},
        position,
      });
    };

    if (matchingBlocks.length > 0) {
      return matchingBlocks.map(mapBlock);
    }

    const overviewType: WorkspacePageBlockType =
      renderer === 'INBOX'
        ? 'INBOX'
        : renderer === 'PIPELINE'
          ? 'PIPELINE'
          : renderer === 'CALENDAR'
            ? 'CALENDAR'
            : renderer === 'DASHBOARD'
              ? 'KPI'
              : 'LIST';

    return [
      workspacePageBlockSchema.parse({
        key: `${page.key}-overview`,
        label: `Visão de ${page.label}`,
        type: overviewType,
        title: page.label,
        description: page.description,
        dataSources,
        dataContracts: inferWorkspacePageDataContracts({
          pageKey: `${page.key}-overview`,
          dataSources,
          metadataObjects,
        }),
        actions: buildWorkspacePageActions({
          pageKey: `${page.key}-overview`,
          route: '/diex/first-steps',
          nativeRoute: null,
        }),
        actionLabel: 'Abrir primeiros passos',
        actionRoute: '/diex/first-steps',
        sourceTemplateIds: page.sourceTemplateIds,
        configuration: { pageKey: page.key, renderer, route },
        position: 0,
      }),
      workspacePageBlockSchema.parse({
        key: `${page.key}-next-actions`,
        label: 'Próximas ações',
        type: 'CHECKLIST',
        title: 'Próximas ações',
        description:
          'Prioriza a ação da operação que reduz risco ou aproxima resultado.',
        dataSources: [...dataSources, 'tarefas'],
        dataContracts: inferWorkspacePageDataContracts({
          pageKey: `${page.key}-next-actions`,
          dataSources: [...dataSources, 'tarefas'],
          metadataObjects,
        }),
        actions: buildWorkspacePageActions({
          pageKey: `${page.key}-next-actions`,
          route: '/diex/first-steps',
          nativeRoute: null,
        }),
        actionLabel: 'Abrir primeiros passos',
        actionRoute: '/diex/first-steps',
        sourceTemplateIds: page.sourceTemplateIds,
        configuration: { pageKey: page.key, renderer, route },
        position: 1,
      }),
      workspacePageBlockSchema.parse({
        key: `${page.key}-ai-summary`,
        label: 'Leitura da IA',
        type: 'AI_SUMMARY',
        title: 'Leitura da IA',
        description:
          'Resume contexto, risco e próxima ação sem deixar a operação sem direção.',
        dataSources: [...dataSources, 'indicadores'],
        dataContracts: inferWorkspacePageDataContracts({
          pageKey: `${page.key}-ai-summary`,
          dataSources: [...dataSources, 'indicadores'],
          metadataObjects,
        }),
        actions: buildWorkspacePageActions({
          pageKey: `${page.key}-ai-summary`,
          route: '/diex/first-steps',
          nativeRoute: null,
        }),
        actionLabel: 'Abrir primeiros passos',
        actionRoute: '/diex/first-steps',
        sourceTemplateIds: page.sourceTemplateIds,
        configuration: { pageKey: page.key, renderer, route },
        position: 2,
      }),
    ];
  }

  private async savePageCatalog(
    workspaceId: string,
    state: WorkspacePageCatalogState,
  ): Promise<WorkspacePageCatalogState> {
    return this.cacheLockService.withRenewableLock(
      async () => {
        const currentArtifact = await this.getLatestArtifact(
          workspaceId,
          WorkspaceArchitectureArtifactType.SETUP_STATE,
        );
        const parsedCurrent = currentArtifact
          ? workspacePageCatalogStateSchema.safeParse(currentArtifact.payload)
          : null;
        const current = parsedCurrent?.success ? parsedCurrent.data : null;
        const currentKeys = new Set(current?.items.map(({ key }) => key) ?? []);
        const mergedItems = current
          ? [
              ...current.items.map(
                (item) =>
                  state.items.find(({ key }) => key === item.key) ?? item,
              ),
              ...state.items.filter(({ key }) => !currentKeys.has(key)),
            ]
          : state.items;
        const normalizedItems = mergedItems
          .sort((left, right) => left.position - right.position)
          .map((item, position) => ({ ...item, position }));
        const baseVersion = current?.version ?? state.version;
        const nextState = workspacePageCatalogStateSchema.parse({
          ...state,
          version: baseVersion + 1,
          items: normalizedItems,
          updatedAt: new Date().toISOString(),
        });

        if (currentArtifact) {
          await this.updateArtifact(workspaceId, currentArtifact.id, {
            status: WorkspaceArchitectureArtifactStatus.SUPERSEDED,
          });
        }

        await this.persistArtifact(workspaceId, {
          artifactType: WorkspaceArchitectureArtifactType.SETUP_STATE,
          status: WorkspaceArchitectureArtifactStatus.ACTIVE,
          version: nextState.version,
          parentVersion: baseVersion,
          name: `Catálogo operacional v${nextState.version}`,
          summary: `${nextState.items.filter(({ showInNavigation }) => showInNavigation).length} páginas disponíveis na navegação adaptativa.`,
          payload: nextState,
          promptVersion: `workspace-page-catalog@${WORKSPACE_PAGE_CONTRACT_VERSION}`,
        });

        return nextState;
      },
      `diex:workspace-page-catalog:${workspaceId}`,
      { ttl: 15_000, renewalIntervalMs: 4_000, maxRetries: 20 },
    );
  }

  private buildOperationManifest({
    version,
    profileVersion,
    operationProfile,
    commercialGoal,
    selectedTemplates,
    components,
    metrics,
    permissions,
    operationalRules,
    glossary,
  }: {
    version: number;
    profileVersion: number;
    operationProfile: WorkspaceOperationProfile;
    commercialGoal?: string | null;
    selectedTemplates: WorkspaceTemplateDefinition[];
    components: Record<
      | 'objects'
      | 'fields'
      | 'relations'
      | 'pipelines'
      | 'pages'
      | 'blocks'
      | 'views'
      | 'dashboards'
      | 'automations'
      | 'roles'
      | 'integrations',
      WorkspaceBlueprintComponent[]
    >;
    metrics: string[];
    permissions: string[];
    operationalRules: string[];
    glossary: Record<string, string>;
  }): WorkspaceOperationManifest {
    const toItems = (values: WorkspaceBlueprintComponent[]) =>
      values.map((value) => {
        const isCore = value.sourceTemplateIds.includes('diex.base.universal');

        return {
          key: value.key,
          label: value.label,
          description: value.description,
          source: isCore ? ('CORE' as const) : ('AI' as const),
          enabled: true,
          confirmed: isCore,
          confidence: isCore ? 100 : 80,
          configuration: value.configuration ?? {},
        };
      });

    const capabilities = selectedTemplates.map((template) => ({
      key: template.id,
      label: template.name,
      description: template.description,
      source: template.kind === 'BASE' ? ('CORE' as const) : ('AI' as const),
      enabled: true,
      confirmed: template.kind === 'BASE',
      confidence: template.kind === 'BASE' ? 100 : 80,
      configuration: {
        kind: template.kind,
        version: template.version,
        updateStrategy: template.updateStrategy,
        rollbackStrategy: template.rollbackStrategy,
      },
    }));

    return workspaceOperationManifestSchema.parse({
      schemaVersion: '1.0.0',
      version,
      profileVersion,
      blueprintVersion: version,
      goal:
        commercialGoal?.trim() ||
        operationProfile.priorityObjectives[0] ||
        null,
      segment: operationProfile.segment,
      capabilities,
      entities: toItems(components.objects),
      fields: toItems(components.fields),
      relations: toItems(components.relations),
      pipelines: toItems(components.pipelines),
      pages: toItems(components.pages),
      dashboards: toItems(components.dashboards),
      automations: toItems(components.automations),
      roles: toItems(components.roles),
      channels: toItems(components.integrations),
      metrics,
      policies: [
        ...new Set([
          ...permissions,
          ...operationalRules,
          ...operationProfile.commercialRules,
          ...operationProfile.responsibilityRules,
          ...operationProfile.approvalRules,
        ]),
      ],
      glossary,
      unresolved: operationProfile.unconfirmedInformation,
      generatedAt: new Date().toISOString(),
    });
  }

  private selectTemplateIds(profile: WorkspaceOperationProfile): string[] {
    const corpus = tokenize(JSON.stringify(profile));
    const segmentCorpus = tokenize(
      [profile.segment ?? '', ...profile.businessModels].join(' '),
    );
    const ids = new Set<string>();

    const addTemplate = (templateId: string, visiting = new Set<string>()) => {
      if (ids.has(templateId) || visiting.has(templateId)) {
        return;
      }

      const template = WORKSPACE_TEMPLATE_BY_ID.get(templateId);

      if (!template) {
        return;
      }

      if (
        template.conflicts.some((conflictingTemplateId) =>
          ids.has(conflictingTemplateId),
        ) ||
        [...ids].some((selectedTemplateId) =>
          WORKSPACE_TEMPLATE_BY_ID.get(selectedTemplateId)?.conflicts.includes(
            templateId,
          ),
        )
      ) {
        return;
      }

      const nextVisiting = new Set(visiting).add(templateId);

      for (const dependency of template.dependencies) {
        addTemplate(dependency, nextVisiting);
      }

      ids.add(templateId);
    };

    addTemplate('diex.base.universal');

    for (const template of WORKSPACE_TEMPLATE_REGISTRY) {
      if (template.kind === 'BASE' || template.kind === 'SCALE') {
        continue;
      }

      const activationMatch = template.activationCriteria.some((criterion) =>
        includesCriterion(corpus, criterion),
      );
      const excludedBy = (template.exclusionCriteria ?? []).some((criterion) =>
        includesCriterion(corpus, criterion),
      );
      const compatibleSegmentMatch = template.compatibleSegments.some(
        (segment) =>
          segment === '*' || includesCriterion(segmentCorpus, segment),
      );
      const prerequisitesMatch = template.prerequisites.every(
        (prerequisite) =>
          ids.has(prerequisite) || includesCriterion(corpus, prerequisite),
      );

      // Segment compatibility is useful when the client says "atuamos em
      // imobiliário" without repeating the registry keyword in the rest of the
      // description. Activation criteria still win for capability templates so
      // a broad segment never turns on every optional module.
      if (
        !excludedBy &&
        prerequisitesMatch &&
        (activationMatch ||
          (template.kind === 'BUSINESS_MODEL' && compatibleSegmentMatch))
      ) {
        addTemplate(template.id);
      }
    }

    const inferredCapabilityIds = [
      profile.acquisitionChannels.length > 0 ? 'acquisition' : null,
      profile.productsAndServices.length > 0 || profile.salesProcess
        ? 'sales'
        : null,
      profile.deliveryProcess ? 'delivery' : null,
      profile.customerServiceProcess ? 'support' : null,
      profile.customerSuccessProcess ? 'customer-success' : null,
      profile.renewalProcess ? 'renewal' : null,
      profile.revenueModels.some((model) =>
        includesCriterion(tokenize(model), 'recorrente'),
      )
        ? 'subscriptions'
        : null,
      profile.requiredIntegrations.some((integration) =>
        includesCriterion(tokenize(integration), 'calendário'),
      )
        ? 'scheduling'
        : null,
    ];

    for (const capabilityId of inferredCapabilityIds.filter(
      (value): value is string => value !== null,
    )) {
      addTemplate(`diex.capability.${capabilityId}`);
    }

    const scaleId =
      (profile.unitCount ?? 0) > 1
        ? 'diex.scale.multi-unit'
        : (profile.teamCount ?? 0) > 1
          ? 'diex.scale.multi-team'
          : profile.teamAndRoles.length > 1
            ? 'diex.scale.small-team'
            : 'diex.scale.solo';

    addTemplate(scaleId);

    return [...ids];
  }

  private composeComponents<
    K extends
      | 'objects'
      | 'fields'
      | 'relations'
      | 'views'
      | 'pipelines'
      | 'pages'
      | 'blocks'
      | 'dashboards'
      | 'automations'
      | 'roles'
      | 'integrations',
  >(templates: WorkspaceTemplateDefinition[], key: K) {
    const components = new Map<
      string,
      WorkspaceTemplateComponent & { sourceTemplateIds: string[] }
    >();

    for (const template of templates) {
      for (const item of template[key]) {
        const existing = components.get(item.key);

        components.set(item.key, {
          ...(existing ?? item),
          required: existing?.required === true || item.required,
          sourceTemplateIds: [
            ...new Set([...(existing?.sourceTemplateIds ?? []), template.id]),
          ],
        });
      }
    }

    return [...components.values()];
  }

  private summarizeProfile(profile: WorkspaceOperationProfile): string {
    const business =
      profile.segment ?? profile.businessModels[0] ?? 'Operação a revisar';
    const goal =
      profile.priorityObjectives[0] ?? 'objetivo ainda não informado';

    return `${business}. Prioridade: ${goal}. ${profile.unconfirmedInformation.length} informações ainda precisam de confirmação.`;
  }

  private async getNextVersion(
    workspaceId: string,
    artifactType: WorkspaceArchitectureArtifactType,
  ): Promise<number> {
    const current = await this.getLatestArtifact(workspaceId, artifactType);

    return (current?.version ?? 0) + 1;
  }

  private async getArtifactByVersion(
    workspaceId: string,
    artifactType: WorkspaceArchitectureArtifactType,
    version: number,
  ) {
    return this.withArtifactRepository(workspaceId, async (repository) => {
      const artifact = await repository.findOne({
        where: { artifactType, version },
      });

      if (!artifact) {
        throw new Error(`${artifactType} version ${version} was not found.`);
      }

      return artifact;
    });
  }

  private async getImportBatchByPlanId(workspaceId: string, planId: string) {
    return this.withArtifactRepository(workspaceId, async (repository) => {
      const artifacts = await repository.find({
        where: { artifactType: WorkspaceArchitectureArtifactType.IMPORT_BATCH },
        order: { version: 'DESC' },
        take: 100,
      });
      const artifact = artifacts.find((candidate) => {
        const parsed = workspaceImportBatchSchema.safeParse(candidate.payload);

        return parsed.success && parsed.data.planId === planId;
      });

      if (!artifact) {
        throw new Error(`Import plan ${planId} was not found.`);
      }

      return artifact;
    });
  }

  private async updateArtifact(
    workspaceId: string,
    artifactId: string,
    values: Partial<WorkspaceArchitectureArtifactWorkspaceEntity>,
  ) {
    return this.withArtifactRepository(workspaceId, async (repository) => {
      await repository.update(artifactId, values as never);

      return repository.findOneOrFail({ where: { id: artifactId } });
    });
  }

  private async persistArtifact(
    workspaceId: string,
    input: ArchitectureArtifactInput,
  ) {
    return this.withArtifactRepository(workspaceId, async (repository) =>
      repository.save(
        repository.create({
          name: input.name,
          artifactKey: `${input.artifactType}:${input.version}`,
          artifactType: input.artifactType,
          status: input.status,
          schemaVersion: '1.0.0',
          version: input.version,
          parentVersion: input.parentVersion ?? null,
          sourceDescription: input.sourceDescription
            ? { markdown: input.sourceDescription }
            : null,
          payload: input.payload as Record<string, unknown>,
          summary: { markdown: input.summary },
          templateVersions: input.templateVersions ?? null,
          idempotencyKey: input.idempotencyKey ?? null,
          approvedAt: null,
          appliedAt: null,
          completedAt: null,
          errorDetails: null,
          modelId: input.modelId ?? null,
          promptVersion: input.promptVersion ?? null,
          datasetVersion: input.datasetVersion ?? null,
          estimatedCostCents: null,
          actualCostCents: null,
        }),
      ),
    );
  }

  private async withArtifactRepository<T>(
    workspaceId: string,
    operation: (
      repository: WorkspaceRepository<WorkspaceArchitectureArtifactWorkspaceEntity>,
    ) => Promise<T>,
  ): Promise<T> {
    const authContext = buildSystemAuthContext(workspaceId);

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const repository =
          await this.globalWorkspaceOrmManager.getRepository<WorkspaceArchitectureArtifactWorkspaceEntity>(
            workspaceId,
            'workspaceArchitectureArtifact',
            { shouldBypassPermissionChecks: true },
          );

        return operation(repository);
      },
      authContext,
    );
  }
}
