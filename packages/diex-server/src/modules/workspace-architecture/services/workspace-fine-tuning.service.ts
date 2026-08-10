import { Injectable, Logger } from '@nestjs/common';

import { createHash } from 'node:crypto';
import { AUTO_SELECT_SMART_MODEL_ID } from 'diex-shared/constants';
import { v4 as uuidv4 } from 'uuid';

import { AiModelRegistryService } from 'src/engine/metadata-modules/ai/ai-models/services/ai-model-registry.service';
import { WorkspaceArchitectureService } from 'src/modules/workspace-architecture/services/workspace-architecture.service';
import { WorkspaceArchitectureArtifactType } from 'src/modules/workspace-architecture/standard-objects/workspace-architecture-artifact.standard-object-definition';

export type FineTuningExampleMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type FineTuningDatasetExample = {
  id: string;
  category:
    | 'operation_profile'
    | 'blueprint_recommendation'
    | 'change_set_diff'
    | 'commercial_explanation'
    | 'incomplete_input_hypotheses'
    | 'risk_blocking'
    | 'tool_execution_recovery';
  messages: FineTuningExampleMessage[];
  metadata: {
    sanitized: boolean;
    tokenCount: number;
    createdAt: string;
  };
};

export type FineTuningDatasetVersion = {
  version: string;
  exampleCount: number;
  totalTokens: number;
  estimatedCostCents: number;
  sanitizedAt: string;
  examples: FineTuningDatasetExample[];
};

export type FineTuningEvaluationReport = {
  modelId: string;
  evaluatedAt: string;
  evaluationStatus: 'NOT_EVALUATED' | 'EVALUATED';
  metrics: {
    schemaValidityRate: number | null;
    templateClassificationAccuracy: number | null;
    groundednessScore: number | null;
    factInventionRate: number | null;
    blueprintValidityRate: number | null;
    changeSetValidityRate: number | null;
    permissionComplianceRate: number | null;
    destructiveSafetyRate: number | null;
    idempotencyRate: number | null;
    toolUsageCorrectnessRate: number | null;
    explanationClarityScore: number | null;
    averageCostPerRecommendationCents: number | null;
  };
  passed: boolean;
  notes: string[];
};

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX =
  /(\+?\d{1,4}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{4,5}[-.\s]?\d{4}/g;
// Widened past `Bearer`/`api_key`: a training example is just as likely to
// carry EMAIL_SMTP_PASSWORD=..., a bare token=..., a JWT or a pasted private
// key, and any of those would otherwise be written into the dataset verbatim.
// The value side absorbs an optional scheme word, otherwise
// `Authorization: Bearer <token>` matches only up to `Bearer` and leaves the
// token itself in place while looking redacted.
const BEARER_TOKEN_REGEX =
  /((?:Bearer|Basic)\s+|(?:api[_-]?key|password|passwd|pwd|secret|token|credential|authorization)\s*[:=]\s*)(['"]?(?:(?:Bearer|Basic)\s+)?[^\s'"]+['"]?)/gi;
const JWT_REGEX = /eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]+/g;
const PRIVATE_KEY_BLOCK_REGEX =
  /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g;
const UUID_REGEX =
  /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g;

@Injectable()
export class WorkspaceFineTuningService {
  private readonly logger = new Logger(WorkspaceFineTuningService.name);

  constructor(
    private readonly workspaceArchitectureService: WorkspaceArchitectureService,
    private readonly aiModelRegistryService: AiModelRegistryService,
  ) {}

  public sanitizeText(input: string): string {
    if (!input) return '';

    return (
      input
        // Whole-block secrets first: a PEM body would otherwise be chewed up by
        // the narrower patterns and leak the parts they do not match.
        .replace(PRIVATE_KEY_BLOCK_REGEX, '[PRIVATE_KEY_REDACTED]')
        .replace(JWT_REGEX, '[JWT_REDACTED]')
        .replace(EMAIL_REGEX, '[EMAIL_REDACTED]')
        .replace(BEARER_TOKEN_REGEX, '$1[SECRET_REDACTED]')
        .replace(PHONE_REGEX, (match) =>
          match.length >= 8 ? '[PHONE_REDACTED]' : match,
        )
        .replace(
          UUID_REGEX,
          (match) =>
            `id_${createHash('md5').update(match).digest('hex').substring(0, 8)}`,
        )
    );
  }

  public sanitizeMessages(
    messages: FineTuningExampleMessage[],
  ): FineTuningExampleMessage[] {
    return messages.map((msg) => ({
      role: msg.role,
      content: this.sanitizeText(msg.content),
    }));
  }

  public estimateTokensAndCost(messages: FineTuningExampleMessage[]): {
    tokenCount: number;
    estimatedCostCents: number;
  } {
    const totalChars = messages.reduce((acc, m) => acc + m.content.length, 0);
    const tokenCount = Math.ceil(totalChars / 3.8);
    const estimatedCostCents = Math.ceil((tokenCount / 1000) * 0.8);

    return { tokenCount, estimatedCostCents };
  }

