import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { type ObjectLiteral, IsNull, Repository } from 'typeorm';
import { WorkspaceActivationStatus } from 'twenty-shared/workspace';

import {
  AppTokenDeliveryStatus,
  type AppTokenEntity,
} from 'src/engine/core-modules/app-token/app-token.entity';
import { SignInUpService } from 'src/engine/core-modules/auth/services/sign-in-up.service';
import { type AuthContextUser } from 'src/engine/core-modules/auth/types/auth-context.type';
import { SubdomainManagerService } from 'src/engine/core-modules/domain/subdomain-manager/services/subdomain-manager.service';
import { WorkspaceDomainsService } from 'src/engine/core-modules/domain/workspace-domains/services/workspace-domains.service';
import { UserService } from 'src/engine/core-modules/user/services/user.service';
import { WorkspaceInvitationService } from 'src/engine/core-modules/workspace-invitation/services/workspace-invitation.service';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { type WorkspaceRepository } from 'src/engine/twenty-orm/repository/workspace.repository';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { WorkspaceMemberWorkspaceEntity } from 'src/modules/workspace-member/standard-objects/workspace-member.workspace-entity';

import { type ApproveDiexAccessRequestDTO } from 'src/engine/core-modules/diex-access-request/dtos/approve-diex-access-request.dto';
import { type RetryDiexAccessRequestInvitationDTO } from 'src/engine/core-modules/diex-access-request/dtos/retry-diex-access-request-invitation.dto';
import {
  type DiexAccessRequestRecord,
  DiexAccessRequestStatus,
  type DiexPublicAccessRequestInput,
  type DiexPublicAccessRequestResult,
} from 'src/engine/core-modules/diex-access-request/types/diex-access-request.types';

const ACCESS_REQUEST_FIELD_MAX_LENGTH = 200;
const ACCESS_REQUEST_GOAL_MAX_LENGTH = 1_000;
const ACCESS_REQUEST_MAX_SUBMISSIONS_PER_EMAIL = 25;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type ApproveRequestParams = {
  requestId: string;
  requestedSubdomain: string;
  operatorWorkspaceId: string;
  operator: AuthContextUser;
};

type RetryInvitationParams = {
  requestId: string;
  operatorWorkspaceId: string;
  operator: AuthContextUser;
};

const readText = (value: unknown, maxLength: number): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed.slice(0, maxLength) : null;
};

const readEmail = (value: unknown): string | null => {
  const normalized = readText(
    value,
    ACCESS_REQUEST_FIELD_MAX_LENGTH,
  )?.toLowerCase();

  return normalized && EMAIL_PATTERN.test(normalized) ? normalized : null;
};

const readWhatsapp = (value: unknown): string | null => {
  const text = readText(value, ACCESS_REQUEST_FIELD_MAX_LENGTH);
  const digits = text?.replace(/\D/g, '') ?? '';

  if (!text || digits.length < 10 || digits.length > 15) {
    return null;
  }

  const normalized =
    digits.length <= 11 && !text.startsWith('+') ? `55${digits}` : digits;

  return `+${normalized}`;
};

const readSubdomain = (value: unknown): string | null => {
  const normalized = readText(value, 30)
    ?.toLowerCase()
    .replace(/[^a-z0-9-]/g, '');

  return normalized && normalized.length >= 3 ? normalized : null;
};

