import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { DiexAgencyEntity, DiexAgencyStatus } from 'src/engine/core-modules/diex-agency/diex-agency.entity';
import { CreateAgencyInput } from 'src/engine/core-modules/diex-agency/dtos/create-agency.input';
import { UpdateAgencySlotsInput } from 'src/engine/core-modules/diex-agency/dtos/update-agency-slots.input';
import { CreateAgencyWorkspaceInput } from 'src/engine/core-modules/diex-agency/dtos/create-agency-workspace.input';
import { DiexAgencyMetricsDTO } from 'src/engine/core-modules/diex-agency/dtos/agency-metrics.dto';
import { UserEntity } from 'src/engine/core-modules/user/user.entity';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { SignInUpService } from 'src/engine/core-modules/auth/services/sign-in-up.service';
import { WorkspaceActivationStatus } from 'twenty-shared/workspace';

@Injectable()
export class DiexAgencyService {
  constructor(
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
      throw new NotFoundException(`Usuário com e-mail ${input.ownerUserEmail} não encontrado.`);
    }

    const existingSlug = await this.agencyRepository.findOne({
      where: { slug: input.slug.toLowerCase() },
    });

    if (existingSlug) {
      throw new BadRequestException(`Já existe uma agência com o identificador "${input.slug}".`);
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

  async updateAgencySlots(input: UpdateAgencySlotsInput): Promise<DiexAgencyEntity> {
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

  async listAgencyManagedWorkspaces(agencyId: string): Promise<WorkspaceEntity[]> {
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
      throw new BadRequestException(`O subdomínio "${input.subdomain}" já está em uso.`);
    }

    const ownerUser = await this.userRepository.findOne({
      where: { id: agency.ownerUserId },
    });

    if (!ownerUser) {
      throw new BadRequestException('Usuário gestor da agência não encontrado.');
    }

    const { workspace } = await this.signInUpService.signUpOnNewWorkspace(
      { type: 'existingUser', existingUser: ownerUser },
      {
        displayName: input.clientCompanyName,
        subdomain: input.subdomain.toLowerCase(),
      },
    );

    // Agora atualizamos a agência responsável
    workspace.managedByAgencyId = agency.id;
    workspace.activationStatus = WorkspaceActivationStatus.ACTIVE;

    const savedWorkspace = await this.workspaceRepository.save(workspace);
    return savedWorkspace;
  }

  async getMetrics(): Promise<DiexAgencyMetricsDTO> {
    const agencies = await this.agencyRepository.find({
      relations: ['managedWorkspaces'],
    });

    const totalAgencies = agencies.length;
    const activeAgencies = agencies.filter((a) => a.status === DiexAgencyStatus.ACTIVE).length;
    const totalSlotsAllocated = agencies.reduce((acc, a) => acc + a.workspaceSlotsLimit, 0);
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
