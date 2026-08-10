import { Injectable } from '@nestjs/common';

import { type ToolSet } from 'ai';
import { z } from 'zod';

import {
  type WorkspaceCustomPageBlockInput,
  WorkspaceArchitectureService,
} from 'src/modules/workspace-architecture/services/workspace-architecture.service';
import { WorkspaceCommercialReadinessService } from 'src/modules/workspace-architecture/services/workspace-commercial-readiness.service';
import {
  type WorkspacePageRenderer,
  workspacePageActionSchema,
  workspacePageDataContractSchema,
} from 'src/modules/workspace-architecture/types/workspace-page-catalog.schema';
import { WorkspaceArchitectureArtifactType } from 'src/modules/workspace-architecture/standard-objects/workspace-architecture-artifact.standard-object-definition';
import { workspaceBlueprintSchema } from 'src/modules/workspace-architecture/types/workspace-blueprint.schema';
import { workspaceChangeSetSchema } from 'src/modules/workspace-architecture/types/workspace-change-set.schema';

const emptyInputSchema = z.object({});
const versionInputSchema = z.object({
  version: z.number().int().positive().describe('Versão do artefato.'),
});

const workspacePageBlockInputSchema = z.object({
  key: z.string().trim().min(1).optional(),
  label: z.string().trim().min(1),
  type: z
    .enum([
      'KPI',
      'LIST',
      'PIPELINE',
      'INBOX',
      'CALENDAR',
      'TIMELINE',
      'CHECKLIST',
      'AI_SUMMARY',
    ])
    .optional(),
  description: z.string().trim().min(1).optional(),
  dataSources: z.array(z.string().trim().min(1)).max(20).optional(),
  dataContracts: z.array(workspacePageDataContractSchema).max(20).optional(),
  actions: z.array(workspacePageActionSchema).max(12).optional(),
  actionLabel: z.string().trim().min(1).optional(),
  actionRoute: z.string().trim().min(1).optional(),
  configuration: z.record(z.string(), z.unknown()).optional(),
});

@Injectable()
export class WorkspaceArchitectureToolWorkspaceService {
  constructor(
    private readonly workspaceArchitectureService: WorkspaceArchitectureService,
    private readonly workspaceCommercialReadinessService: WorkspaceCommercialReadinessService,
  ) {}

