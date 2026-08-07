import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, In } from 'typeorm';

import { UserWorkspaceEntity } from 'src/engine/core-modules/user-workspace/user-workspace.entity';
import { UserEntity } from 'src/engine/core-modules/user/user.entity';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';

export type AiScopeLevel = 'GLOBAL' | 'AGENCY_SCOPED' | 'SINGLE_WORKSPACE';

export interface AiUserScopeContext {
  userId: string;
  scopeLevel: AiScopeLevel;
  agencyId?: string | null;
  allowedWorkspaceIds: string[];
}

@Injectable()
export class DiexAiContextScopeService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
    @InjectRepository(UserWorkspaceEntity)
    private readonly userWorkspaceRepository: Repository<UserWorkspaceEntity>,
  ) {}

  async resolveUserScopeContext(
    userId: string,
    currentWorkspaceId?: string,
  ): Promise<AiUserScopeContext> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new ForbiddenException('Usuário não encontrado.');
    }

    if (user.canAccessFullAdminPanel) {
      const allWorkspaces = await this.workspaceRepository.find({ select: ['id'] });
      return {
        userId: user.id,
        scopeLevel: 'GLOBAL',
        agencyId: user.agencyId,
        allowedWorkspaceIds: allWorkspaces.map((w) => w.id),
      };
    }

    if (user.isAgencyManager && user.agencyId) {
      const agencyWorkspaces = await this.workspaceRepository.find({
        where: { managedByAgencyId: user.agencyId },
        select: ['id'],
      });

      const allowedIds = agencyWorkspaces.map((w) => w.id);

      // currentWorkspaceId arrives from the request, so it is only added once
      // the user is shown to be a member of it. Pushing it unconditionally
      // made the id authorise itself: enforceWorkspacePermission then checked
      // the target against a list that had just received the target, and any
      // workspace id supplied by the caller passed.
      if (
        currentWorkspaceId &&
        !allowedIds.includes(currentWorkspaceId) &&
        (await this.isUserMemberOfWorkspace(user.id, currentWorkspaceId))
      ) {
        allowedIds.push(currentWorkspaceId);
      }

      return {
        userId: user.id,
        scopeLevel: 'AGENCY_SCOPED',
        agencyId: user.agencyId,
        allowedWorkspaceIds: allowedIds,
      };
    }

    return {
      userId: user.id,
      scopeLevel: 'SINGLE_WORKSPACE',
      agencyId: null,
      allowedWorkspaceIds: currentWorkspaceId ? [currentWorkspaceId] : [],
    };
  }

  private async isUserMemberOfWorkspace(
    userId: string,
    workspaceId: string,
  ): Promise<boolean> {
    const membershipCount = await this.userWorkspaceRepository.count({
      where: { userId, workspaceId },
    });

    return membershipCount > 0;
  }

  enforceWorkspacePermission(
    context: AiUserScopeContext,
    targetWorkspaceId: string,
  ): void {
    if (!context.allowedWorkspaceIds.includes(targetWorkspaceId)) {
      throw new ForbiddenException(
        `RLS Security Block: O seu usuário não tem permissão para acessar os dados do workspace ${targetWorkspaceId}.`,
      );
    }
  }

  applyRlsToQueryBuilder<T extends object>(
    queryBuilder: SelectQueryBuilder<T>,
    context: AiUserScopeContext,
    workspaceColumn = 'workspaceId',
  ): SelectQueryBuilder<T> {
    if (context.scopeLevel === 'GLOBAL') {
      return queryBuilder;
    }

    if (context.allowedWorkspaceIds.length === 0) {
      return queryBuilder.andWhere('1=0');
    }

    return queryBuilder.andWhere(
      `${queryBuilder.alias}.${workspaceColumn} IN (:...allowedWorkspaceIds)`,
      { allowedWorkspaceIds: context.allowedWorkspaceIds },
    );
  }
}
