import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AskDiexCopilotInput } from 'src/engine/core-modules/diex-agency/dtos/ask-diex-copilot.input';
import { DiexCopilotResponseDTO } from 'src/engine/core-modules/diex-agency/dtos/copilot-response.dto';
import { DiexAgencyMetricEntryEntity } from 'src/engine/core-modules/diex-agency/entities/diex-agency-metric-entry.entity';
import {
  MetricUnitType,
  type DiexAgencyMetricDefinitionEntity,
} from 'src/engine/core-modules/diex-agency/entities/diex-agency-metric-definition.entity';
import { DiexAiContextScopeService } from 'src/engine/core-modules/diex-agency/services/diex-ai-context-scope.service';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';

const REPORTING_WINDOW_DAYS = 30;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

// The metric entry is scoped by the client it belongs to, not by a `workspaceId`
// column. Naming the wrong column made every non-admin request fail with
// "column metrics.workspaceId does not exist" instead of returning data.
const METRIC_ENTRY_WORKSPACE_COLUMN = 'clientWorkspaceId';

type MetricTotals = {
  label: string;
  code: string;
  unitType: MetricUnitType;
  currencyCode: string;
  current: number;
  previous: number;
};

@Injectable()
export class DiexAgencyAiCopilotService {
  constructor(
    private readonly scopeService: DiexAiContextScopeService,
    // eslint-disable-next-line diex/prefer-workspace-scoped-repository
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
    // eslint-disable-next-line diex/prefer-workspace-scoped-repository
    @InjectRepository(DiexAgencyMetricEntryEntity)
    private readonly metricEntryRepository: Repository<DiexAgencyMetricEntryEntity>,
  ) {}

  async processCopilotQuery(
    userId: string,
    input: AskDiexCopilotInput,
  ): Promise<DiexCopilotResponseDTO> {
    const scopeContext = await this.scopeService.resolveUserScopeContext(
      userId,
      input.currentWorkspaceId,
    );

    if (input.currentWorkspaceId) {
      this.scopeService.enforceWorkspacePermission(
        scopeContext,
        input.currentWorkspaceId,
      );
    }

    const workspaceQueryBuilder =
      this.workspaceRepository.createQueryBuilder('workspace');

    this.scopeService.applyRlsToQueryBuilder(
      workspaceQueryBuilder,
      scopeContext,
      'id',
    );

    const authorizedWorkspaces = await workspaceQueryBuilder.getMany();
    const workspaceNames = authorizedWorkspaces
      .map((workspace) => workspace.displayName)
      .filter((name): name is string => typeof name === 'string');

    const metricsQueryBuilder = this.metricEntryRepository
      .createQueryBuilder('metrics')
      .innerJoinAndSelect('metrics.metricDefinition', 'definition');

    this.scopeService.applyRlsToQueryBuilder(
      metricsQueryBuilder,
      scopeContext,
      METRIC_ENTRY_WORKSPACE_COLUMN,
    );

    const entries = await metricsQueryBuilder.getMany();
    const totals = this.aggregateByMetric(entries);

    return {
      reply: this.buildReply({
        scopeLevel: scopeContext.scopeLevel,
        workspaceCount: authorizedWorkspaces.length,
        workspaceNames,
        totals,
        entryCount: entries.length,
      }),
      scopeLevel: scopeContext.scopeLevel,
      workspacesAnalyzed: workspaceNames,
      actionSuggested: this.suggestAction(scopeContext.scopeLevel),
    };
  }

