import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isDefined } from 'diex-shared/utils';
import { Repository } from 'typeorm';

import { DiexAgencyMetricDefinitionEntity } from 'src/engine/core-modules/diex-agency/entities/diex-agency-metric-definition.entity';
import {
  DiexAgencyMetricEntryEntity,
  MetricSourceType,
} from 'src/engine/core-modules/diex-agency/entities/diex-agency-metric-entry.entity';
import {
  DiexMetaAdsAccountEntity,
  MetaAdsStatus,
} from 'src/engine/core-modules/diex-agency/entities/diex-meta-ads-account.entity';
import { CreateMetricDefinitionInput } from 'src/engine/core-modules/diex-agency/dtos/create-metric-definition.input';
import { CreateMetricEntryInput } from 'src/engine/core-modules/diex-agency/dtos/create-metric-entry.input';
import { ConnectMetaAdsAccountInput } from 'src/engine/core-modules/diex-agency/dtos/connect-meta-ads-account.input';
import { DiexTrafficSummaryMetricsDTO } from 'src/engine/core-modules/diex-agency/dtos/traffic-summary-metrics.dto';
import { type PlaintextString } from 'src/engine/core-modules/secret-encryption/branded-strings/plaintext-string.type';
import { SecretEncryptionService } from 'src/engine/core-modules/secret-encryption/secret-encryption.service';

// The codes the traffic summary derives CPL, ROAS, CAC and LTV from. A metric
// definition only reaches the summary by carrying one of these codes.
const SUMMARY_METRIC_CODES = {
  SPEND: 'spend',
  REVENUE: 'revenue',
  LEADS: 'leads',
  CUSTOMERS: 'customers',
} as const;

@Injectable()
export class DiexAgencyTrafficService {
  constructor(
    // Agency-owned core tables: rows are scoped by agencyId, not workspaceId,
    // so the workspace-scoped repository would have no tenant column to guard on
    // eslint-disable-next-line diex/prefer-workspace-scoped-repository
    @InjectRepository(DiexAgencyMetricDefinitionEntity)
    private readonly metricDefRepository: Repository<DiexAgencyMetricDefinitionEntity>,
    // eslint-disable-next-line diex/prefer-workspace-scoped-repository
    @InjectRepository(DiexAgencyMetricEntryEntity)
    private readonly metricEntryRepository: Repository<DiexAgencyMetricEntryEntity>,
    // eslint-disable-next-line diex/prefer-workspace-scoped-repository
    @InjectRepository(DiexMetaAdsAccountEntity)
    private readonly metaAdsRepository: Repository<DiexMetaAdsAccountEntity>,
    private readonly secretEncryptionService: SecretEncryptionService,
  ) {}

  async createMetricDefinition(
    agencyId: string,
    input: CreateMetricDefinitionInput,
  ): Promise<DiexAgencyMetricDefinitionEntity> {
    const existing = await this.metricDefRepository.findOne({
      where: { agencyId, code: input.code.toLowerCase() },
    });

    if (existing) {
      throw new BadRequestException(
        `Já existe uma métrica com o código "${input.code}".`,
      );
    }

    const definition = this.metricDefRepository.create({
      agencyId,
      name: input.name,
      code: input.code.toLowerCase(),
      unitType: input.unitType,
      currencyCode: input.currencyCode ?? 'BRL',
      targetComparison: input.targetComparison,
      description: input.description,
      isVisibleToClient: input.isVisibleToClient ?? true,
    });

    return await this.metricDefRepository.save(definition);
  }

  async listMetricDefinitions(
    agencyId: string,
  ): Promise<DiexAgencyMetricDefinitionEntity[]> {
    return await this.metricDefRepository.find({
      where: { agencyId },
      order: { name: 'ASC' },
    });
  }

  async getMetricDefinitionOrThrow(
    metricDefinitionId: string,
  ): Promise<DiexAgencyMetricDefinitionEntity> {
    const definition = await this.metricDefRepository.findOne({
      where: { id: metricDefinitionId },
    });

    if (!definition) {
      throw new NotFoundException('Definição de métrica não encontrada.');
    }

    return definition;
  }

