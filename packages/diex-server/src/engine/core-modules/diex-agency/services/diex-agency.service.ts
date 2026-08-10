import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isNonEmptyString } from '@sniptt/guards';
import { isDefined } from 'diex-shared/utils';
import { IsNull, Not, Repository } from 'typeorm';

export type AgencyCaller = {
  id: string;
  canAccessFullAdminPanel?: boolean | null;
};

import {
  DiexAgencyEntity,
  DiexAgencyStatus,
} from 'src/engine/core-modules/diex-agency/diex-agency.entity';
import { CreateAgencyInput } from 'src/engine/core-modules/diex-agency/dtos/create-agency.input';
import { UpdateAgencySlotsInput } from 'src/engine/core-modules/diex-agency/dtos/update-agency-slots.input';
import { UpdateAgencyStatusInput } from 'src/engine/core-modules/diex-agency/dtos/update-agency-status.input';
import { CreateAgencyWorkspaceInput } from 'src/engine/core-modules/diex-agency/dtos/create-agency-workspace.input';
import { DiexAgencyMetricsDTO } from 'src/engine/core-modules/diex-agency/dtos/agency-metrics.dto';
import { type AuthContextUser } from 'src/engine/core-modules/auth/types/auth-context.type';
import { UserEntity } from 'src/engine/core-modules/user/user.entity';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { WorkspaceService } from 'src/engine/core-modules/workspace/services/workspace.service';
import { WorkspaceInvitationService } from 'src/engine/core-modules/workspace-invitation/services/workspace-invitation.service';
import { SignInUpService } from 'src/engine/core-modules/auth/services/sign-in-up.service';
import { GlobalWorkspaceOrmManager } from 'src/engine/diex-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/diex-orm/utils/build-system-auth-context.util';
import { WorkspaceMemberWorkspaceEntity } from 'src/modules/workspace-member/standard-objects/workspace-member.workspace-entity';

@Injectable()
export class DiexAgencyService {
  private readonly logger = new Logger(DiexAgencyService.name);

