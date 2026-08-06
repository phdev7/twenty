import { Injectable } from '@nestjs/common';

import { createHash } from 'node:crypto';
import { isDefined } from 'twenty-shared/utils';
import { v4 } from 'uuid';

import { CacheLockService } from 'src/engine/core-modules/cache-lock/cache-lock.service';
import { WorkspaceManyOrAllFlatEntityMapsCacheService } from 'src/engine/metadata-modules/flat-entity/services/workspace-many-or-all-flat-entity-maps-cache.service';
import { ObjectMetadataService } from 'src/engine/metadata-modules/object-metadata/object-metadata.service';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { type WorkspaceRepository } from 'src/engine/twenty-orm/repository/workspace.repository';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
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
  type WorkspaceTemplateComponent,
  type WorkspaceTemplateDefinition,
} from 'src/modules/workspace-architecture/types/workspace-template.type';

type ArtifactPayload =
  | WorkspaceOperationProfile
  | WorkspaceBlueprint
  | WorkspaceChangeSet
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

const normalize = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

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
  ) {}

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
    }));
  }

  async createInitialArchitecture({
    workspaceId,
    sourceDescription,
    operationProfile,
    modelId,
  }: {
    workspaceId: string;
    sourceDescription: string;
    operationProfile: WorkspaceOperationProfile;
    modelId: string;
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
      promptVersion: 'workspace-operation-profile@1.0.0',
    });

    const blueprint = await this.recommendBlueprint({
      workspaceId,
      operationProfile: validatedProfile,
      profileVersion,
    });

    return { profileVersion, blueprint };
  }

  async recommendBlueprint({
    workspaceId,
    operationProfile,
    profileVersion,
  }: {
    workspaceId: string;
    operationProfile: WorkspaceOperationProfile;
    profileVersion: number;
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
    const blueprint = workspaceBlueprintSchema.parse({
      id: v4(),
      version,
      status: 'AWAITING_APPROVAL',
      profileVersion,
      operationProfile,
      selectedTemplates: selectedTemplates.map((template, index) => ({
        id: template.id,
        version: template.version,
        reason:
          template.kind === 'BASE'
            ? 'Fundação obrigatória do Diex CRM.'
            : `Compatível com a operação descrita: ${template.activationCriteria.slice(0, 3).join(', ')}.`,
        confidence: index === 0 ? 100 : 80,
        optional: template.kind === 'CAPABILITY',
      })),
      objects: compose('objects'),
      fields: compose('fields'),
      relations: compose('relations'),
      pipelines: compose('pipelines'),
      pages: compose('pages'),
      views: compose('views'),
      navigation: compose('pages'),
      dashboards: compose('dashboards'),
      metrics: [
        ...new Set(selectedTemplates.flatMap(({ metrics }) => metrics)),
      ],
      automations: compose('automations'),
      roles: compose('roles'),
      permissions: [
        ...new Set(selectedTemplates.flatMap(({ permissions }) => permissions)),
      ],
      aiContext: {
        segment: operationProfile.segment,
        businessModels: operationProfile.businessModels,
        priorityObjectives: operationProfile.priorityObjectives,
        hypotheses: operationProfile.hypotheses,
      },
      integrations: compose('integrations'),
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
      promptVersion: 'workspace-blueprint@1.0.0',
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
          .map(({ id, name, label, type, isNullable }) => ({
            id,
            name,
            label,
            type,
            isNullable,
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
      navigation: Object.values(flatNavigationMenuItemMaps.byUniversalIdentifier)
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
    const operations: WorkspaceChangeOperation[] = blueprint.objects.map(
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
    const id = v4();
    const idempotencyKey = createHash('sha256')
      .update(`${workspaceId}:${blueprint.id}:${blueprint.version}`)
      .digest('hex');
    const validationErrors = operations
      .filter(({ action, risk }) => action === 'ARCHIVE' || risk === 'BLOCKED')
      .map(({ label }) => `${label}: operação destrutiva bloqueada.`);
    const changeSet = workspaceChangeSetSchema.parse({
      id,
      blueprintId: blueprint.id,
      blueprintVersion: blueprint.version,
      idempotencyKey,
      status:
        validationErrors.length === 0 ? 'AWAITING_APPROVAL' : 'VALIDATING',
      operations,
      warnings: blueprint.alerts,
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
    const artifact = await this.getArtifactByVersion(
      workspaceId,
      WorkspaceArchitectureArtifactType.CHANGE_SET,
      version,
    );
    const changeSet = workspaceChangeSetSchema.parse(artifact.payload);
    const validation = await this.validateChangeSet(changeSet);

    if (!validation.valid) {
      throw new Error(
        `Workspace change set cannot be approved: ${validation.errors.join('; ')}`,
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
      nextAction: 'apply_workspace_change_set',
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
          changeSet.status === 'ACTIVE'
        ) {
          return {
            applied: true,
            idempotentReplay: true,
            version,
            changeSetId: changeSet.id,
          };
        }

        if (changeSet.status !== 'APPROVED') {
          throw new Error(
            'Workspace change set requires explicit approval before application.',
          );
        }

        await this.updateArtifact(workspaceId, artifact.id, {
          status: WorkspaceArchitectureArtifactStatus.APPLYING,
          payload: { ...changeSet, status: 'APPLYING' },
        });

        const applied: Array<{ operationId: string; resourceId?: string }> = [];

        try {
          for (const operation of changeSet.operations) {
            await lock.assertOwnership();

            if (operation.action === 'NO_CHANGE') {
              applied.push({ operationId: operation.id });
              continue;
            }

            if (
              operation.action !== 'CREATE' ||
              operation.resourceType !== 'OBJECT' ||
              !operation.desiredState
            ) {
              throw new Error(
                `${operation.label}: operation is not supported by the safe publisher yet.`,
              );
            }

            const current =
              await this.inspectWorkspaceArchitecture(workspaceId);
            const existing = current.objects.find(
              ({ nameSingular }) => nameSingular === operation.resourceKey,
            );

            if (existing) {
              applied.push({
                operationId: operation.id,
                resourceId: existing.id,
              });
              continue;
            }

            const created = await this.objectMetadataService.createOneObject({
              workspaceId,
              createObjectInput: (operation.desiredState as unknown) as Parameters<
                typeof this.objectMetadataService.createOneObject
              >[0]['createObjectInput'],
            });

            applied.push({ operationId: operation.id, resourceId: created.id });
          }

          await this.flatEntityMapsCacheService.invalidateFlatEntityMaps({
            workspaceId,
          });
          const appliedAt = new Date();
          const activeChangeSet = workspaceChangeSetSchema.parse({
            ...changeSet,
            status: 'ACTIVE',
            appliedAt: appliedAt.toISOString(),
          });

          await this.updateArtifact(workspaceId, artifact.id, {
            status: WorkspaceArchitectureArtifactStatus.ACTIVE,
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
          const activeBlueprint = workspaceBlueprintSchema.parse({
            ...blueprintArtifact.payload,
            status: 'ACTIVE',
          });

          await this.updateArtifact(workspaceId, blueprintArtifact.id, {
            status: WorkspaceArchitectureArtifactStatus.ACTIVE,
            appliedAt,
            completedAt: appliedAt,
            payload: activeBlueprint,
          });

          return {
            applied: true,
            idempotentReplay: false,
            version,
            changeSetId: changeSet.id,
            appliedOperations: applied,
            appliedAt,
          };
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : 'Unknown publication error';

          await this.updateArtifact(workspaceId, artifact.id, {
            status: WorkspaceArchitectureArtifactStatus.FAILED,
            payload: { ...changeSet, status: 'FAILED' },
            errorDetails: { markdown: message },
          });

          throw error;
        }
      },
      `diex:workspace-architecture:apply:${workspaceId}`,
      { ttl: 30_000, renewalIntervalMs: 8_000, maxRetries: 100 },
    );
  }

  async getSetupReadiness(workspaceId: string) {
    const [profile, blueprint, changeSet] = await Promise.all([
      this.getLatestArtifact(
        workspaceId,
        WorkspaceArchitectureArtifactType.OPERATION_PROFILE,
      ),
      this.getLatestArtifact(
        workspaceId,
        WorkspaceArchitectureArtifactType.BLUEPRINT,
      ),
      this.getLatestArtifact(
        workspaceId,
        WorkspaceArchitectureArtifactType.CHANGE_SET,
      ),
    ]);
    const structuralReady =
      changeSet?.status === WorkspaceArchitectureArtifactStatus.ACTIVE;
    const items = [
      {
        key: 'review_context',
        label: 'Revisar contexto',
        required: true,
        ready: profile?.status === WorkspaceArchitectureArtifactStatus.ACTIVE,
      },
      {
        key: 'approve_structure',
        label: 'Aprovar estrutura',
        required: true,
        ready:
          blueprint?.status === WorkspaceArchitectureArtifactStatus.ACTIVE ||
          structuralReady,
      },
      {
        key: 'publish_structure',
        label: 'Montar estrutura',
        required: true,
        ready: structuralReady,
      },
      {
        key: 'connect_whatsapp',
        label: 'Conectar WhatsApp',
        required: false,
        ready: false,
      },
      {
        key: 'connect_email',
        label: 'Conectar e-mail',
        required: false,
        ready: false,
      },
      {
        key: 'invite_team',
        label: 'Convidar equipe',
        required: false,
        ready: false,
      },
    ];
    const requiredItems = items.filter(({ required }) => required);
    const completedRequiredItems = requiredItems.filter(({ ready }) => ready);

    return {
      ready: completedRequiredItems.length === requiredItems.length,
      score: Math.round(
        (completedRequiredItems.length / requiredItems.length) * 100,
      ),
      items,
      canHideFirstSteps: completedRequiredItems.length === requiredItems.length,
    };
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

    const explanation = `O Arquiteto de Workspace recomendou uma estrutura baseada no seu perfil operacional:\n\n` +
      `**Templates selecionados:**\n- ${templatesSummary}\n\n` +
      `**Módulos e Objetos Principais:**\n- ${objectsSummary}\n\n` +
      `**Benefício Comercial Esperado:**\nRedução de tempo em cadastros manuais, visibilidade de pipeline e acompanhamento automatizado de saúde dos clientes sem alterar dados existentes.`;

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
    modelId = 'diex-architect-v1',
  }: {
    workspaceId: string;
    description: string;
    modelId?: string;
  }) {
    const normDesc = normalize(description);
    const isAgency = normDesc.includes('agencia') || normDesc.includes('marketing') || normDesc.includes('trafego');
    const isSaas = normDesc.includes('saas') || normDesc.includes('software') || normDesc.includes('mrr');
    const isRealEstate = normDesc.includes('imovel') || normDesc.includes('imobiliaria') || normDesc.includes('corretor');
    const isConsulting = normDesc.includes('consultoria') || normDesc.includes('diagnostico');

    const segment = isAgency
      ? 'Agência'
      : isSaas
        ? 'SaaS'
        : isRealEstate
          ? 'Imobiliária'
          : isConsulting
            ? 'Consultoria'
            : 'Vendas B2B';

    const operationProfile: WorkspaceOperationProfile = {
      segment,
      businessModels: [segment],
      revenueModels: [isSaas ? 'Assinatura (MRR)' : 'Contrato por projeto / recorrente'],
      productsAndServices: [description.slice(0, 100)],
      idealCustomerProfile: 'Empresas B2B buscando eficiência comercial',
      customerProblems: ['Gestão de processos comerciais', 'Follow-up e controle de entregas'],
      acquisitionChannels: ['Inbound', 'Outbound', 'Indicações'],
      salesProcess: 'Qualificação, demonstração, proposta e fechamento',
      salesCycle: '15 a 45 dias',
      teamAndRoles: ['Gestor Comercial', 'Operador'],
      deliveryProcess: 'Onboarding e acompanhamento continuo',
      customerServiceProcess: 'Atendimento via Inbox Comercial (WhatsApp / E-mail)',
      customerSuccessProcess: 'Acompanhamento de saúde e renovações',
      renewalProcess: 'Revisão periódica de contrato',
      relevantMetrics: ['receita_em_pipeline', 'tempo_de_resposta', 'churn'],
      requiredIntegrations: ['WhatsApp (Evolution)', 'E-mail'],
      restrictions: ['Não excluir dados de clientes'],
      commercialRules: ['Aprovação explícita para mudanças estruturais'],
      obligationsAndRisks: [],
      toneOfVoice: 'Profissional e focado em receita',
      priorityObjectives: ['Aumentar receita', 'Reduzir tempo de resposta'],
      operationalMaturity: 'STRUCTURING',
      unitCount: 1,
      teamCount: 1,
      hypotheses: ['Operação requer acompanhamento centralizado via Inbox e visualização por Kanban.'],
      unconfirmedInformation: ['Volume médio mensal de novos leads.'],
      originalResponse: description,
    };

    return this.createInitialArchitecture({
      workspaceId,
      sourceDescription: description,
      operationProfile,
      modelId,
    });
  }


  private selectTemplateIds(profile: WorkspaceOperationProfile): string[] {
    const corpus = normalize(
      JSON.stringify({
        segment: profile.segment,
        businessModels: profile.businessModels,
        revenueModels: profile.revenueModels,
        productsAndServices: profile.productsAndServices,
        salesProcess: profile.salesProcess,
        deliveryProcess: profile.deliveryProcess,
        customerServiceProcess: profile.customerServiceProcess,
        customerSuccessProcess: profile.customerSuccessProcess,
        renewalProcess: profile.renewalProcess,
        objectives: profile.priorityObjectives,
      }),
    );
    const ids = new Set<string>(['diex.base.universal']);

    for (const template of WORKSPACE_TEMPLATE_REGISTRY) {
      if (template.kind === 'BASE' || template.kind === 'SCALE') {
        continue;
      }

      if (
        template.activationCriteria.some((criterion) =>
          corpus.includes(normalize(criterion)),
        )
      ) {
        ids.add(template.id);
      }
    }

    const scaleId =
      (profile.unitCount ?? 0) > 1
        ? 'diex.scale.multi-unit'
        : (profile.teamCount ?? 0) > 1
          ? 'diex.scale.multi-team'
          : profile.teamAndRoles.length > 1
            ? 'diex.scale.small-team'
            : 'diex.scale.solo';

    ids.add(scaleId);

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