@Injectable()
export class DiexAccessRequestService {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    private readonly signInUpService: SignInUpService,
    private readonly userService: UserService,
    private readonly subdomainManagerService: SubdomainManagerService,
    private readonly workspaceDomainsService: WorkspaceDomainsService,
    private readonly workspaceInvitationService: WorkspaceInvitationService,
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
  ) {}

  private async withRepository<T>(
    workspaceId: string,
    operation: (
      repository: WorkspaceRepository<DiexAccessRequestRecord & ObjectLiteral>,
    ) => Promise<T>,
  ): Promise<T> {
    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const repository = await this.globalWorkspaceOrmManager.getRepository<
          DiexAccessRequestRecord & ObjectLiteral
        >(workspaceId, 'diexAccessRequest', {
          shouldBypassPermissionChecks: true,
        });

        return operation(repository);
      },
      buildSystemAuthContext(workspaceId),
    );
  }

  private async withRequestTransactionLock<T>(
    requestId: string,
    operation: () => Promise<T>,
  ): Promise<T> {
    return this.workspaceRepository.manager.transaction(async (manager) => {
      // A transaction-scoped Postgres advisory lock belongs to this exact DB
      // connection. It has no expiring lease and another execution cannot
      // release it, so reserve/create/recover/release stay one critical cycle.
      await manager.query(
        'SELECT pg_advisory_xact_lock(hashtextextended($1::text, 0))',
        [`diex-access-request:${requestId}`],
      );

      return operation();
    });
  }

  async submitPublicRequest(
    workspaceId: string,
    input: DiexPublicAccessRequestInput,
  ): Promise<DiexPublicAccessRequestResult> {
    if (readText(input.website, 10) !== null) {
      return { accepted: true, message: 'Recebemos sua solicitação.' };
    }

    const companyName = readText(
      input.companyName,
      ACCESS_REQUEST_FIELD_MAX_LENGTH,
    );
    const email = readEmail(input.email);
    const whatsapp = readWhatsapp(input.whatsapp);

    if (!companyName || !email || !whatsapp) {
      return {
        accepted: false,
        message:
          'Informe o nome da empresa, um e-mail válido e um WhatsApp com DDD.',
      };
    }

    const contactName = readText(
      input.contactName,
      ACCESS_REQUEST_FIELD_MAX_LENGTH,
    );
    const teamSize = readText(input.teamSize, ACCESS_REQUEST_FIELD_MAX_LENGTH);
    const desiredSubdomain = readSubdomain(input.desiredSubdomain);
    const goal = readText(input.goal, ACCESS_REQUEST_GOAL_MAX_LENGTH);
    const requestedAt = new Date().toISOString();

    return this.withRepository(workspaceId, async (repository) => {
      const existing = await repository.findOne({ where: { email } });

      if (existing) {
        const submissionCount = (existing.submissionCount ?? 1) + 1;

        if (submissionCount > ACCESS_REQUEST_MAX_SUBMISSIONS_PER_EMAIL) {
          return { accepted: true, message: 'Recebemos sua solicitação.' };
        }

        const shouldPreserveDecision =
          existing.status === DiexAccessRequestStatus.APPROVED ||
          existing.status === DiexAccessRequestStatus.REJECTED;

        await repository.update(existing.id, {
          name: companyName,
          contactName,
          whatsapp,
          teamSize,
          desiredSubdomain,
          goal,
          submissionCount,
          ...(shouldPreserveDecision ? {} : { requestedAt }),
        });

        return {
          accepted: true,
          message:
            'Atualizamos sua solicitação. Entraremos em contato pelo WhatsApp.',
        };
      }

      await repository.save({
        name: companyName,
        status: DiexAccessRequestStatus.NEW,
        contactName,
        email,
        whatsapp,
        teamSize,
        desiredSubdomain,
        goal,
        submissionCount: 1,
        requestedAt,
      });

      return {
        accepted: true,
        message: 'Solicitação recebida. Entraremos em contato pelo WhatsApp.',
      };
    });
  }

  async approveRequest(
    params: ApproveRequestParams,
  ): Promise<ApproveDiexAccessRequestDTO> {
    return this.withRequestTransactionLock(params.requestId, () =>
      this.approveRequestWithinLock(params),
    );
  }

  private async approveRequestWithinLock({
    requestId,
    requestedSubdomain,
    operatorWorkspaceId,
    operator,
  }: ApproveRequestParams): Promise<ApproveDiexAccessRequestDTO> {
    const normalizedSubdomain = requestedSubdomain.trim().toLowerCase();
    let request = await this.withRepository(operatorWorkspaceId, (repository) =>
      repository.findOne({ where: { id: requestId } }),
    );

    if (!request) {
      throw new NotFoundException('Solicitação de acesso não encontrada.');
    }

    let workspace = await this.workspaceRepository.findOne({
      where: { id: requestId },
    });

    if (!workspace && request.status === DiexAccessRequestStatus.APPROVED) {
      throw new BadRequestException(
        'A solicitação consta como aprovada, mas o workspace determinístico não foi encontrado.',
      );
    }

    if (!workspace) {
      request = await this.reserveRequestedSubdomain({
        request,
        requestedSubdomain: normalizedSubdomain,
        operatorWorkspaceId,
      });
      workspace = await this.workspaceRepository.findOne({
        where: { id: requestId },
      });
    }

    if (!request.provisionedSubdomain) {
      throw new BadRequestException(
        'Não foi possível reservar o endereço para esta solicitação.',
      );
    }

    const reservedSubdomain = request.provisionedSubdomain;

    if (workspace && workspace.subdomain !== reservedSubdomain) {
      throw new BadRequestException(
        'A recuperação encontrou um workspace incompatível com a solicitação.',
      );
    }

    if (!workspace) {
      const fullUser = await this.userService.findUserByIdOrThrow(operator.id);

      try {
        const creation = await this.signInUpService.signUpOnNewWorkspace(
          { type: 'existingUser', existingUser: fullUser },
          {
            displayName: request.name ?? reservedSubdomain,
            subdomain: reservedSubdomain,
            // A stable core ID makes a retry recover the exact workspace even
            // if the request update or response failed after creation.
            workspaceId: requestId,
          },
        );

        workspace = creation.workspace;
      } catch (error) {
        workspace = await this.workspaceRepository.findOne({
          where: { id: requestId },
        });

        if (!workspace) {
          const reservationReleased =
            await this.releaseReservationIfSubdomainWasClaimed({
              requestId,
              reservedSubdomain,
              operatorWorkspaceId,
            });

          if (reservationReleased) {
            throw new BadRequestException(
              `O endereço ${reservedSubdomain} foi ocupado durante o provisionamento. A reserva foi liberada; escolha outro endereço.`,
            );
          }

          throw error;
        }
      }
    }

    await this.withRepository(operatorWorkspaceId, (repository) =>
      repository.update(requestId, {
        status: DiexAccessRequestStatus.APPROVED,
        provisionedSubdomain: reservedSubdomain,
        reviewedAt: new Date().toISOString(),
      }),
    );

    const workspaceUrl = this.workspaceDomainsService
      .getWorkspaceUrls(workspace)
      .subdomainUrl.replace(/\/+$/, '');
    const isWorkspaceActive =
      workspace.activationStatus === WorkspaceActivationStatus.ACTIVE ||
      workspace.activationStatus === WorkspaceActivationStatus.CREATED;

    return {
      workspaceUrl,
      subdomain: reservedSubdomain,
      invitationMessage: isWorkspaceActive
        ? 'Workspace ativo. Use “Enviar convite” para liberar o acesso do cliente.'
        : 'Workspace criado. Ative-o primeiro e depois use “Enviar convite”.',
    };
  }

  private async reserveRequestedSubdomain({
    request,
    requestedSubdomain,
    operatorWorkspaceId,
  }: {
    request: DiexAccessRequestRecord;
    requestedSubdomain: string;
    operatorWorkspaceId: string;
  }): Promise<DiexAccessRequestRecord> {
    const currentReservation = request.provisionedSubdomain;

    if (currentReservation === requestedSubdomain) {
      return request;
    }

    if (currentReservation) {
      const deterministicWorkspace = await this.workspaceRepository.findOne({
        where: { id: request.id },
      });

      if (deterministicWorkspace) {
        return request;
      }

      const currentAvailability =
        await this.subdomainManagerService.getSubdomainAvailability(
          currentReservation,
        );

      if (currentAvailability.available) {
        throw new BadRequestException(
          `Esta solicitação ainda reserva ${currentReservation}. Use esse endereço ou atualize a fila antes de tentar novamente.`,
        );
      }

      // If availability became false because the deterministic creation just
      // committed, it is now visible and owns the reservation. Only a genuine
      // external conflict may proceed to the compare-and-set below.
      const recoveredWorkspace = await this.workspaceRepository.findOne({
        where: { id: request.id },
      });

      if (recoveredWorkspace) {
        return request;
      }
    }

    const requestedAvailability =
      await this.subdomainManagerService.getSubdomainAvailability(
        requestedSubdomain,
      );

    if (!requestedAvailability.available) {
      throw new BadRequestException(
        `O endereço ${requestedSubdomain} não está disponível.`,
      );
    }

    const updateResult = await this.withRepository(
      operatorWorkspaceId,
      async (repository) => {
        const workspaceImmediatelyBeforeCas =
          await this.workspaceRepository.findOne({
            where: { id: request.id },
          });

        if (workspaceImmediatelyBeforeCas) {
          return null;
        }

        return repository.update(
          {
            id: request.id,
            provisionedSubdomain: currentReservation ?? IsNull(),
          },
          {
            provisionedSubdomain: requestedSubdomain,
            status: DiexAccessRequestStatus.NEGOTIATING,
          },
        );
      },
    );

    if (updateResult === null) {
      return request;
    }

    const refreshedRequest = await this.withRepository(
      operatorWorkspaceId,
      (repository) => repository.findOne({ where: { id: request.id } }),
    );

    if (!refreshedRequest) {
      throw new NotFoundException('Solicitação de acesso não encontrada.');
    }

    if (
      (updateResult.affected ?? 0) === 0 ||
      refreshedRequest.provisionedSubdomain !== requestedSubdomain
    ) {
      throw new BadRequestException(
        'A reserva mudou durante a aprovação. Atualize a fila antes de tentar novamente.',
      );
    }

    return refreshedRequest;
  }

  private async releaseReservationIfSubdomainWasClaimed({
    requestId,
    reservedSubdomain,
    operatorWorkspaceId,
  }: {
    requestId: string;
    reservedSubdomain: string;
    operatorWorkspaceId: string;
  }): Promise<boolean> {
    const availability =
      await this.subdomainManagerService.getSubdomainAvailability(
        reservedSubdomain,
      );

    if (availability.available) {
      return false;
    }

    const recoveredWorkspace = await this.workspaceRepository.findOne({
      where: { id: requestId },
    });

    if (recoveredWorkspace) {
      return false;
    }

    const releaseResult = await this.withRepository(
      operatorWorkspaceId,
      async (repository) => {
        const workspaceImmediatelyBeforeCas =
          await this.workspaceRepository.findOne({
            where: { id: requestId },
          });

        if (workspaceImmediatelyBeforeCas) {
          return null;
        }

        return repository.update(
          { id: requestId, provisionedSubdomain: reservedSubdomain },
          {
            provisionedSubdomain: null,
            status: DiexAccessRequestStatus.NEGOTIATING,
          },
        );
      },
    );

    return releaseResult !== null && (releaseResult.affected ?? 0) > 0;
  }

  async retryInvitation(
    params: RetryInvitationParams,
  ): Promise<RetryDiexAccessRequestInvitationDTO> {
    return this.withRequestTransactionLock(params.requestId, () =>
      this.retryInvitationWithinLock(params),
    );
  }

  private async retryInvitationWithinLock({
    requestId,
    operatorWorkspaceId,
    operator,
  }: RetryInvitationParams): Promise<RetryDiexAccessRequestInvitationDTO> {
    const request = await this.withRepository(
      operatorWorkspaceId,
      (repository) => repository.findOne({ where: { id: requestId } }),
    );

    if (!request) {
      throw new NotFoundException('Solicitação de acesso não encontrada.');
    }

    if (
      request.status !== DiexAccessRequestStatus.APPROVED ||
      !request.provisionedSubdomain
    ) {
      throw new BadRequestException(
        'A solicitação precisa estar aprovada antes do envio do convite.',
      );
    }

    const workspace = await this.workspaceRepository.findOne({
      where: { id: requestId },
    });

    if (!workspace || workspace.subdomain !== request.provisionedSubdomain) {
      throw new BadRequestException(
        'O workspace aprovado não pôde ser recuperado com segurança.',
      );
    }

    if (
      workspace.activationStatus !== WorkspaceActivationStatus.ACTIVE &&
      workspace.activationStatus !== WorkspaceActivationStatus.CREATED
    ) {
      return {
        invitationReady: false,
        message:
          'Ative o workspace antes de enviar o convite. Depois volte a esta fila e tente novamente.',
      };
    }

    if (!request.email) {
      return {
        invitationReady: false,
        message: 'A solicitação não possui um e-mail para receber o convite.',
      };
    }

    const normalizedEmail = request.email.toLowerCase();

    return this.retryInvitationDelivery({
      workspace,
      normalizedEmail,
      preferredUserId: operator.id,
    });
  }

  private async retryInvitationDelivery({
    workspace,
    normalizedEmail,
    preferredUserId,
  }: {
    workspace: WorkspaceEntity;
    normalizedEmail: string;
    preferredUserId: string;
  }): Promise<RetryDiexAccessRequestInvitationDTO> {
    const existingInvitations =
      await this.workspaceInvitationService.getWorkspaceInvitationsForEmail(
        workspace.id,
        normalizedEmail,
      );
    const alreadySentInvitation = existingInvitations.find((invitation) =>
      this.isActiveSentInvitation(invitation),
    );

    if (alreadySentInvitation) {
      return {
        invitationReady: true,
        message: `O envio para ${normalizedEmail} já foi confirmado.`,
      };
    }

    // PENDING means token persistence succeeded but dispatch did not. Legacy,
    // expired, revoked and removed tokens are also not usable. Delete by exact
    // token ID + workspace before generating one fresh, active invitation.
    for (const invitation of existingInvitations) {
      await this.workspaceInvitationService.deleteWorkspaceInvitation(
        invitation.id,
        workspace.id,
      );
    }

    const invitationsAfterCleanup =
      await this.workspaceInvitationService.getWorkspaceInvitationsForEmail(
        workspace.id,
        normalizedEmail,
      );

    if (invitationsAfterCleanup.length > 0) {
      return {
        invitationReady: false,
        message:
          'O estado do convite mudou durante a recuperação. Atualize a fila antes de tentar novamente.',
      };
    }

    const sender = await this.findInvitationSender({
      workspaceId: workspace.id,
      preferredUserId,
    });

    if (!sender) {
      return {
        invitationReady: false,
        message:
          'O workspace está ativo, mas ainda não possui um membro remetente. Abra o workspace e tente novamente.',
      };
    }

    const invitation = await this.workspaceInvitationService.sendInvitations(
      [normalizedEmail],
      workspace,
      sender,
    );

    if (!invitation.success) {
      return {
        invitationReady: false,
        message:
          invitation.errors[0] ??
          'Não foi possível enviar o convite. Tente novamente pela fila ou por Membros.',
      };
    }

    const deliveredInvitations =
      await this.workspaceInvitationService.getWorkspaceInvitationsForEmail(
        workspace.id,
        normalizedEmail,
      );
    const sentInvitation = deliveredInvitations.find((invitation) =>
      this.isActiveSentInvitation(invitation),
    );

    if (!sentInvitation) {
      return {
        invitationReady: false,
        message:
          'O token foi criado, mas o envio não pôde ser confirmado. Tente novamente.',
      };
    }

    return {
      invitationReady: true,
      message: `Convite enviado para ${normalizedEmail}.`,
    };
  }

  private isActiveSentInvitation(invitation: AppTokenEntity): boolean {
    return (
      invitation.deletedAt === null &&
      invitation.revokedAt === null &&
      invitation.expiresAt.getTime() > Date.now() &&
      Boolean(invitation.value) &&
      invitation.context?.deliveryStatus === AppTokenDeliveryStatus.SENT
    );
  }

  private async findInvitationSender({
    workspaceId,
    preferredUserId,
  }: {
    workspaceId: string;
    preferredUserId: string;
  }): Promise<WorkspaceMemberWorkspaceEntity | null> {
    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
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
}