  private aggregateByMetric(
    entries: DiexAgencyMetricEntryEntity[],
  ): MetricTotals[] {
    const now = Date.now();
    const currentWindowStart =
      now - REPORTING_WINDOW_DAYS * MILLISECONDS_PER_DAY;
    const previousWindowStart =
      now - 2 * REPORTING_WINDOW_DAYS * MILLISECONDS_PER_DAY;
    const totalsByCode = new Map<string, MetricTotals>();

    for (const entry of entries) {
      const definition = entry.metricDefinition as
        | DiexAgencyMetricDefinitionEntity
        | undefined;

      if (!definition) {
        continue;
      }

      const periodEnd = new Date(entry.periodEnd).getTime();
      const isCurrent = periodEnd >= currentWindowStart;
      const isPrevious =
        periodEnd >= previousWindowStart && periodEnd < currentWindowStart;

      if (!isCurrent && !isPrevious) {
        continue;
      }

      const totals = totalsByCode.get(definition.code) ?? {
        label: definition.name,
        code: definition.code,
        unitType: definition.unitType,
        currencyCode: definition.currencyCode ?? 'BRL',
        current: 0,
        previous: 0,
      };

      if (isCurrent) {
        totals.current += Number(entry.value);
      } else {
        totals.previous += Number(entry.value);
      }

      totalsByCode.set(definition.code, totals);
    }

    return [...totalsByCode.values()].sort((left, right) =>
      left.label.localeCompare(right.label),
    );
  }

  private formatValue(totals: MetricTotals, value: number): string {
    switch (totals.unitType) {
      case MetricUnitType.CURRENCY:
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: totals.currencyCode,
        }).format(value);
      case MetricUnitType.PERCENTAGE:
        return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;
      case MetricUnitType.RATIO:
        return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}x`;
      default:
        return value.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
    }
  }

  private formatVariation(totals: MetricTotals): string {
    if (totals.previous === 0) {
      return 'sem base de comparação';
    }

    const variation =
      ((totals.current - totals.previous) / Math.abs(totals.previous)) * 100;
    const sign = variation >= 0 ? '+' : '';

    return `${sign}${variation.toLocaleString('pt-BR', {
      maximumFractionDigits: 1,
    })}% vs. período anterior`;
  }

  private buildReply({
    scopeLevel,
    workspaceCount,
    workspaceNames,
    totals,
    entryCount,
  }: {
    scopeLevel: string;
    workspaceCount: number;
    workspaceNames: string[];
    totals: MetricTotals[];
    entryCount: number;
  }): string {
    const header = this.buildHeader({
      scopeLevel,
      workspaceCount,
      workspaceNames,
    });

    // An empty result is reported as empty. Filling the gap with plausible
    // figures would let an operator forward invented spend and ROAS to a client
    // as if the platform had measured them.
    if (totals.length === 0) {
      return (
        `${header}\n\n` +
        `Nenhuma métrica foi registrada nos últimos ${REPORTING_WINDOW_DAYS} dias ` +
        `para os workspaces a que você tem acesso. ` +
        `Registre entradas de métricas ou conecte uma conta do Meta Ads para que eu possa analisar os números.`
      );
    }

    const lines = totals.map(
      (metric) =>
        `- ${metric.label}: ${this.formatValue(metric, metric.current)} (${this.formatVariation(metric)})`,
    );

    return (
      `${header}\n\n` +
      `Últimos ${REPORTING_WINDOW_DAYS} dias, a partir de ${entryCount} registro(s):\n` +
      lines.join('\n')
    );
  }

  private buildHeader({
    scopeLevel,
    workspaceCount,
    workspaceNames,
  }: {
    scopeLevel: string;
    workspaceCount: number;
    workspaceNames: string[];
  }): string {
    switch (scopeLevel) {
      case 'GLOBAL':
        return `[Administrador do servidor] Analisando ${workspaceCount} workspace(s) da instância.`;
      case 'AGENCY_SCOPED':
        return (
          `[Gestor de agência] Analisando ${workspaceCount} cliente(s) autorizado(s)` +
          (workspaceNames.length > 0 ? `: ${workspaceNames.join(', ')}.` : '.')
        );
      default:
        return `[Workspace individual] Analisando ${workspaceNames[0] ?? 'o workspace atual'}.`;
    }
  }

  private suggestAction(scopeLevel: string): string | undefined {
    switch (scopeLevel) {
      case 'GLOBAL':
        return '/settings/admin-panel';
      case 'AGENCY_SCOPED':
        return '/agency/meta-ads';
      default:
        return undefined;
    }
  }
}
