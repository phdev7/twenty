import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { render } from '@react-email/render';
import { WorkspaceApprovedEmail } from 'diex-emails';
import { AppPath } from 'diex-shared/types';
import { SOURCE_LOCALE } from 'diex-shared/translations';
import { isDefined } from 'diex-shared/utils';
import { In, IsNull, Repository } from 'typeorm';

import { type AuthContextUser } from 'src/engine/core-modules/auth/types/auth-context.type';
import { WorkspaceDomainsService } from 'src/engine/core-modules/domain/workspace-domains/services/workspace-domains.service';
import { EmailService } from 'src/engine/core-modules/email/email.service';
import { DiexConfigService } from 'src/engine/core-modules/diex-config/diex-config.service';
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
import { GlobalWorkspaceOrmManager } from 'src/engine/diex-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/diex-orm/utils/build-system-auth-context.util';
import { type DiexWorkspaceContextWorkspaceEntity } from 'src/modules/workspace-context/standard-objects/diex-workspace-context.workspace-entity';
import { WorkspaceContextStatus } from 'src/modules/workspace-context/standard-objects/diex-workspace-context.standard-object-definition';

@Injectable()
// The rule fires because this class injects WorkspaceService, but it is a core
// service over core tables, not a workspace-scoped one, so the demanded
// `.workspace-service.ts` name would misdescribe it. Same exemption the other
// core services that inject WorkspaceService already carry.
// oxlint-disable-next-line diex/inject-workspace-repository
export class WorkspaceApprovalService {
  private readonly logger = new Logger(WorkspaceApprovalService.name);

  constructor(
    private readonly workspaceApprovalGateService: WorkspaceApprovalGateService,
    private readonly workspaceService: WorkspaceService,
    private readonly workspaceDomainsService: WorkspaceDomainsService,
    private readonly emailService: EmailService,
    private readonly diexConfigService: DiexConfigService,
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
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
        whatsapp: workspace.onboardingWhatsapp,
        primaryChannel: workspace.onboardingPrimaryChannel,
        companyDescription: workspace.onboardingCompanyDescription,
        idealCustomerProfile: workspace.onboardingIdealCustomerProfile,
        toneOfVoice: workspace.onboardingToneOfVoice,
        primaryGoal: workspace.onboardingPrimaryGoal,
        companySize: workspace.onboardingCompanySize,
        currentProcess: workspace.onboardingCurrentProcess,
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

    const resolvedWorkspace = activatedWorkspace ?? workspace;
    const postApprovalResults = await Promise.allSettled([
      this.seedWorkspaceContext(resolvedWorkspace),
      this.sendApprovalEmail({ workspace: resolvedWorkspace, owner }),
    ]);

    for (const [index, result] of postApprovalResults.entries()) {
      if (result.status === 'rejected') {
        const operation = index === 0 ? 'seed AI context' : 'send email';

        this.logger.error(
          `Workspace ${workspaceId} was approved but failed to ${operation}`,
          result.reason instanceof Error
            ? result.reason.stack
            : String(result.reason),
        );
      }
    }

    return this.toResult(resolvedWorkspace);
  }

  private async seedWorkspaceContext(
    workspace: WorkspaceEntity,
  ): Promise<void> {
    const businessDescription = workspace.onboardingCompanyDescription?.trim();
    const idealCustomerProfile =
      workspace.onboardingIdealCustomerProfile?.trim();
    const toneOfVoice = workspace.onboardingToneOfVoice?.trim();

    if (!businessDescription || !idealCustomerProfile || !toneOfVoice) {
      return;
    }

    const commercialRules = [
      workspace.onboardingPrimaryGoal
        ? `Objetivo principal: ${workspace.onboardingPrimaryGoal.trim()}`
        : null,
      workspace.onboardingCompanySize
        ? `Tamanho da operação: ${workspace.onboardingCompanySize.trim()}`
        : null,
      workspace.onboardingCurrentProcess
        ? `Processo atual e gargalos: ${workspace.onboardingCurrentProcess.trim()}`
        : null,
    ]
      .filter(isDefined)
      .join('\n\n');
    const authContext = buildSystemAuthContext(workspace.id);

    await this.globalWorkspaceOrmManager.executeInWorkspaceContext(async () => {
      const repository =
        await this.globalWorkspaceOrmManager.getRepository<DiexWorkspaceContextWorkspaceEntity>(
          workspace.id,
          'diexWorkspaceContext',
          { shouldBypassPermissionChecks: true },
        );
      const [existingContext] = await repository.find({
        order: { createdAt: 'ASC' },
        take: 1,
      });

      if (isDefined(existingContext)) {
        return;
      }

      await repository.save(
        repository.create({
          name: 'Contexto inicial do cadastro',
          status: WorkspaceContextStatus.DRAFT,
          businessDescription: { markdown: businessDescription },
          idealCustomerProfile: { markdown: idealCustomerProfile },
          toneOfVoice: { markdown: toneOfVoice },
          commercialRules: commercialRules
            ? { markdown: commercialRules }
            : null,
          reviewedAt: null,
        }),
      );
    }, authContext);
  }

  private async sendApprovalEmail({
    workspace,
    owner,
  }: {
    workspace: WorkspaceEntity;
    owner: AuthContextUser;
  }): Promise<void> {
    const workspaceUrls =
      this.workspaceDomainsService.getWorkspaceUrls(workspace);
    const onboardingUrl = new URL(
      AppPath.DiexOnboarding,
      workspaceUrls.customUrl ?? workspaceUrls.subdomainUrl,
    ).toString();
    const workspaceName = workspace.displayName ?? workspace.subdomain;
    const emailTemplate = WorkspaceApprovedEmail({
      workspaceName,
      link: onboardingUrl,
      locale: owner.locale ?? SOURCE_LOCALE,
    });
    const html = await render(emailTemplate, { pretty: true });
    const text = await render(emailTemplate, { plainText: true });

    await this.emailService.send({
      from: `${this.diexConfigService.get('EMAIL_FROM_NAME')} <${this.diexConfigService.get('EMAIL_FROM_ADDRESS')}>`,
      to: owner.email,
      subject: `${workspaceName} foi aprovado no Diex CRM`,
      html,
      text,
    });
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