  constructor(
    // Agencies live in core and own workspaces rather than belonging to one, so
    // there is no workspaceId column for the scoped repository to guard on.
    // eslint-disable-next-line diex/prefer-workspace-scoped-repository
    @InjectRepository(DiexAgencyEntity)
    private readonly agencyRepository: Repository<DiexAgencyEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
    private readonly signInUpService: SignInUpService,
    private readonly workspaceService: WorkspaceService,
    private readonly workspaceInvitationService: WorkspaceInvitationService,
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {}

  async createAgency(input: CreateAgencyInput): Promise<DiexAgencyEntity> {
    const ownerUser = await this.userRepository.findOne({
      where: { email: input.ownerUserEmail.toLowerCase() },
    });

    if (!ownerUser) {
      throw new NotFoundException(
        `Usuário com e-mail ${input.ownerUserEmail} não encontrado.`,
      );
    }

    const existingSlug = await this.agencyRepository.findOne({
      where: { slug: input.slug.toLowerCase() },
    });

    if (existingSlug) {
      throw new BadRequestException(
        `Já existe uma agência com o identificador "${input.slug}".`,
      );
    }

    const agency = this.agencyRepository.create({
      name: input.name,
      slug: input.slug.toLowerCase(),
      ownerUserId: ownerUser.id,
      workspaceSlotsLimit: input.workspaceSlotsLimit ?? 5,
      status: DiexAgencyStatus.ACTIVE,
    });

    const savedAgency = await this.agencyRepository.save(agency);

    ownerUser.isAgencyManager = true;
    ownerUser.agencyId = savedAgency.id;
    await this.userRepository.save(ownerUser);

    return savedAgency;
  }

  async updateAgencySlots(
    input: UpdateAgencySlotsInput,
  ): Promise<DiexAgencyEntity> {
    const agency = await this.agencyRepository.findOne({
      where: { id: input.agencyId },
    });

    if (!agency) {
      throw new NotFoundException('Agência não encontrada.');
    }

    agency.workspaceSlotsLimit = input.workspaceSlotsLimit;
    return await this.agencyRepository.save(agency);
  }

  // Suspending is what DiexAgencyCascadeSuspensionGuard reads. Without this the
  // SUSPENDED status existed in the enum and in the guard, and nothing in the
  // product could ever set it.
  async updateAgencyStatus(
    input: UpdateAgencyStatusInput,
  ): Promise<DiexAgencyEntity> {
    const agency = await this.agencyRepository.findOne({
      where: { id: input.agencyId },
    });

    if (!agency) {
      throw new NotFoundException('Agência não encontrada.');
    }

    agency.status = input.status;

    return await this.agencyRepository.save(agency);
  }

  // Read by the request-scoped cascade guard, so it loads the single column it
  // needs. Reading the agency with its managedWorkspaces relation pulled every
  // workspace row of the agency into memory on every request.
  async isAgencySuspended(agencyId: string): Promise<boolean> {
    const agency = await this.agencyRepository.findOne({
      where: { id: agencyId },
      select: { id: true, status: true },
    });

    return agency?.status === DiexAgencyStatus.SUSPENDED;
  }

  async countAgencyUsedSlots(agencyId: string): Promise<number> {
    return await this.workspaceRepository.count({
      where: { managedByAgencyId: agencyId },
    });
  }

  async getAgencyByUserId(userId: string): Promise<DiexAgencyEntity | null> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || !user.agencyId) {
      return null;
    }
    return await this.agencyRepository.findOne({
      where: { id: user.agencyId },
      relations: ['managedWorkspaces'],
    });
  }

  async getAgencyById(id: string): Promise<DiexAgencyEntity | null> {
    return await this.agencyRepository.findOne({
      where: { id },
      relations: ['managedWorkspaces'],
    });
  }

  async listAllAgencies(): Promise<DiexAgencyEntity[]> {
    return await this.agencyRepository.find({
      relations: ['managedWorkspaces'],
      order: { createdAt: 'DESC' },
    });
  }

  async listAgencyManagedWorkspaces(
    agencyId: string,
  ): Promise<WorkspaceEntity[]> {
    return await this.workspaceRepository.find({
      where: { managedByAgencyId: agencyId },
      order: { createdAt: 'DESC' },
    });
  }

  async createAgencyWorkspace(
    agencyId: string,
    input: CreateAgencyWorkspaceInput,
  ): Promise<WorkspaceEntity> {
    const agency = await this.agencyRepository.findOne({
      where: { id: agencyId },
    });

    if (!agency) {
      throw new NotFoundException('Agência não encontrada.');
    }

    if (agency.status !== DiexAgencyStatus.ACTIVE) {
      throw new BadRequestException('A conta desta agência está suspensa.');
    }

    const currentUsedSlots = await this.countAgencyUsedSlots(agency.id);

    if (currentUsedSlots >= agency.workspaceSlotsLimit) {
      throw new BadRequestException(
        `Limite de slots atingido (${currentUsedSlots}/${agency.workspaceSlotsLimit}). Entre em contato com a equipe Diex para adquirir mais slots.`,
      );
    }

    const subdomain = input.subdomain.toLowerCase();

    const existingWorkspace = await this.workspaceRepository.findOne({
      where: { subdomain },
    });

    if (existingWorkspace) {
      throw new BadRequestException(
        `O subdomínio "${input.subdomain}" já está em uso.`,
      );
    }

    const ownerUser = await this.userRepository.findOne({
      where: { id: agency.ownerUserId },
    });

    if (!ownerUser) {
      throw new BadRequestException(
        'Usuário gestor da agência não encontrado.',
      );
    }

    const { workspace } = await this.signInUpService.signUpOnNewWorkspace(
      { type: 'existingUser', existingUser: ownerUser },
      {
        displayName: input.clientCompanyName,
        subdomain,
      },
    );

    // The description the agency typed is stored where the onboarding step
    // already looks for it, so the first person to open the workspace finds it
    // as the starting text of the AI architect instead of an empty box. The
    // architect itself cannot run here: the workspace owns no schema until
    // activation, and completeDiexOnboarding refuses anyone but its owner.
    await this.workspaceRepository.update(workspace.id, {
      managedByAgencyId: agency.id,
      ...(isNonEmptyString(input.operationDescription)
        ? { onboardingCompanyDescription: input.operationDescription.trim() }
        : {}),
    });

    const linkedWorkspace = await this.workspaceRepository.findOne({
      where: { id: workspace.id },
    });

    if (!linkedWorkspace) {
      throw new NotFoundException(
        'Workspace criado não pôde ser recarregado após vincular a agência.',
      );
    }

    const activatedWorkspace = await this.activateAgencyWorkspace(
      linkedWorkspace,
      ownerUser,
    );

    await this.inviteClientAdmin({
      workspace: activatedWorkspace,
      clientAdminEmail: input.clientAdminEmail,
      agencyOwnerUserId: ownerUser.id,
    });

    return activatedWorkspace;
  }

  // A workspace born of a paid slot skips the server-admin approval wall. The
  // agency was vetted when it was registered and the slot limit is what caps
  // provisioning, so a second manual gate would only strand a client the agency
  // has already been charged for. Activation still goes through the real
  // activateWorkspace, which is what builds the schema.
  private async activateAgencyWorkspace(
    workspace: WorkspaceEntity,
    ownerUser: UserEntity,
  ): Promise<WorkspaceEntity> {
    try {
      const activatedWorkspace = await this.workspaceService.activateWorkspace(
        this.toAuthContextUser(ownerUser),
        workspace,
        { bypassApprovalGate: true },
      );

      return activatedWorkspace ?? workspace;
    } catch (error) {
      this.logger.error(
        `Failed to activate agency workspace ${workspace.id}`,
        error instanceof Error ? error.stack : String(error),
      );

      throw new BadRequestException(
        `O workspace "${workspace.displayName}" foi criado e ocupa um slot, mas a ativação falhou. ` +
          'Nenhum convite foi enviado. Acione a equipe Diex para concluir a ativação.',
      );
    }
  }

  // The invitation is sent before the client has configured anything, and the
  // link is deliberately not aimed at a setup page: whoever opens it lands on
  // the workspace and the standard onboarding routing decides where to go. So
  // the same link leads to the AI architect while the workspace is unconfigured
  // and straight into the CRM once the agency or the client has configured it.
  private async inviteClientAdmin({
    workspace,
    clientAdminEmail,
    agencyOwnerUserId,
  }: {
    workspace: WorkspaceEntity;
    clientAdminEmail: string;
    agencyOwnerUserId: string;
  }): Promise<void> {
    // Nothing in here may propagate. The workspace already exists, is activated
    // and has consumed a slot by this point, so an invitation problem must not
    // turn a completed provisioning into a failed mutation. Both known failure
    // shapes are covered: sendInvitations returns errors for delivery problems
    // and throws for the onboarding invitation limit, and reading the sender
    // touches the workspace schema, which can fail on its own right after
    // activation. The agency can always resend from the members screen.
    try {
      const sender = await this.findInvitationSender({
        workspaceId: workspace.id,
        preferredUserId: agencyOwnerUserId,
      });

      if (!sender) {
        this.logger.error(
          `Agency workspace ${workspace.id} was activated but has no workspace member to send the client invitation from.`,
        );

        return;
      }

      const invitation = await this.workspaceInvitationService.sendInvitations(
        [clientAdminEmail],
        workspace,
        sender,
      );

      if (!invitation.success) {
        this.logger.error(
          `Agency workspace ${workspace.id} was activated but the invitation to ${clientAdminEmail} failed: ${invitation.errors.join(', ')}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Agency workspace ${workspace.id} was activated but the invitation to ${clientAdminEmail} threw`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  private async findInvitationSender({
    workspaceId,
    preferredUserId,
  }: {
    workspaceId: string;
    preferredUserId: string;
  }): Promise<WorkspaceMemberWorkspaceEntity | null> {
    return await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const repository =
          await this.globalWorkspaceOrmManager.getRepository<WorkspaceMemberWorkspaceEntity>(
            workspaceId,
            'workspaceMember',
            { shouldBypassPermissionChecks: true },
          );

        const preferredSender = await repository.findOne({
          where: { userId: preferredUserId },
        });

        if (preferredSender) {
          return preferredSender;
        }

        const [firstWorkspaceMember] = await repository.find({
          order: { createdAt: 'ASC' },
          take: 1,
        });

        return firstWorkspaceMember ?? null;
      },
      buildSystemAuthContext(workspaceId),
    );
  }

  private toAuthContextUser(user: UserEntity): AuthContextUser {
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

  // Single place where "which agency may this caller act on" is decided. The
  // resolvers each used to answer it with `getAgencyByUserId(...) ?? (await
  // listAllAgencies())[0]`, which handed the first agency's spend, Meta Ads
  // accounts and metric definitions to any authenticated user with no agency.
  async resolveAgencyIdForCallerOrThrow(
    user: AgencyCaller,
    requestedAgencyId?: string,
  ): Promise<string> {
    const ownAgency = await this.getAgencyByUserId(user.id);

    if (user.canAccessFullAdminPanel === true) {
      const agencyId = requestedAgencyId ?? ownAgency?.id;

      if (!agencyId) {
        throw new BadRequestException(
          'Informe a agência: administradores precisam escolher explicitamente sobre qual agência a operação será feita.',
        );
      }

      return agencyId;
    }

    if (!ownAgency) {
      throw new ForbiddenException('Acesso restrito a gestores de agência.');
    }

    if (isDefined(requestedAgencyId) && requestedAgencyId !== ownAgency.id) {
      throw new ForbiddenException(
        'Você não tem permissão para acessar os dados desta agência.',
      );
    }

    return ownAgency.id;
  }

  async assertCallerCanActOnAgencyOrThrow(
    user: AgencyCaller,
    agencyId: string,
  ): Promise<void> {
    if (user.canAccessFullAdminPanel === true) {
      return;
    }

    const ownAgency = await this.getAgencyByUserId(user.id);

    if (!ownAgency || ownAgency.id !== agencyId) {
      throw new ForbiddenException(
        'Você não tem permissão para acessar os dados desta agência.',
      );
    }
  }

  // A client workspace is readable by the agency that manages it, and by server
  // admins. Without this the caller-supplied clientWorkspaceId was used as-is.
  async assertCallerCanAccessClientWorkspaceOrThrow(
    user: AgencyCaller,
    clientWorkspaceId: string,
  ): Promise<void> {
    if (user.canAccessFullAdminPanel === true) {
      return;
    }

    const ownAgency = await this.getAgencyByUserId(user.id);

    if (!ownAgency) {
      throw new ForbiddenException('Acesso restrito a gestores de agência.');
    }

    const managedWorkspace = await this.workspaceRepository.findOne({
      where: { id: clientWorkspaceId, managedByAgencyId: ownAgency.id },
      select: { id: true },
    });

    if (!managedWorkspace) {
      throw new ForbiddenException(
        'Este workspace não é gerenciado pela sua agência.',
      );
    }
  }

  async getMetrics(): Promise<DiexAgencyMetricsDTO> {
    const agencies = await this.agencyRepository.find();

    const totalAgencies = agencies.length;
    const activeAgencies = agencies.filter(
      (agency) => agency.status === DiexAgencyStatus.ACTIVE,
    ).length;
    const totalSlotsAllocated = agencies.reduce(
      (acc, agency) => acc + agency.workspaceSlotsLimit,
      0,
    );
    const totalSlotsUsed = await this.workspaceRepository.count({
      where: { managedByAgencyId: Not(IsNull()) },
    });

    return {
      totalAgencies,
      activeAgencies,
      totalSlotsAllocated,
      totalSlotsUsed,
      totalManagedWorkspaces: totalSlotsUsed,
    };
  }
}