  async createMetricEntry(
    input: CreateMetricEntryInput,
  ): Promise<DiexAgencyMetricEntryEntity> {
    await this.getMetricDefinitionOrThrow(input.metricDefinitionId);

    const entry = this.metricEntryRepository.create({
      metricDefinitionId: input.metricDefinitionId,
      clientWorkspaceId: input.clientWorkspaceId,
      periodStart: new Date(input.periodStart),
      periodEnd: new Date(input.periodEnd),
      value: input.value,
      source: input.source ?? MetricSourceType.MANUAL,
      notes: input.notes,
    });

    return await this.metricEntryRepository.save(entry);
  }

  async listMetricEntriesForClient(
    clientWorkspaceId: string,
    onlyClientVisible = false,
  ): Promise<DiexAgencyMetricEntryEntity[]> {
    const query = this.metricEntryRepository
      .createQueryBuilder('entry')
      .innerJoinAndSelect('entry.metricDefinition', 'def')
      .where('entry.clientWorkspaceId = :clientWorkspaceId', {
        clientWorkspaceId,
      });

    if (onlyClientVisible) {
      query.andWhere('def.isVisibleToClient = true');
    }

    return await query.orderBy('entry.periodEnd', 'DESC').getMany();
  }

  async connectMetaAdsAccount(
    agencyId: string,
    input: ConnectMetaAdsAccountInput,
  ): Promise<DiexMetaAdsAccountEntity> {
    return await this.upsertMetaAdsAccount({
      agencyId,
      adAccountId: input.adAccountId,
      accountName: input.accountName,
      accessToken: input.accessToken,
      clientWorkspaceId: input.clientWorkspaceId,
    });
  }

  // Reconnecting an ad account refreshes the row it already has. Inserting
  // unconditionally left the agency with one row per authorisation, all but the
  // last holding a token that no longer works, and every one of them counted by
  // activeMetaAdsAccounts.
  async upsertMetaAdsAccount({
    agencyId,
    adAccountId,
    accountName,
    accessToken,
    tokenExpiresAt,
    clientWorkspaceId,
  }: {
    agencyId: string;
    adAccountId: string;
    accountName: string;
    accessToken: string;
    tokenExpiresAt?: Date;
    clientWorkspaceId?: string;
  }): Promise<DiexMetaAdsAccountEntity> {
    const encryptedAccessToken = this.secretEncryptionService.encryptVersioned(
      accessToken as PlaintextString,
    );

    const existingAccount = await this.metaAdsRepository.findOne({
      where: { agencyId, adAccountId },
    });

    if (existingAccount) {
      existingAccount.accountName = accountName;
      existingAccount.accessToken = encryptedAccessToken;
      existingAccount.tokenExpiresAt = tokenExpiresAt;
      existingAccount.status = MetaAdsStatus.CONNECTED;

      if (isDefined(clientWorkspaceId)) {
        existingAccount.clientWorkspaceId = clientWorkspaceId;
      }

      return await this.metaAdsRepository.save(existingAccount);
    }

    const account = this.metaAdsRepository.create({
      agencyId,
      adAccountId,
      accountName,
      accessToken: encryptedAccessToken,
      tokenExpiresAt,
      clientWorkspaceId,
      status: MetaAdsStatus.CONNECTED,
    });

    return await this.metaAdsRepository.save(account);
  }

  // Sole entry point for the Meta API sync; keeps the ciphertext from leaking
  // into callers that would otherwise read the column directly
  getDecryptedAccessTokenOrThrow(
    account: DiexMetaAdsAccountEntity,
  ): PlaintextString {
    return this.secretEncryptionService.decryptVersionedOrThrow(
      account.accessToken,
    );
  }

  async listMetaAdsAccounts(
    agencyId: string,
  ): Promise<DiexMetaAdsAccountEntity[]> {
    return await this.metaAdsRepository.find({
      where: { agencyId },
      order: { createdAt: 'DESC' },
    });
  }

