import { UseFilters, UseGuards, UsePipes } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { MetadataResolver } from 'src/engine/api/graphql/graphql-config/decorators/metadata-resolver.decorator';
import { type AuthContextUser } from 'src/engine/core-modules/auth/types/auth-context.type';
import { ConnectMetaAdsAccountInput } from 'src/engine/core-modules/diex-agency/dtos/connect-meta-ads-account.input';
import { CreateMetricDefinitionInput } from 'src/engine/core-modules/diex-agency/dtos/create-metric-definition.input';
import { CreateMetricEntryInput } from 'src/engine/core-modules/diex-agency/dtos/create-metric-entry.input';
import { DiexTrafficSummaryMetricsDTO } from 'src/engine/core-modules/diex-agency/dtos/traffic-summary-metrics.dto';
import { DiexAgencyMetricDefinitionEntity } from 'src/engine/core-modules/diex-agency/entities/diex-agency-metric-definition.entity';
import { DiexAgencyMetricEntryEntity } from 'src/engine/core-modules/diex-agency/entities/diex-agency-metric-entry.entity';
import { DiexMetaAdsAccountEntity } from 'src/engine/core-modules/diex-agency/entities/diex-meta-ads-account.entity';
import { DiexAgencyTrafficService } from 'src/engine/core-modules/diex-agency/services/diex-agency-traffic.service';
import { DiexAgencyService } from 'src/engine/core-modules/diex-agency/services/diex-agency.service';
import { PreventNestToAutoLogGraphqlErrorsFilter } from 'src/engine/core-modules/graphql/filters/prevent-nest-to-auto-log-graphql-errors.filter';
import { ResolverValidationPipe } from 'src/engine/core-modules/graphql/pipes/resolver-validation.pipe';
import { AuthUser } from 'src/engine/decorators/auth/auth-user.decorator';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { UserAuthGuard } from 'src/engine/guards/user-auth.guard';
import { PermissionsGraphqlApiExceptionFilter } from 'src/engine/metadata-modules/permissions/utils/permissions-graphql-api-exception.filter';

// Agency membership is not a workspace permission flag, so authorisation is
// resolved per call against DiexAgencyService rather than by a settings guard.
// Every resolver below therefore starts by resolving the caller's agency, and
// none of them accepts an agency or client id without checking it first.
@Resolver()
@MetadataResolver()
@UsePipes(ResolverValidationPipe)
@UseFilters(
  PermissionsGraphqlApiExceptionFilter,
  PreventNestToAutoLogGraphqlErrorsFilter,
)
@UseGuards(UserAuthGuard, NoPermissionGuard)
export class DiexAgencyTrafficResolver {
  constructor(
    private readonly trafficService: DiexAgencyTrafficService,
    private readonly agencyService: DiexAgencyService,
  ) {}

  @Query(() => [DiexAgencyMetricDefinitionEntity])
  async diexMetricDefinitions(
    @AuthUser() user: AuthContextUser,
    @Args('agencyId', { nullable: true }) agencyId?: string,
  ): Promise<DiexAgencyMetricDefinitionEntity[]> {
    const targetAgencyId =
      await this.agencyService.resolveAgencyIdForCallerOrThrow(user, agencyId);

    return await this.trafficService.listMetricDefinitions(targetAgencyId);
  }

  @Query(() => [DiexAgencyMetricEntryEntity])
  async diexClientMetricEntries(
    @AuthUser() user: AuthContextUser,
    @Args('clientWorkspaceId') clientWorkspaceId: string,
    @Args('onlyClientVisible', { nullable: true, defaultValue: false })
    onlyClientVisible?: boolean,
  ): Promise<DiexAgencyMetricEntryEntity[]> {
    await this.agencyService.assertCallerCanAccessClientWorkspaceOrThrow(
      user,
      clientWorkspaceId,
    );

    return await this.trafficService.listMetricEntriesForClient(
      clientWorkspaceId,
      onlyClientVisible,
    );
  }

  @Query(() => DiexTrafficSummaryMetricsDTO)
  async diexTrafficSummary(
    @AuthUser() user: AuthContextUser,
    @Args('agencyId', { nullable: true }) agencyId?: string,
  ): Promise<DiexTrafficSummaryMetricsDTO> {
    const targetAgencyId =
      await this.agencyService.resolveAgencyIdForCallerOrThrow(user, agencyId);

    return await this.trafficService.getTrafficSummaryMetrics(targetAgencyId);
  }

  @Query(() => [DiexMetaAdsAccountEntity])
  async diexMetaAdsAccounts(
    @AuthUser() user: AuthContextUser,
    @Args('agencyId', { nullable: true }) agencyId?: string,
  ): Promise<DiexMetaAdsAccountEntity[]> {
    const targetAgencyId =
      await this.agencyService.resolveAgencyIdForCallerOrThrow(user, agencyId);

    return await this.trafficService.listMetaAdsAccounts(targetAgencyId);
  }

  @Mutation(() => DiexAgencyMetricDefinitionEntity)
  async createDiexMetricDefinition(
    @Args('input') input: CreateMetricDefinitionInput,
    @AuthUser() user: AuthContextUser,
  ): Promise<DiexAgencyMetricDefinitionEntity> {
    const targetAgencyId =
      await this.agencyService.resolveAgencyIdForCallerOrThrow(
        user,
        input.agencyId,
      );

    return await this.trafficService.createMetricDefinition(
      targetAgencyId,
      input,
    );
  }

  @Mutation(() => DiexAgencyMetricEntryEntity)
  async createDiexMetricEntry(
    @Args('input') input: CreateMetricEntryInput,
    @AuthUser() user: AuthContextUser,
  ): Promise<DiexAgencyMetricEntryEntity> {
    const definition = await this.trafficService.getMetricDefinitionOrThrow(
      input.metricDefinitionId,
    );

    await this.agencyService.assertCallerCanActOnAgencyOrThrow(
      user,
      definition.agencyId,
    );
    await this.agencyService.assertCallerCanAccessClientWorkspaceOrThrow(
      user,
      input.clientWorkspaceId,
    );

    return await this.trafficService.createMetricEntry(input);
  }

  @Mutation(() => DiexMetaAdsAccountEntity)
  async connectDiexMetaAdsAccount(
    @Args('input') input: ConnectMetaAdsAccountInput,
    @AuthUser() user: AuthContextUser,
  ): Promise<DiexMetaAdsAccountEntity> {
    const targetAgencyId =
      await this.agencyService.resolveAgencyIdForCallerOrThrow(
        user,
        input.agencyId,
      );

    if (input.clientWorkspaceId) {
      await this.agencyService.assertCallerCanAccessClientWorkspaceOrThrow(
        user,
        input.clientWorkspaceId,
      );
    }

    return await this.trafficService.connectMetaAdsAccount(
      targetAgencyId,
      input,
    );
  }
}
