import { Injectable } from '@nestjs/common';

import { type ToolSet } from 'ai';
import { z } from 'zod';

import { WorkspaceArchitectureService } from 'src/modules/workspace-architecture/services/workspace-architecture.service';
import { WorkspaceArchitectureArtifactType } from 'src/modules/workspace-architecture/standard-objects/workspace-architecture-artifact.standard-object-definition';
import { workspaceBlueprintSchema } from 'src/modules/workspace-architecture/types/workspace-blueprint.schema';
import { workspaceChangeSetSchema } from 'src/modules/workspace-architecture/types/workspace-change-set.schema';

const emptyInputSchema = z.object({});
const versionInputSchema = z.object({
  version: z.number().int().positive().describe('Versão do artefato.'),
});

@Injectable()
export class WorkspaceArchitectureToolWorkspaceService {
  constructor(
    private readonly workspaceArchitectureService: WorkspaceArchitectureService,
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
          'Aplica somente um change set explicitamente aprovado, com lock distribuído, idempotência, publicação nativa e auditoria. Operações destrutivas são bloqueadas.',
        inputSchema: versionInputSchema,
        execute: async ({ version }: { version: number }) =>
          this.workspaceArchitectureService.applyApprovedChangeSet({
            workspaceId,
            version,
          }),
      },
      get_workspace_setup_readiness: {
        description:
          'Calcula a prontidão central do workspace para Primeiros passos, dashboard, IA, MCP e alertas.',
        inputSchema: emptyInputSchema,
        execute: async () =>
          this.workspaceArchitectureService.getSetupReadiness(workspaceId),
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