  async getTrafficSummaryMetrics(
    agencyId: string,
  ): Promise<DiexTrafficSummaryMetricsDTO> {
    const metaAccounts = await this.metaAdsRepository.find({
      where: { agencyId, status: MetaAdsStatus.CONNECTED },
    });

    const entries = await this.metricEntryRepository
      .createQueryBuilder('entry')
      .innerJoinAndSelect('entry.metricDefinition', 'def')
      .where('def.agencyId = :agencyId', { agencyId })
      .getMany();

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const currentPeriodEntries = entries.filter(
      (e) => new Date(e.periodEnd) >= thirtyDaysAgo,
    );
    const previousPeriodEntries = entries.filter(
      (e) =>
        new Date(e.periodEnd) >= sixtyDaysAgo &&
        new Date(e.periodEnd) < thirtyDaysAgo,
    );

    // Matching on the code alone. The previous version also accepted any
    // definition whose *name* contained the code, so a definition named "Total
    // de leads qualificados" was added to the `leads` total on top of its own
    // code, and one agency's naming choice silently changed another metric.
    const calculateTotalByCode = (
      list: DiexAgencyMetricEntryEntity[],
      code: string,
    ) => {
      return list
        .filter((entry) => entry.metricDefinition?.code === code)
        .reduce((acc, curr) => acc + Number(curr.value), 0);
    };

    // Calculate Current Period
    const currentSpend = calculateTotalByCode(
      currentPeriodEntries,
      SUMMARY_METRIC_CODES.SPEND,
    );
    const currentRevenue = calculateTotalByCode(
      currentPeriodEntries,
      SUMMARY_METRIC_CODES.REVENUE,
    );
    const currentLeads = calculateTotalByCode(
      currentPeriodEntries,
      SUMMARY_METRIC_CODES.LEADS,
    );
    const currentCustomers = calculateTotalByCode(
      currentPeriodEntries,
      SUMMARY_METRIC_CODES.CUSTOMERS,
    );

    // Calculate Previous Period (MoM)
    const previousSpend = calculateTotalByCode(
      previousPeriodEntries,
      SUMMARY_METRIC_CODES.SPEND,
    );
    const previousRevenue = calculateTotalByCode(
      previousPeriodEntries,
      SUMMARY_METRIC_CODES.REVENUE,
    );
    const previousLeads = calculateTotalByCode(
      previousPeriodEntries,
      SUMMARY_METRIC_CODES.LEADS,
    );
    const previousCustomers = calculateTotalByCode(
      previousPeriodEntries,
      SUMMARY_METRIC_CODES.CUSTOMERS,
    );

    // Advanced Metrics
    const currentCpl = currentLeads > 0 ? currentSpend / currentLeads : 0;
    const previousCpl = previousLeads > 0 ? previousSpend / previousLeads : 0;

    const currentRoas = currentSpend > 0 ? currentRevenue / currentSpend : 0;
    const previousRoas =
      previousSpend > 0 ? previousRevenue / previousSpend : 0;

    const currentCac =
      currentCustomers > 0 ? currentSpend / currentCustomers : 0;
    const previousCac =
      previousCustomers > 0 ? previousSpend / previousCustomers : 0;

    // LTV Estimation based on average ticket (Revenue / Customers) over 12 months average lifetime
    const currentLtv =
      currentCustomers > 0 ? (currentRevenue / currentCustomers) * 12 : 0;
    const previousLtv =
      previousCustomers > 0 ? (previousRevenue / previousCustomers) * 12 : 0;

    const calculateDelta = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Number((((current - previous) / previous) * 100).toFixed(1));
    };

    let anomaliesCount = 0;
    if (currentCpl > 0 && previousCpl > 0 && currentCpl > previousCpl * 1.3)
      anomaliesCount += 1;
    if (currentCac > 0 && previousCac > 0 && currentCac > previousCac * 1.3)
      anomaliesCount += 1;
    if (currentRoas > 0 && currentRoas < 1.5 && currentSpend > 1000)
      anomaliesCount += 1;

    // Every number below is measured or absent. The previous version fell back
    // to a fixed demonstration set (R$ 12.450 spend, 342 leads, 2,85 ROAS, 3
    // connected accounts) whenever the period was empty, which is exactly the
    // state a new agency is in — so the first thing it could forward to a
    // client was a report the platform had invented.
    return {
      hasData:
        currentPeriodEntries.length > 0 || previousPeriodEntries.length > 0,
      totalSpend: currentSpend,
      spendChangePercentage: calculateDelta(currentSpend, previousSpend),
      totalLeads: currentLeads,
      leadsChangePercentage: calculateDelta(currentLeads, previousLeads),
      averageCpl: currentCpl,
      cplChangePercentage: calculateDelta(currentCpl, previousCpl),
      averageRoas: currentRoas,
      roasChangePercentage: calculateDelta(currentRoas, previousRoas),
      activeMetaAdsAccounts: metaAccounts.length,
      anomaliesCount,
      advancedMetrics: {
        currentCac,
        cacChangePercentage: calculateDelta(currentCac, previousCac),
        currentLtv,
        ltvChangePercentage: calculateDelta(currentLtv, previousLtv),
      },
    };
  }
}
