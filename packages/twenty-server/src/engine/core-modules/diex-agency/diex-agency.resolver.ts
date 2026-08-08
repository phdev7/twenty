import {
  ForbiddenException,
  UseFilters,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { MetadataResolver } from 'src/engine/api/graphql/graphql-config/decorators/metadata-resolver.decorator';
import { type AuthContextUser } from 'src/engine/core-modules/auth/types/auth-context.type';
import { DiexAgencyEntity } from 'src/engine/core-modules/diex-agency/diex-agency.entity';
import { DiexAgencyService } from 'src/engine/core-modules/diex-agency/services/diex-agency.service';
import { CreateAgencyInput } from 'src/engine/core-modules/diex-agency/dtos/create-agency.input';
import { UpdateAgencySlotsInput } from 'src/engine/core-modules/diex-agency/dtos/update-agency-slots.input';
import { CreateAgencyWorkspaceInput } from 'src/engine/core-modules/diex-agency/dtos/create-agency-workspace.input';
import { DiexAgencyMetricsDTO } from 'src/engine/core-modules/diex-agency/dtos/agency-metrics.dto';
import { PreventNestToAutoLogGraphqlErrorsFilter } from 'src/engine/core-modules/graphql/filters/prevent-nest-to-auto-log-graphql-errors.filter';
import { ResolverValidationPipe } from 'src/engine/core-modules/graphql/pipes/resolver-validation.pipe';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthUser } from 'src/engine/decorators/auth/auth-user.decorator';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { UserAuthGuard } from 'src/engine/guards/user-auth.guard';
import { PermissionsGraphqlApiExceptionFilter } from 'src/engine/metadata-modules/permissions/utils/permissions-graphql-api-exception.filter';

// Agency membership is not a workspace permission flag, so each resolver
// resolves the caller's agency through DiexAgencyService instead of relying on
// a settings guard.
@Resolver(() => DiexAgencyEntity)
@MetadataResolver()
@UsePipes(ResolverValidationPipe)
@UseFilters(
  PermissionsGraphqlApiExceptionFilter,
  PreventNestToAutoLogGraphqlErrorsFilter,
)
@UseGuards(UserAuthGuard, NoPermissionGuard)
export class DiexAgencyResolver {
  constructor(private readonly diexAgencyService: DiexAgencyService) {}

  @Query(() => [DiexAgencyEntity])
  async diexAgencies(
    @AuthUser() user: AuthContextUser,
  ): Promise<DiexAgencyEntity[]> {
    if (!user.canAccessFullAdminPanel) {
      throw new ForbiddenException(
        'Apenas Administradores do sistema podem listar todas as agências.',
      );
    }
    return await this.diexAgencyService.listAllAgencies();
  }

  @Query(() => DiexAgencyEntity, { nullable: true })
  async myDiexAgency(
    @AuthUser() user: AuthContextUser,
  ): Promise<DiexAgencyEntity | null> {
    return await this.diexAgencyService.getAgencyByUserId(user.id);
  }

  @Query(() => [WorkspaceEntity])
  async diexAgencyManagedWorkspaces(
    @AuthUser() user: AuthContextUser,
    @Args('agencyId', { nullable: true }) agencyId?: string,
  ): Promise<WorkspaceEntity[]> {
    const targetAgencyId =
      await this.diexAgencyService.resolveAgencyIdForCallerOrThrow(
        user,
        agencyId,
      );

    return await this.diexAgencyService.listAgencyManagedWorkspaces(
      targetAgencyId,
    );
  }

  @Query(() => DiexAgencyMetricsDTO)
  async diexAgencyMetrics(
    @AuthUser() user: AuthContextUser,
  ): Promise<DiexAgencyMetricsDTO> {
    if (!user.canAccessFullAdminPanel) {
      throw new ForbiddenException(
        'Apenas Administradores têm acesso às métricas globais de agências.',
      );
    }
    return await this.diexAgencyService.getMetrics();
  }

  @Mutation(() => DiexAgencyEntity)
  async createDiexAgency(
    @Args('input') input: CreateAgencyInput,
    @AuthUser() user: AuthContextUser,
  ): Promise<DiexAgencyEntity> {
    if (!user.canAccessFullAdminPanel) {
      throw new ForbiddenException(
        'Apenas Administradores podem cadastrar novas agências parceiras.',
      );
    }
    return await this.diexAgencyService.createAgency(input);
  }

  @Mutation(() => DiexAgencyEntity)
  async updateDiexAgencySlots(
    @Args('input') input: UpdateAgencySlotsInput,
    @AuthUser() user: AuthContextUser,
  ): Promise<DiexAgencyEntity> {
    if (!user.canAccessFullAdminPanel) {
      throw new ForbiddenException(
        'Apenas Administradores podem alterar limites de slots de agências.',
      );
    }
    return await this.diexAgencyService.updateAgencySlots(input);
  }

  @Mutation(() => WorkspaceEntity)
  async createDiexAgencyWorkspace(
    @Args('input') input: CreateAgencyWorkspaceInput,
    @AuthUser() user: AuthContextUser,
  ): Promise<WorkspaceEntity> {
    // An admin without an agency of their own must name the target agency.
    // Falling back to the first row of listAllAgencies attached the client to
    // whichever agency happened to sort first, silently and irreversibly.
    const agencyId =
      await this.diexAgencyService.resolveAgencyIdForCallerOrThrow(
        user,
        input.agencyId,
      );

    return await this.diexAgencyService.createAgencyWorkspace(agencyId, input);
  }
}
