import { UseFilters, UseGuards, UsePipes } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { MetadataResolver } from 'src/engine/api/graphql/graphql-config/decorators/metadata-resolver.decorator';
import { type AuthContextUser } from 'src/engine/core-modules/auth/types/auth-context.type';
import { DiexAgencyMetricDefinitionEntity } from 'src/engine/core-modules/diex-agency/entities/diex-agency-metric-definition.entity';
import { DiexAgencyMetricEntryEntity } from 'src/engine/core-modules/diex-agency/entities/diex-agency-metric-entry.entity';
import { DiexMetaAdsAccountEntity } from 'src/engine/core-modules/diex-agency/entities/diex-meta-ads-account.entity';
import { DiexAgencyTrafficService } from 'src/engine/core-modules/diex-agency/services/diex-agency-traffic.service';
import { DiexAgencyService } from 'src/engine/core-modules/diex-agency/services/diex-agency.service';
import { CreateMetricDefinitionInput } from 'src/engine/core-modules/diex-agency/dtos/create-metric-definition.input';
import { CreateMetricEntryInput } from 'src/engine/core-modules/diex-agency/dtos/create-metric-entry.input';
import { ConnectMetaAdsAccountInput } from 'src/engine/core-modules/diex-agency/dtos/connect-meta-ads-account.input';
import { DiexTrafficSummaryMetricsDTO } from 'src/engine/core-modules/diex-agency/dtos/traffic-summary-metrics.dto';
import { PreventNestToAutoLogGraphqlErrorsFilter } from 'src/engine/core-modules/graphql/filters/prevent-nest-to-auto-log-graphql-errors.filter';
import { ResolverValidationPipe } from 'src/engine/core-modules/graphql/pipes/resolver-validation.pipe';
import { AuthUser } from 'src/engine/decorators/auth/auth-user.decorator';
import { UserAuthGuard } from 'src/engine/guards/user-auth.guard';
import { PermissionsGraphqlApiExceptionFilter } from 'src/engine/metadata-modules/permissions/utils/permissions-graphql-api-exception.filter';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

@Resolver()
@MetadataResolver()
@UsePipes(ResolverValidationPipe)
@UseFilters(
  PermissionsGraphqlApiExceptionFilter,
  PreventNestToAutoLogGraphqlErrorsFilter,
)
@UseGuards(UserAuthGuard)
export class DiexAgencyTrafficResolver {
  constructor(
    private readonly trafficService: DiexAgencyTrafficService,
    private readonly agencyService: DiexAgencyService,
  ) {}

  @Query(() => [DiexAgencyMetricDefinitionEntity])
  async diexMetricDefinitions(@AuthUser() user: AuthContextUser): Promise<DiexAgencyMetricDefinitionEntity[]> {
    const agency = await this.agencyService.getAgencyByUserId(user.id);
    if (!agency && !user.canAccessFullAdminPanel) {
      throw new ForbiddenException('Acesso restrito a agências parceiras.');
    }
    const targetAgencyId = agency ? agency.id : (await this.agencyService.listAllAgencies())[0]?.id;
    if (!targetAgencyId) return [];

    return await this.trafficService.listMetricDefinitions(targetAgencyId);
  }

  @Query(() => [DiexAgencyMetricEntryEntity])
  async diexClientMetricEntries(
    @Args('clientWorkspaceId') clientWorkspaceId: string,
    @Args('onlyClientVisible', { nullable: true, defaultValue: false }) onlyClientVisible?: boolean,
  ): Promise<DiexAgencyMetricEntryEntity[]> {
    return await this.trafficService.listMetricEntriesForClient(clientWorkspaceId, onlyClientVisible);
  }

  @Query(() => DiexTrafficSummaryMetricsDTO)
  async diexTrafficSummary(@AuthUser() user: AuthContextUser): Promise<DiexTrafficSummaryMetricsDTO> {
    const agency = await this.agencyService.getAgencyByUserId(user.id);
    const targetAgencyId = agency ? agency.id : (await this.agencyService.listAllAgencies())[0]?.id;
    if (!targetAgencyId) {
      // An agency with no data still has to satisfy the full DTO: a partial
      // object would fail GraphQL serialisation at runtime rather than here.
      return {
        totalSpend: 0,
        spendChangePercentage: 0,
        totalLeads: 0,
        leadsChangePercentage: 0,
        averageCpl: 0,
        cplChangePercentage: 0,
        averageRoas: 0,
        roasChangePercentage: 0,
        activeMetaAdsAccounts: 0,
        anomaliesCount: 0,
      };
    }
    return await this.trafficService.getTrafficSummaryMetrics(targetAgencyId);
  }

  @Query(() => [DiexMetaAdsAccountEntity])
  async diexMetaAdsAccounts(@AuthUser() user: AuthContextUser): Promise<DiexMetaAdsAccountEntity[]> {
    const agency = await this.agencyService.getAgencyByUserId(user.id);
    const targetAgencyId = agency ? agency.id : (await this.agencyService.listAllAgencies())[0]?.id;
    if (!targetAgencyId) return [];

    return await this.trafficService.listMetaAdsAccounts(targetAgencyId);
  }

  @Mutation(() => DiexAgencyMetricDefinitionEntity)
  async createDiexMetricDefinition(
    @Args('input') input: CreateMetricDefinitionInput,
    @AuthUser() user: AuthContextUser,
  ): Promise<DiexAgencyMetricDefinitionEntity> {
    const agency = await this.agencyService.getAgencyByUserId(user.id);
    if (!agency && !user.canAccessFullAdminPanel) {
      throw new ForbiddenException('Apenas gestores de agências podem criar definições de métricas.');
    }
    const targetAgencyId = agency ? agency.id : (await this.agencyService.listAllAgencies())[0]?.id;
    if (!targetAgencyId) {
      throw new NotFoundException('Nenhuma agência válida encontrada.');
    }

    return await this.trafficService.createMetricDefinition(targetAgencyId, input);
  }

  @Mutation(() => DiexAgencyMetricEntryEntity)
  async createDiexMetricEntry(
    @Args('input') input: CreateMetricEntryInput,
  ): Promise<DiexAgencyMetricEntryEntity> {
    return await this.trafficService.createMetricEntry(input);
  }

  @Mutation(() => DiexMetaAdsAccountEntity)
  async connectDiexMetaAdsAccount(
    @Args('input') input: ConnectMetaAdsAccountInput,
    @AuthUser() user: AuthContextUser,
  ): Promise<DiexMetaAdsAccountEntity> {
    const agency = await this.agencyService.getAgencyByUserId(user.id);
    if (!agency && !user.canAccessFullAdminPanel) {
      throw new ForbiddenException('Apenas agências podem conectar contas do Meta Ads.');
    }
    const targetAgencyId = agency ? agency.id : (await this.agencyService.listAllAgencies())[0]?.id;
    if (!targetAgencyId) {
      throw new NotFoundException('Agência não encontrada.');
    }

    return await this.trafficService.connectMetaAdsAccount(targetAgencyId, input);
  }
}
