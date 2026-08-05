import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { isDefined } from 'twenty-shared/utils';
import { In, IsNull, Repository } from 'typeorm';

import { type AuthContextUser } from 'src/engine/core-modules/auth/types/auth-context.type';
import { UserWorkspaceEntity } from 'src/engine/core-modules/user-workspace/user-workspace.entity';
import { UserEntity } from 'src/engine/core-modules/user/user.entity';
import { WorkspaceService } from 'src/engine/core-modules/workspace/services/workspace.service';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import {
  type ApprovalGateUser,
  UNACTIVATED_WORKSPACE_STATUSES,
  WorkspaceApprovalGateService,
} from 'src/engine/core-modules/workspace-approval/services/workspace-approval-gate.service';
import {
  type PendingWorkspaceApproval,
  type WorkspaceApprovalResult,
} from 'src/engine/core-modules/workspace-approval/types/workspace-approval.types';

@Injectable()
// The rule fires because this class injects WorkspaceService, but it is a core
// service over core tables, not a workspace-scoped one, so the demanded
// `.workspace-service.ts` name would misdescribe it. Same exemption the other
// core services that inject WorkspaceService already carry.
// oxlint-disable-next-line twenty/inject-workspace-repository
export class WorkspaceApprovalService {
  private readonly logger = new Logger(WorkspaceApprovalService.name);

  constructor(
    private readonly workspaceApprovalGateService: WorkspaceApprovalGateService,
    private readonly workspaceService: WorkspaceService,
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(UserWorkspaceEntity)
    private readonly userWorkspaceRepository: Repository<UserWorkspaceEntity>,
  ) {}

  isApprovalRequired(): boolean {
    return this.workspaceApprovalGateService.isApprovalRequired();
  }

  async listPendingApprovals(): Promise<PendingWorkspaceApproval[]> {
    const workspaces = await this.workspaceRepository.find({
      where: {
        activationStatus: In(UNACTIVATED_WORKSPACE_STATUSES),
        deletedAt: IsNull(),
      },
      order: { createdAt: 'ASC' },
    });

    if (workspaces.length === 0) {
      return [];
    }

    const userWorkspaces = await this.userWorkspaceRepository.find({
      where: { workspaceId: In(workspaces.map((workspace) => workspace.id)) },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });

    return workspaces.map((workspace) => {
      const members = userWorkspaces.filter(
        (userWorkspace) => userWorkspace.workspaceId === workspace.id,
      );
      const requester = members[0]?.user;

      return {
        workspaceId: workspace.id,
        displayName: workspace.displayName ?? null,
        subdomain: workspace.subdomain,
        createdAt: workspace.createdAt,
        requesterEmail: requester?.email ?? null,
        requesterName: isDefined(requester)
          ? `${requester.firstName ?? ''} ${requester.lastName ?? ''}`.trim() ||
            null
          : null,
        memberCount: members.length,
      };
    });
  }

  async approveWorkspace({
    workspaceId,
    approver,
  }: {
    workspaceId: string;
    approver: ApprovalGateUser;
  }): Promise<WorkspaceApprovalResult> {
    if (!this.workspaceApprovalGateService.isServerAdmin(approver)) {
      throw new ForbiddenException(
        'Only server admins can approve a workspace.',
      );
    }

    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId, deletedAt: IsNull() },
    });

    if (!isDefined(workspace)) {
      throw new NotFoundException(`Workspace ${workspaceId} not found.`);
    }

    // Approving an already activated workspace is a no-op rather than an error:
    // a retried approval must not look like a failure to the caller.
    if (!UNACTIVATED_WORKSPACE_STATUSES.includes(workspace.activationStatus)) {
      return this.toResult(workspace);
    }

    const owner = await this.findWorkspaceOwner(workspaceId);

    if (!isDefined(owner)) {
      throw new NotFoundException(
        `Workspace ${workspaceId} has no member to activate it for.`,
      );
    }

    const activatedWorkspace = await this.workspaceService.activateWorkspace(
      owner,
      workspace,
      { bypassApprovalGate: true },
    );

    this.logger.log(
      `Workspace ${workspaceId} approved by user ${approver.id ?? 'unknown'}`,
    );

    return this.toResult(activatedWorkspace ?? workspace);
  }

  // Activation is performed on behalf of the workspace owner, not the approving
  // admin, so the resulting workspace member and its records belong to the person
  // who signed up. The entity is mapped onto the auth-context shape because
  // activateWorkspace expects the flattened user, whose date fields are strings.
  private async findWorkspaceOwner(
    workspaceId: string,
  ): Promise<AuthContextUser | null> {
    const [oldestUserWorkspace] = await this.userWorkspaceRepository.find({
      where: { workspaceId },
      order: { createdAt: 'ASC' },
      take: 1,
    });

    if (!isDefined(oldestUserWorkspace)) {
      return null;
    }

    const user = await this.userRepository.findOne({
      where: { id: oldestUserWorkspace.userId },
    });

    if (!isDefined(user)) {
      return null;
    }

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      isEmailVerified: user.isEmailVerified,
      disabled: user.disabled,
      canImpersonate: user.canImpersonate,
      canAccessFullAdminPanel: user.canAccessFullAdminPanel,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      deletedAt: user.deletedAt?.toISOString(),
      locale: user.locale,
    } as AuthContextUser;
  }

  private toResult(workspace: WorkspaceEntity): WorkspaceApprovalResult {
    return {
      workspaceId: workspace.id,
      subdomain: workspace.subdomain,
      displayName: workspace.displayName ?? null,
      activationStatus: workspace.activationStatus,
    };
  }
}
