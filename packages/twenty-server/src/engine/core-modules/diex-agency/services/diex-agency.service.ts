import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isDefined } from 'twenty-shared/utils';
import { Repository } from 'typeorm';

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
import { CreateAgencyWorkspaceInput } from 'src/engine/core-modules/diex-agency/dtos/create-agency-workspace.input';
import { DiexAgencyMetricsDTO } from 'src/engine/core-modules/diex-agency/dtos/agency-metrics.dto';
import { UserEntity } from 'src/engine/core-modules/user/user.entity';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { SignInUpService } from 'src/engine/core-modules/auth/services/sign-in-up.service';

@Injectable()
export class DiexAgencyService {
  constructor(
    // Agencies live in core and own workspaces rather than belonging to one, so
    // there is no workspaceId column for the scoped repository to guard on.
    // eslint-disable-next-line twenty/prefer-workspace-scoped-repository
    @InjectRepository(DiexAgencyEntity)
    private readonly agencyRepository: Repository<DiexAgencyEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
    private readonly signInUpService: SignInUpService,
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
      relations: ['managedWorkspaces'],
    });

    if (!agency) {
      throw new NotFoundException('Agência não encontrada.');
    }

    if (agency.status !== DiexAgencyStatus.ACTIVE) {
      throw new BadRequestException('A conta desta agência está suspensa.');
    }

    const currentUsedSlots = agency.managedWorkspaces?.length ?? 0;
    if (currentUsedSlots >= agency.workspaceSlotsLimit) {
      throw new BadRequestException(
        `Limite de slots atingido (${currentUsedSlots}/${agency.workspaceSlotsLimit}). Entre em contato com a equipe Diex para adquirir mais slots.`,
      );
    }

    const existingWorkspace = await this.workspaceRepository.findOne({
      where: { subdomain: input.subdomain.toLowerCase() },
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
        subdomain: input.subdomain.toLowerCase(),
      },
    );

    // Only the agency link is set here. Stamping ACTIVE used to happen right
    // after sign-up, which left a workspace advertised as active while
    // signUpOnNewWorkspace had built no database schema for it: every request
    // to that workspace then failed. Activation belongs to activateWorkspace,
    // which is also what the approval gate goes through.
    await this.workspaceRepository.update(workspace.id, {
      managedByAgencyId: agency.id,
    });

    const savedWorkspace = await this.workspaceRepository.findOne({
      where: { id: workspace.id },
    });

    if (!savedWorkspace) {
      throw new NotFoundException(
        'Workspace criado não pôde ser recarregado após vincular a agência.',
      );
    }

    return savedWorkspace;
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
    const agencies = await this.agencyRepository.find({
      relations: ['managedWorkspaces'],
    });

    const totalAgencies = agencies.length;
    const activeAgencies = agencies.filter(
      (a) => a.status === DiexAgencyStatus.ACTIVE,
    ).length;
    const totalSlotsAllocated = agencies.reduce(
      (acc, a) => acc + a.workspaceSlotsLimit,
      0,
    );
    const totalSlotsUsed = agencies.reduce(
      (acc, a) => acc + (a.managedWorkspaces?.length ?? 0),
      0,
    );

    return {
      totalAgencies,
      activeAgencies,
      totalSlotsAllocated,
      totalSlotsUsed,
      totalManagedWorkspaces: totalSlotsUsed,
    };
  }
}