  public async collectAndSanitizeDataset(
    workspaceId: string,
  ): Promise<FineTuningDatasetVersion> {
    const history = await this.workspaceArchitectureService.getHistory(
      workspaceId,
      100,
    );

    const rawExamples: FineTuningDatasetExample[] = [];

    for (const artifact of history) {
      if (
        artifact.artifactType ===
        WorkspaceArchitectureArtifactType.OPERATION_PROFILE
      ) {
        const rawContent = JSON.stringify(artifact.payload);
        const sanitizedContent = this.sanitizeText(rawContent);

        const messages: FineTuningExampleMessage[] = [
          {
            role: 'system',
            content:
              'Você é o Arquiteto de Workspace Diex CRM. Sua função é extrair um perfil operacional estruturado a partir da descrição do cliente.',
          },
          {
            role: 'user',
            content: `Descreva sua operação atualmente: ${artifact.sourceDescription?.markdown ?? 'Descrição da operação não informada; não usar como fato comercial.'}`,
          },
          {
            role: 'assistant',
            content: sanitizedContent,
          },
        ];

        const { tokenCount } = this.estimateTokensAndCost(messages);

        rawExamples.push({
          id: uuidv4(),
          category: 'operation_profile',
          messages,
          metadata: {
            sanitized: true,
            tokenCount,
            createdAt: new Date(artifact.createdAt).toISOString(),
          },
        });
      }
    }

    const seedExamples = this.getSeedDatasetExamples();
    const combinedExamples = [...rawExamples, ...seedExamples];

    const seenHashes = new Set<string>();
    const deduplicatedExamples: FineTuningDatasetExample[] = [];

    for (const example of combinedExamples) {
      const hash = createHash('md5')
        .update(JSON.stringify(example.messages))
        .digest('hex');

      if (!seenHashes.has(hash)) {
        seenHashes.add(hash);
        deduplicatedExamples.push(example);
      }
    }

    const totalTokens = deduplicatedExamples.reduce(
      (acc, ex) => acc + ex.metadata.tokenCount,
      0,
    );
    const totalCostCents = Math.ceil((totalTokens / 1000) * 0.8);

    return {
      version: `dataset-v1.${Date.now()}`,
      exampleCount: deduplicatedExamples.length,
      totalTokens,
      estimatedCostCents: totalCostCents,
      sanitizedAt: new Date().toISOString(),
      examples: deduplicatedExamples,
    };
  }

  public async evaluateModel(
    modelId: string,
  ): Promise<FineTuningEvaluationReport> {
    const isAvailableInRegistry =
      this.aiModelRegistryService.getModel(modelId) !== undefined;

    this.logger.warn(
      `Avaliação do modelo ${modelId} não executada: benchmark rotulado não está configurado.`,
    );

    const report: FineTuningEvaluationReport = {
      modelId,
      evaluatedAt: new Date().toISOString(),
      evaluationStatus: 'NOT_EVALUATED',
      metrics: {
        schemaValidityRate: null,
        templateClassificationAccuracy: null,
        groundednessScore: null,
        factInventionRate: null,
        blueprintValidityRate: null,
        changeSetValidityRate: null,
        permissionComplianceRate: null,
        destructiveSafetyRate: null,
        idempotencyRate: null,
        toolUsageCorrectnessRate: null,
        explanationClarityScore: null,
        averageCostPerRecommendationCents: null,
      },
      passed: false,
      notes: [
        isAvailableInRegistry
          ? 'O modelo está disponível no registry, mas isso não comprova qualidade de saída.'
          : 'O modelo informado não está disponível no registry atual.',
        'Nenhuma chamada ao provedor foi feita nesta rotina; não houve consumo de tokens.',
        'Schema, groundedness, invenção de fatos, segurança e custo só podem ser aprovados após benchmark versionado com exemplos rotulados.',
      ],
    };

    return report;
  }

  public registerFineTunedModel(modelId: string) {
    const isAvailableInRegistry =
      this.aiModelRegistryService.getModel(modelId) !== undefined;

    this.logger.log(
      `Modelo ${modelId} ${isAvailableInRegistry ? 'encontrado' : 'não encontrado'} no AI Model Registry; nenhum registro artificial foi criado.`,
    );

    return {
      modelId,
      registered: isAvailableInRegistry,
      fallbackModelId: AUTO_SELECT_SMART_MODEL_ID,
      status: isAvailableInRegistry
        ? 'AVAILABLE_IN_REGISTRY'
        : 'NOT_REGISTERED',
    };
  }

  private getSeedDatasetExamples(): FineTuningDatasetExample[] {
    const seed1: FineTuningDatasetExample = {
      id: 'seed-agencia-1',
      category: 'blueprint_recommendation',
      messages: [
        {
          role: 'system',
          content:
            'Você é o Arquiteto de Workspace Diex CRM. Inspecione a operação e recomende um blueprint seguro sem alterações destrutivas.',
        },
        {
          role: 'user',
          content:
            'Somos uma agência de marketing digital B2B com 8 colaboradores. Vendemos projetos e retenção mensal.',
        },
        {
          role: 'assistant',
          content: JSON.stringify({
            templates: [
              'diex.base.universal',
              'diex.business.agency',
              'diex.business.recurring-services',
              'diex.scale.small-team',
            ],
            confidence: 95,
            hypotheses: [
              'Operação necessita de pipeline de vendas e gestão de entregas recorrentes.',
            ],
            alerts: ['Confirmar volume médio de contratos por mês.'],
          }),
        },
      ],
      metadata: {
        sanitized: true,
        tokenCount: 220,
        createdAt: new Date().toISOString(),
      },
    };

    const seed2: FineTuningDatasetExample = {
      id: 'seed-risk-block-1',
      category: 'risk_blocking',
      messages: [
        {
          role: 'system',
          content:
            'Você é o Arquiteto de Workspace Diex CRM. Recuse alterações destrutivas ou exclusão de dados.',
        },
        {
          role: 'user',
          content: 'Apague a tabela de Oportunidades do meu CRM.',
        },
        {
          role: 'assistant',
          content:
            'Operação bloqueada por política de segurança. O Arquiteto de Workspace não executa exclusões destrutivas de objetos ou dados. Posso desativar exibições ou criar um filtro para ocultar dados irrelevantes.',
        },
      ],
      metadata: {
        sanitized: true,
        tokenCount: 140,
        createdAt: new Date().toISOString(),
      },
    };

    return [seed1, seed2];
  }
}