  generateTools(workspaceId: string): ToolSet {
    return {
      inspect_workspace_architecture: {
        description:
          'Inspeciona objetos, campos, views, page layouts, navegação, agentes e roles atualmente publicados no workspace. Somente leitura; custo de IA zero; use antes de propor mudanças.',
        inputSchema: emptyInputSchema,
        execute: async () =>
          this.workspaceArchitectureService.inspectWorkspaceArchitecture(
            workspaceId,
          ),
      },
      list_workspace_templates: {
        description:
          'Lista o registry declarativo e versionado de templates do Diex. Somente leitura; custo de IA zero.',
        inputSchema: emptyInputSchema,
        execute: async () => this.workspaceArchitectureService.listTemplates(),
      },
      get_workspace_operation_profile: {
        description:
          'Retorna o perfil operacional estruturado mais recente deste workspace. Não expõe outro workspace nem segredos.',
        inputSchema: emptyInputSchema,
        execute: async () => {
          const artifact =
            await this.workspaceArchitectureService.getLatestArtifact(
              workspaceId,
              WorkspaceArchitectureArtifactType.OPERATION_PROFILE,
            );

          return artifact
            ? {
                version: artifact.version,
                status: artifact.status,
                summary: artifact.summary,
                profile: artifact.payload,
              }
            : { version: null, status: null, profile: null };
        },
      },
      get_workspace_ai_operating_context: {
        description:
          'Retorna o contexto operacional compilado e versionado que deve ser compartilhado pela IA interna, MCP, Inbox e campanhas. Somente leitura; custo de IA zero.',
        inputSchema: emptyInputSchema,
        execute: async () =>
          this.workspaceArchitectureService.getAiOperatingContext(workspaceId),
      },
      get_workspace_ai_policy: {
        description:
          'Retorna os limites de uso, canais permitidos, horário operacional e tipos de ação bloqueados pela política do administrador. Somente leitura; custo de IA zero.',
        inputSchema: emptyInputSchema,
        execute: async () =>
          this.workspaceArchitectureService.getAiPolicy(workspaceId),
      },
      recommend_workspace_blueprint: {
        description:
          'Gera uma nova recomendação combinando o perfil operacional atual com templates versionados. Cria somente estado recomendado e nunca publica metadados.',
        inputSchema: emptyInputSchema,
        execute: async () => {
          const profileArtifact =
            await this.workspaceArchitectureService.getLatestArtifact(
              workspaceId,
              WorkspaceArchitectureArtifactType.OPERATION_PROFILE,
            );

          if (!profileArtifact) {
            throw new Error(
              'Workspace operation profile is missing. Complete onboarding or extract the profile first.',
            );
          }

          return this.workspaceArchitectureService.recommendBlueprint({
            workspaceId,
            operationProfile: profileArtifact.payload as never,
            profileVersion: profileArtifact.version,
          });
        },
      },
      get_workspace_blueprint: {
        description:
          'Retorna o blueprint recomendado mais recente, incluindo templates, justificativas, confiança, hipóteses e estrutura proposta.',
        inputSchema: emptyInputSchema,
        execute: async () => {
          const artifact =
            await this.workspaceArchitectureService.getLatestArtifact(
              workspaceId,
              WorkspaceArchitectureArtifactType.BLUEPRINT,
            );

          return artifact
            ? {
                version: artifact.version,
                status: artifact.status,
                blueprint: artifact.payload,
              }
            : { version: null, status: null, blueprint: null };
        },
      },
      compare_workspace_blueprint: {
        description:
          'Compara o blueprint mais recente com os metadados publicados e grava um change set idempotente. Não aplica mudanças.',
        inputSchema: emptyInputSchema,
        execute: async () => {
          const artifact =
            await this.workspaceArchitectureService.getLatestArtifact(
              workspaceId,
              WorkspaceArchitectureArtifactType.BLUEPRINT,
            );

          if (!artifact) {
            throw new Error('Workspace blueprint is missing.');
          }

          return this.workspaceArchitectureService.createChangeSet({
            workspaceId,
            blueprint: workspaceBlueprintSchema.parse(artifact.payload),
          });
        },
      },
      validate_workspace_change_set: {
        description:
          'Valida schema, risco, bloqueios destrutivos e prontidão de um change set. Somente leitura.',
        inputSchema: versionInputSchema,
        execute: async ({ version }: { version: number }) => {
          const artifact =
            await this.workspaceArchitectureService.getLatestArtifact(
              workspaceId,
              WorkspaceArchitectureArtifactType.CHANGE_SET,
            );

          if (!artifact || artifact.version !== version) {
            throw new Error(
              `Workspace change set version ${version} not found.`,
            );
          }

          return this.workspaceArchitectureService.validateChangeSet(
            workspaceChangeSetSchema.parse(artifact.payload),
          );
        },
      },
      preview_workspace_change_set: {
        description:
          'Mostra alterações, impacto, risco, reversibilidade e benefício antes da aprovação. Não publica nada.',
        inputSchema: versionInputSchema,
        execute: async ({ version }: { version: number }) => {
          const artifact =
            await this.workspaceArchitectureService.getLatestArtifact(
              workspaceId,
              WorkspaceArchitectureArtifactType.CHANGE_SET,
            );

          if (!artifact || artifact.version !== version) {
            throw new Error(
              `Workspace change set version ${version} not found.`,
            );
          }

          const changeSet = workspaceChangeSetSchema.parse(artifact.payload);

          return {
            version,
            status: artifact.status,
            operations: changeSet.operations.map(
              ({
                action,
                resourceType,
                resourceKey,
                label,
                reason,
                impact,
                reversible,
                risk,
                dataImpact,
                blockedReason,
              }) => ({
                action,
                resourceType,
                resourceKey,
                label,
                reason,
                impact,
                reversible,
                risk,
                dataImpact,
                blockedReason,
              }),
            ),
            warnings: changeSet.warnings,
            validationErrors: changeSet.validationErrors,
          };
        },
      },
      approve_workspace_change_set: {
        description:
          'Registra aprovação explícita de um change set validado. Exige permissão de modelo de dados e ainda não aplica a estrutura.',
        inputSchema: versionInputSchema,
        execute: async ({ version }: { version: number }) =>
          this.workspaceArchitectureService.approveChangeSet({
            workspaceId,
            version,
          }),
      },
      apply_workspace_change_set: {
        description:
          'Aplica somente um change set explicitamente aprovado, com lock distribuído, idempotência, publicação nativa de objetos e campos, ativação declarativa dos demais recursos e auditoria. Quando um recurso ainda não possui adaptador nativo, retorna PARTIALLY_APPLIED e mantém o backlog explícito. Se a publicação nativa falhar, tenta compensar somente os objetos e campos criados nesta execução. Operações destrutivas são bloqueadas.',
        inputSchema: versionInputSchema,
        execute: async ({ version }: { version: number }) =>
          this.workspaceArchitectureService.applyApprovedChangeSet({
            workspaceId,
            version,
          }),
      },
      get_workspace_setup_readiness: {
        description:
          'Calcula o mesmo readiness comercial usado pelo onboarding e pelo cockpit: contexto, oferta, pipeline, responsáveis, WhatsApp, primeira oportunidade, follow-up e triagem.',
        inputSchema: emptyInputSchema,
        execute: async () =>
          this.workspaceCommercialReadinessService.getReadiness(workspaceId),
      },
      get_workspace_onboarding_evidence: {
        description:
          'Retorna a trilha durável de marcos e eventos reconciliados do onboarding comercial. Somente leitura; custo de IA zero.',
        inputSchema: emptyInputSchema,
        execute: async () =>
          (await this.workspaceArchitectureService.getOnboardingEvidence(
            workspaceId,
          )) ?? {
            version: null,
            milestones: [],
            events: [],
            activation: {
              completedCount: 0,
              totalCount: 0,
              score: 0,
              firstValueAt: null,
              blockers: [],
            },
            channel: {
              provider: 'WHATSAPP',
              state: 'UNKNOWN',
              instanceName: null,
              lastCheckedAt: null,
              validatedAt: null,
              lastError: null,
            },
            lastReconciledAt: null,
          },
      },
      preview_workspace_import: {
        description:
          'Analisa cabeçalhos e amostras de uma importação para qualquer objeto adaptativo, sugere mapeamento, deduplicação e campos obrigatórios. Cria uma prévia durável em AWAITING_APPROVAL, não grava registros e não consome tokens.',
        inputSchema: z.object({
          objectName: z.string().trim().min(1),
          headers: z.array(z.string().trim().min(1)).min(1).max(100),
          sampleRows: z
            .array(z.record(z.string(), z.unknown()))
            .max(10)
            .default([]),
        }),
        execute: async ({
          objectName,
          headers,
          sampleRows,
        }: {
          objectName: string;
          headers: string[];
          sampleRows: Array<Record<string, unknown>>;
        }) =>
          this.workspaceArchitectureService.previewWorkspaceImport({
            workspaceId,
            objectName,
            headers,
            sampleRows,
          }),
      },
      approve_workspace_import: {
        description:
          'Aprova explicitamente uma prévia de importação. A aprovação não grava registros; libera somente o lote identificado pelo planId para aplicação.',
        inputSchema: z.object({
          planId: z.string().trim().min(1),
        }),
        execute: async ({ planId }: { planId: string }) =>
          this.workspaceArchitectureService.approveWorkspaceImport({
            workspaceId,
            planId,
          }),
      },
      get_workspace_import_batch: {
        description:
          'Consulta o estado durável de uma importação, seus contadores, erros e IDs de rollback. Somente leitura; custo de IA zero.',
        inputSchema: z.object({
          planId: z.string().trim().min(1),
        }),
        execute: async ({ planId }: { planId: string }) =>
          this.workspaceArchitectureService.getWorkspaceImportBatch({
            workspaceId,
            planId,
          }),
      },
      apply_workspace_import: {
        description:
          'Grava um lote de até 500 registros somente após aprovação explícita da prévia. Usa o mapeamento aprovado, rejeita cabeçalhos alterados, deduplica linhas repetidas e salva IDs para rollback reversível.',
        inputSchema: z.object({
          planId: z.string().trim().min(1),
          headers: z.array(z.string().trim().min(1)).min(1).max(100),
          rows: z
            .array(z.record(z.string(), z.unknown()))
            .min(1)
            .max(500),
        }),
        execute: async ({
          planId,
          headers,
          rows,
        }: {
          planId: string;
          headers: string[];
          rows: Array<Record<string, unknown>>;
        }) =>
          this.workspaceArchitectureService.applyWorkspaceImport({
            workspaceId,
            planId,
            headers,
            rows,
          }),
      },
      rollback_workspace_import: {
        description:
          'Executa rollback reversível de um lote ativo usando soft delete e mantém os IDs que falharem para nova tentativa. Não remove permanentemente dados.',
        inputSchema: z.object({
          planId: z.string().trim().min(1),
        }),
        execute: async ({ planId }: { planId: string }) =>
          this.workspaceArchitectureService.rollbackWorkspaceImport({
            workspaceId,
            planId,
          }),
      },
      get_workspace_page_catalog: {
        description:
          'Lista as páginas operacionais deste workspace, seu estado no menu, origem, fontes de dados e próxima ação. Somente leitura.',
        inputSchema: emptyInputSchema,
        execute: async () =>
          this.workspaceArchitectureService.getPageCatalog(workspaceId),
      },
      get_workspace_adaptive_drift: {
        description:
          'Compara perfil, blueprint aprovado, catálogo adaptativo, contratos de páginas e itens obrigatórios para encontrar drift antes de perder leads ou deixar uma tela sem direção. Somente leitura; custo de IA zero.',
        inputSchema: emptyInputSchema,
        execute: async () =>
          this.workspaceArchitectureService.getAdaptiveDrift(workspaceId),
      },
      create_workspace_page: {
        description:
          'Cria uma página operacional personalizada para este workspace. A página é criada como proposta da IA e começa com estado seguro, sem alterar metadados nativos.',
        inputSchema: z.object({
          label: z.string().trim().min(2).describe('Nome da página.'),
          description: z
            .string()
            .trim()
            .min(1)
            .optional()
            .describe('Decisão ou ação comercial que a página deve apoiar.'),
          renderer: z
            .enum(['INBOX', 'DASHBOARD', 'PIPELINE', 'CALENDAR', 'OPERATIONS', 'CUSTOM'])
            .optional(),
          icon: z.string().trim().min(1).optional(),
          navigationGroup: z.string().trim().min(1).optional(),
          capabilities: z.array(z.string().trim().min(1)).max(12).optional(),
          dataSources: z.array(z.string().trim().min(1)).max(20).optional(),
          blocks: z.array(workspacePageBlockInputSchema).max(12).optional(),
        }),
        execute: async ({
          label,
          description,
          renderer,
          icon,
          navigationGroup,
          capabilities,
          dataSources,
          blocks,
        }: {
          label: string;
          description?: string;
          renderer?: WorkspacePageRenderer;
          icon?: string;
          navigationGroup?: string;
          capabilities?: string[];
          dataSources?: string[];
          blocks?: WorkspaceCustomPageBlockInput[];
        }) =>
          this.workspaceArchitectureService.createCustomPage({
            workspaceId,
            label,
            description,
            renderer,
            icon,
            navigationGroup,
            capabilities,
            dataSources,
            blocks,
            aiGenerated: true,
          }),
      },
      update_workspace_page: {
        description:
          'Atualiza nome, descrição, renderer, blocos, fontes de dados, posição ou visibilidade no menu de qualquer página adaptativa deste workspace. Rotas nativas, dados e exclusão das páginas essenciais continuam protegidos.',
        inputSchema: z.object({
          key: z.string().min(1).describe('Chave da página.'),
          label: z.string().trim().min(2).optional(),
          description: z.string().trim().min(1).optional(),
          showInNavigation: z.boolean().optional(),
          position: z.number().int().nonnegative().optional(),
          renderer: z
            .enum(['INBOX', 'DASHBOARD', 'PIPELINE', 'CALENDAR', 'OPERATIONS', 'CUSTOM'])
            .optional(),
          icon: z.string().trim().min(1).optional(),
          navigationGroup: z.string().trim().min(1).optional(),
          capabilities: z.array(z.string().trim().min(1)).max(12).optional(),
          dataSources: z.array(z.string().trim().min(1)).max(20).optional(),
          primaryAction: z.string().trim().min(1).optional(),
          blocks: z.array(workspacePageBlockInputSchema).max(12).optional(),
        }),
        execute: async ({
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
        }) =>
          this.workspaceArchitectureService.updatePage({
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
          }),
      },
      archive_workspace_page: {
        description:
          'Arquiva uma página recomendada ou personalizada de forma reversível. Nunca remove páginas essenciais nem dados.',
        inputSchema: z.object({ key: z.string().min(1) }),
        execute: async ({ key }: { key: string }) =>
          this.workspaceArchitectureService.archivePage(workspaceId, key),
      },
      restore_workspace_page: {
        description:
          'Restaura uma página arquivada e a devolve ao menu adaptativo.',
        inputSchema: z.object({ key: z.string().min(1) }),
        execute: async ({ key }: { key: string }) =>
          this.workspaceArchitectureService.restorePage(workspaceId, key),
      },
      get_workspace_blueprint_history: {
        description:
          'Retorna histórico compacto e versionado de perfil, blueprint, change sets, feedback e modelo deste workspace.',
        inputSchema: z.object({
          limit: z.number().int().min(1).max(100).default(30),
        }),
        execute: async ({ limit }: { limit: number }) => {
          const artifacts = await this.workspaceArchitectureService.getHistory(
            workspaceId,
            limit,
          );

          return artifacts.map(
            ({
              id,
              artifactType,
              status,
              version,
              name,
              summary,
              createdAt,
              approvedAt,
              appliedAt,
              completedAt,
            }) => ({
              id,
              artifactType,
              status,
              version,
              name,
              summary,
              createdAt,
              approvedAt,
              appliedAt,
              completedAt,
            }),
          );
        },
      },
      rollback_workspace_blueprint_version: {
        description:
          'Prepara uma solicitação de rollback não destrutivo para uma versão do blueprint. Nunca executa exclusões automaticamente e exige nova aprovação.',
        inputSchema: z.object({
          blueprintVersion: z.number().int().positive(),
        }),
        execute: async ({ blueprintVersion }: { blueprintVersion: number }) =>
          this.workspaceArchitectureService.requestRollback({
            workspaceId,
            blueprintVersion,
          }),
      },
      extract_workspace_operation_profile: {
        description:
          'Extrai e analisa o perfil operacional a partir de uma descrição aberta em linguagem natural fornecida pelo usuário durante o onboarding ou chat.',
        inputSchema: z.object({
          sourceDescription: z
            .string()
            .min(1)
            .describe('Descrição aberta da operação comercial.'),
        }),
        execute: async ({ sourceDescription }: { sourceDescription: string }) =>
          this.workspaceArchitectureService.extractOperationProfileFromText({
            workspaceId,
            description: sourceDescription,
          }),
      },
      update_workspace_ai_context: {
        description:
          'Atualiza o contexto de IA do workspace com novos objetivos, restrições ou termos comerciais.',
        inputSchema: z.object({
          aiContext: z
            .record(z.string(), z.unknown())
            .describe('Objeto de contexto de IA a atualizar.'),
        }),
        execute: async ({
          aiContext,
        }: {
          aiContext: Record<string, unknown>;
        }) =>
          this.workspaceArchitectureService.updateAiContext({
            workspaceId,
            aiContext,
          }),
      },
      explain_workspace_recommendation: {
        description:
          'Gera uma explicação em linguagem comercial e acessível sobre as recomendações do blueprint, destacando o valor econômico, sem expor JSONs ou metadados brutos.',
        inputSchema: z.object({
          version: z
            .number()
            .int()
            .positive()
            .optional()
            .describe('Versão opcional do blueprint a explicar.'),
        }),
        execute: async ({ version }: { version?: number }) =>
          this.workspaceArchitectureService.explainRecommendation({
            workspaceId,
            version,
          }),
      },
    };
  }
}
