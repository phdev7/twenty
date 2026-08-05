import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import crypto from 'crypto';

import { msg } from '@lingui/core/macro';
import { render } from '@react-email/render';
import { addMilliseconds } from 'date-fns';
import ms from 'ms';
import { SendInviteLinkEmail } from 'twenty-emails';
import { AppPath, FileFolder } from 'twenty-shared/types';
import { getAppPath, isDefined } from 'twenty-shared/utils';
import { type EntityManager, In, IsNull, MoreThan, Repository } from 'typeorm';

import {
  AppTokenDeliveryStatus,
  AppTokenEntity,
  AppTokenType,
} from 'src/engine/core-modules/app-token/app-token.entity';
import {
  WorkspaceInvitationFamily,
  WorkspaceInvitationStateEntity,
} from 'src/engine/core-modules/workspace-invitation/entities/workspace-invitation-state.entity';
import { INVITATION_APP_TOKEN_TYPES } from 'src/engine/core-modules/workspace-invitation/constants/invitation-app-token-types';
import {
  AuthException,
  AuthExceptionCode,
} from 'src/engine/core-modules/auth/auth.exception';
import { WorkspaceDomainsService } from 'src/engine/core-modules/domain/workspace-domains/services/workspace-domains.service';
import { EmailService } from 'src/engine/core-modules/email/email.service';
import { FileUrlService } from 'src/engine/core-modules/file/file-url/file-url.service';
import { I18nService } from 'src/engine/core-modules/i18n/i18n.service';
import { OnboardingService } from 'src/engine/core-modules/onboarding/onboarding.service';
import { ThrottlerService } from 'src/engine/core-modules/throttler/throttler.service';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { UserWorkspaceEntity } from 'src/engine/core-modules/user-workspace/user-workspace.entity';
import { type SendInvitationsDTO } from 'src/engine/core-modules/workspace-invitation/dtos/send-invitations.dto';
import { castAppTokenToWorkspaceInvitationUtil } from 'src/engine/core-modules/workspace-invitation/utils/cast-app-token-to-workspace-invitation.util';
import {
  WorkspaceInvitationException,
  WorkspaceInvitationExceptionCode,
} from 'src/engine/core-modules/workspace-invitation/workspace-invitation.exception';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { RoleValidationService } from 'src/engine/metadata-modules/role-validation/services/role-validation.service';
import { WorkspaceMemberWorkspaceEntity } from 'src/modules/workspace-member/standard-objects/workspace-member.workspace-entity';
import { CustomException } from 'src/utils/custom-exception';

type PreparedWorkspaceInvitation = {
  appToken: AppTokenEntity;
  state: WorkspaceInvitationStateEntity;
};

type InvitationDeliveryResult = {
  appToken?: AppTokenEntity;
  error?: string;
};

type InvitationDeliveryOptions = {
  allowExplicitResend?: boolean;
  preferredAppTokenId?: string;
};

const WORKSPACE_INVITATION_FAMILY =
  WorkspaceInvitationFamily.WORKSPACE_INVITATION;
const INVITATION_DISPATCH_STALE_AFTER_MS = 5 * 60 * 1_000;

@Injectable()
export class WorkspaceInvitationService {
  constructor(
    @InjectRepository(AppTokenEntity)
    private readonly appTokenRepository: Repository<AppTokenEntity>,
    @InjectRepository(UserWorkspaceEntity)
    private readonly userWorkspaceRepository: Repository<UserWorkspaceEntity>,
    // eslint-disable-next-line twenty/prefer-workspace-scoped-repository -- This durable state lives in core; every access is pinned to workspaceId and immutable state/token IDs.
    @InjectRepository(WorkspaceInvitationStateEntity)
    private readonly workspaceInvitationStateRepository: Repository<WorkspaceInvitationStateEntity>,
    private readonly roleValidationService: RoleValidationService,
    private readonly twentyConfigService: TwentyConfigService,
    private readonly emailService: EmailService,
    private readonly onboardingService: OnboardingService,
    private readonly workspaceDomainsService: WorkspaceDomainsService,
    private readonly i18nService: I18nService,
    private readonly throttlerService: ThrottlerService,
    private readonly fileUrlService: FileUrlService,
  ) {}

  async validatePersonalInvitation({
    workspacePersonalInviteToken,
    email,
  }: {
    workspacePersonalInviteToken?: string;
    email: string;
  }) {
    try {
      const appToken = await this.appTokenRepository.findOne({
        where: {
          value: workspacePersonalInviteToken,
          type: In(INVITATION_APP_TOKEN_TYPES),
          deletedAt: IsNull(),
          revokedAt: IsNull(),
        },
        relations: { workspace: true },
      });

      if (!appToken) {
        throw new Error('Invalid invitation token');
      }

      if (!appToken.context?.email || appToken.context?.email !== email) {
        throw new Error('Email does not match the invitation');
      }

      if (new Date(appToken.expiresAt) < new Date()) {
        throw new Error('Invitation expired');
      }

      return { isValid: true, workspace: appToken.workspace };
    } catch (err) {
      throw new AuthException(
        err.message,
        AuthExceptionCode.FORBIDDEN_EXCEPTION,
      );
    }
  }

  async findInvitationsByEmail(email: string) {
    return await this.appTokenRepository
      .createQueryBuilder('appToken')
      .innerJoinAndSelect('appToken.workspace', 'workspace')
      .where('"appToken".type IN (:...types)', {
        types: INVITATION_APP_TOKEN_TYPES,
      })
      .andWhere('"appToken".context->>\'email\' = :email', { email })
      .andWhere('appToken.deletedAt IS NULL')
      .andWhere('appToken.revokedAt IS NULL')
      .andWhere('appToken.expiresAt > :now', {
        now: new Date(),
      })
      .getMany();
  }

  async getOneWorkspaceInvitation(workspaceId: string, email: string) {
    return await this.appTokenRepository
      .createQueryBuilder('appToken')
      .where('"appToken"."workspaceId" = :workspaceId', {
        workspaceId,
      })
      .andWhere('"appToken".type IN (:...types)', {
        types: INVITATION_APP_TOKEN_TYPES,
      })
      .andWhere('"appToken".context->>\'email\' = :email', { email })
      .andWhere('"appToken"."deletedAt" IS NULL')
      .andWhere('"appToken"."revokedAt" IS NULL')
      .andWhere('"appToken"."expiresAt" > :now', { now: new Date() })
      .getOne();
  }

  async getWorkspaceInvitationsForEmail(workspaceId: string, email: string) {
    return await this.appTokenRepository
      .createQueryBuilder('appToken')
      .where('"appToken"."workspaceId" = :workspaceId', {
        workspaceId,
      })
      .andWhere('"appToken".type IN (:...types)', {
        types: INVITATION_APP_TOKEN_TYPES,
      })
      .andWhere('"appToken".context->>\'email\' = :email', {
        email: email.toLowerCase(),
      })
      .orderBy('"appToken"."createdAt"', 'DESC')
      .getMany();
  }

  async getAppTokenByInvitationToken(invitationToken: string) {
    const appToken = await this.appTokenRepository.findOne({
      where: {
        value: invitationToken,
        type: In(INVITATION_APP_TOKEN_TYPES),
      },
      relations: { workspace: true },
    });

    if (!appToken) {
      throw new WorkspaceInvitationException(
        'Invalid invitation token',
        WorkspaceInvitationExceptionCode.INVALID_INVITATION,
      );
    }

    return appToken;
  }

  async loadWorkspaceInvitations(workspace: WorkspaceEntity) {
    const appTokens = await this.appTokenRepository.find({
      where: {
        workspaceId: workspace.id,
        type: In(INVITATION_APP_TOKEN_TYPES),
        deletedAt: IsNull(),
        revokedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
      select: {
        value: false,
      },
    });

    return appTokens.map(castAppTokenToWorkspaceInvitationUtil);
  }

  async createWorkspaceInvitation(
    email: string,
    workspace: WorkspaceEntity,
    roleId?: string,
    isOnboardingInvitation = false,
  ) {
    const normalizedEmail = this.normalizeInvitationEmail(email);

    const isUserAlreadyInWorkspace = await this.userWorkspaceRepository.exists({
      where: {
        workspaceId: workspace.id,
        user: {
          email: normalizedEmail,
        },
      },
      relations: {
        user: true,
      },
    });

    if (isUserAlreadyInWorkspace) {
      throw new WorkspaceInvitationException(
        `${normalizedEmail} is already in the workspace`,
        WorkspaceInvitationExceptionCode.USER_ALREADY_EXIST,
      );
    }

    const preparedInvitation = await this.prepareWorkspaceInvitation({
      workspaceId: workspace.id,
      normalizedEmail,
      roleId,
      isOnboardingInvitation,
    });

    return preparedInvitation.appToken;
  }

  async deleteWorkspaceInvitation(appTokenId: string, workspaceId: string) {
    return this.appTokenRepository.manager.transaction(async (manager) => {
      const appTokenRepository = manager.getRepository(AppTokenEntity);
      const stateRepository = manager.getRepository(
        WorkspaceInvitationStateEntity,
      );
      const appToken = await appTokenRepository.findOne({
        where: {
          id: appTokenId,
          workspaceId,
          type: In(INVITATION_APP_TOKEN_TYPES),
        },
      });

      if (!appToken) {
        return 'error';
      }

      const state = await stateRepository.findOne({
        where: { appTokenId, workspaceId },
        lock: { mode: 'pessimistic_write' },
      });

      if (state) {
        if (state.deliveryStatus === AppTokenDeliveryStatus.DISPATCHING) {
          return 'error';
        }

        await stateRepository.delete(state.id);
      }

      await appTokenRepository.delete(appToken.id);

      return 'success';
    });
  }

  async invalidateWorkspaceInvitation(workspaceId: string, email: string) {
    const appToken = await this.getOneWorkspaceInvitation(workspaceId, email);

    if (!isDefined(appToken)) {
      return;
    }

    await this.deleteWorkspaceInvitation(appToken.id, workspaceId);
  }

  async resendWorkspaceInvitation(
    appTokenId: string,
    workspace: WorkspaceEntity,
    sender: WorkspaceMemberWorkspaceEntity,
  ) {
    const appToken = await this.appTokenRepository.findOne({
      where: {
        id: appTokenId,
        workspaceId: workspace.id,
        type: In(INVITATION_APP_TOKEN_TYPES),
      },
    });

    if (!appToken || !appToken.context?.email) {
      throw new WorkspaceInvitationException(
        'Invalid appToken',
        WorkspaceInvitationExceptionCode.INVALID_INVITATION,
      );
    }

    return this.sendInvitations(
      [appToken.context.email],
      workspace,
      sender,
      appToken.context.roleId,
      appToken.type === AppTokenType.OnboardingInvitationToken,
      {
        allowExplicitResend: true,
        preferredAppTokenId: appToken.id,
      },
    );
  }

  async sendInvitations(
    emails: string[],
    workspace: WorkspaceEntity,
    sender: WorkspaceMemberWorkspaceEntity,
    roleId?: string,
    isOnboardingInviteRewardOverride?: boolean,
    deliveryOptions: InvitationDeliveryOptions = {},
  ): Promise<SendInvitationsDTO> {
    if (!workspace?.inviteHash) {
      return {
        success: false,
        errors: ['Workspace invite hash not found'],
        result: [],
      };
    }

    if (isDefined(roleId)) {
      await this.roleValidationService.validateRoleAssignableToUsersOrThrow(
        roleId,
        workspace.id,
      );
    }

    const normalizedEmails = [
      ...new Set(emails.map((email) => this.normalizeInvitationEmail(email))),
    ];
    const isOnboardingInviteReward =
      isOnboardingInviteRewardOverride ??
      (await this.onboardingService.isOnboardingInviteTeamPending({
        workspaceId: workspace.id,
      }));

    if (isOnboardingInviteReward) {
      await this.throwIfOnboardingInvitationLimitReached(
        workspace.id,
        normalizedEmails.length,
      );
    }

    await this.throttleInvitationSending(workspace.id, normalizedEmails);

    const invitationResults = await Promise.allSettled(
      normalizedEmails.map((normalizedEmail) =>
        this.deliverWorkspaceInvitation({
          normalizedEmail,
          workspace,
          sender,
          roleId,
          isOnboardingInvitation: isOnboardingInviteReward,
          deliveryOptions,
        }),
      ),
    );

    const i18n = this.i18nService.getI18nInstance(sender.locale);

    const result = invitationResults.reduce<{
      errors: string[];
      result: ReturnType<typeof castAppTokenToWorkspaceInvitationUtil>[];
    }>(
      (acc, invitation) => {
        if (invitation.status === 'rejected') {
          const reason = invitation.reason;

          if (reason instanceof CustomException && reason.userFriendlyMessage) {
            acc.errors.push(i18n._(reason.userFriendlyMessage));
          } else {
            acc.errors.push(reason?.message ?? 'Unknown error');
          }
        } else if (invitation.value.error) {
          acc.errors.push(invitation.value.error);
        } else if (invitation.value.appToken) {
          acc.result.push(
            castAppTokenToWorkspaceInvitationUtil(invitation.value.appToken),
          );
        }

        return acc;
      },
      { errors: [], result: [] },
    );

    if (result.result.length > 0) {
      await this.onboardingService
        .setOnboardingInviteTeamPending({
          workspaceId: workspace.id,
          value: false,
        })
        .catch(() => undefined);
    }

    return {
      success: result.errors.length === 0,
      ...result,
    };
  }

  async generateInvitationToken(
    workspaceId: string,
    email: string,
    roleId?: string,
    isOnboardingInvitation = false,
  ) {
    const preparedInvitation = await this.prepareWorkspaceInvitation({
      workspaceId,
      normalizedEmail: this.normalizeInvitationEmail(email),
      roleId,
      isOnboardingInvitation,
    });

    return preparedInvitation.appToken;
  }

  private normalizeInvitationEmail(email: string): string {
    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedEmail.length === 0) {
      throw new WorkspaceInvitationException(
        'Invalid email',
        WorkspaceInvitationExceptionCode.EMAIL_MISSING,
      );
    }

    return normalizedEmail;
  }

  private isInvitationTokenUsable(appToken: AppTokenEntity): boolean {
    return (
      appToken.deletedAt === null &&
      appToken.revokedAt === null &&
      appToken.expiresAt.getTime() > Date.now() &&
      Boolean(appToken.value) &&
      Boolean(appToken.context?.email)
    );
  }

  private getLegacyDeliveryStatus(
    appToken: AppTokenEntity,
  ): AppTokenDeliveryStatus {
    if (appToken.context?.deliveryStatus === AppTokenDeliveryStatus.SENT) {
      return AppTokenDeliveryStatus.SENT;
    }

    if (appToken.context?.deliveryStatus === AppTokenDeliveryStatus.FAILED) {
      return AppTokenDeliveryStatus.FAILED;
    }

    return AppTokenDeliveryStatus.UNKNOWN;
  }

  private async findActiveInvitationToken({
    manager,
    workspaceId,
    normalizedEmail,
  }: {
    manager: EntityManager;
    workspaceId: string;
    normalizedEmail: string;
  }): Promise<AppTokenEntity | null> {
    return manager
      .getRepository(AppTokenEntity)
      .createQueryBuilder('appToken')
      .where('"appToken"."workspaceId" = :workspaceId', { workspaceId })
      .andWhere('"appToken".type IN (:...types)', {
        types: INVITATION_APP_TOKEN_TYPES,
      })
      .andWhere(
        'lower(trim("appToken".context->>\'email\')) = :normalizedEmail',
        { normalizedEmail },
      )
      .andWhere('"appToken"."deletedAt" IS NULL')
      .andWhere('"appToken"."revokedAt" IS NULL')
      .andWhere('"appToken"."expiresAt" > :now', { now: new Date() })
      .orderBy(
        `CASE WHEN "appToken".context->>'deliveryStatus' = 'SENT' THEN 0 ELSE 1 END`,
        'ASC',
      )
      .addOrderBy('"appToken"."createdAt"', 'DESC')
      .getOne();
  }

  private async createInvitationTokenWithManager({
    manager,
    workspaceId,
    normalizedEmail,
    roleId,
    isOnboardingInvitation,
  }: {
    manager: EntityManager;
    workspaceId: string;
    normalizedEmail: string;
    roleId?: string;
    isOnboardingInvitation: boolean;
  }): Promise<AppTokenEntity> {
    const expiresIn = this.twentyConfigService.get(
      'INVITATION_TOKEN_EXPIRES_IN',
    );

    if (!expiresIn) {
      throw new AuthException(
        'Expiration time for invitation token is not set',
        AuthExceptionCode.INTERNAL_SERVER_ERROR,
      );
    }

    const appTokenRepository = manager.getRepository(AppTokenEntity);
    const invitationToken = appTokenRepository.create({
      workspaceId,
      expiresAt: addMilliseconds(new Date().getTime(), ms(expiresIn)),
      type: isOnboardingInvitation
        ? AppTokenType.OnboardingInvitationToken
        : AppTokenType.InvitationToken,
      value: crypto.randomBytes(32).toString('hex'),
      context: {
        email: normalizedEmail,
        ...(isDefined(roleId) ? { roleId } : {}),
      },
    });

    return appTokenRepository.save(invitationToken);
  }

  private async prepareWorkspaceInvitation({
    workspaceId,
    normalizedEmail,
    roleId,
    isOnboardingInvitation,
    preferredAppTokenId,
  }: {
    workspaceId: string;
    normalizedEmail: string;
    roleId?: string;
    isOnboardingInvitation: boolean;
    preferredAppTokenId?: string;
  }): Promise<PreparedWorkspaceInvitation> {
    return this.appTokenRepository.manager.transaction(async (manager) => {
      const appTokenRepository = manager.getRepository(AppTokenEntity);
      const stateRepository = manager.getRepository(
        WorkspaceInvitationStateEntity,
      );
      const identity = {
        workspaceId,
        normalizedEmail,
        family: WORKSPACE_INVITATION_FAMILY,
      };

      await stateRepository
        .createQueryBuilder()
        .insert()
        .values({
          ...identity,
          appTokenId: null,
          deliveryStatus: AppTokenDeliveryStatus.PENDING,
          deliveryAttemptKey: null,
          deliveryAttemptedAt: null,
          sentAt: null,
          failedAt: null,
          failureReason: null,
        })
        .orIgnore()
        .execute();

      const state = await stateRepository.findOne({
        where: identity,
        lock: { mode: 'pessimistic_write' },
      });

      if (!state) {
        throw new WorkspaceInvitationException(
          'Invitation state could not be reserved',
          WorkspaceInvitationExceptionCode.INVALID_INVITATION,
        );
      }

      let appToken: AppTokenEntity | null = null;

      if (
        state.deliveryStatus === AppTokenDeliveryStatus.DISPATCHING &&
        (state.deliveryAttemptedAt === null ||
          state.deliveryAttemptedAt.getTime() <
            Date.now() - INVITATION_DISPATCH_STALE_AFTER_MS)
      ) {
        state.deliveryStatus = AppTokenDeliveryStatus.UNKNOWN;
        state.failureReason =
          'A tentativa anterior não confirmou se o serviço aceitou o e-mail.';

        await stateRepository.save(state);
      }

      if (preferredAppTokenId) {
        const preferredAppToken = await appTokenRepository.findOne({
          where: {
            id: preferredAppTokenId,
            workspaceId,
            type: In(INVITATION_APP_TOKEN_TYPES),
          },
        });
        const preferredEmail = preferredAppToken?.context?.email;

        if (
          preferredAppToken &&
          this.isInvitationTokenUsable(preferredAppToken) &&
          preferredEmail?.trim().toLowerCase() === normalizedEmail &&
          (state.appTokenId === preferredAppToken.id ||
            state.deliveryStatus !== AppTokenDeliveryStatus.DISPATCHING)
        ) {
          appToken = preferredAppToken;

          if (state.appTokenId !== preferredAppToken.id) {
            state.appTokenId = preferredAppToken.id;
            state.deliveryStatus =
              this.getLegacyDeliveryStatus(preferredAppToken);
            state.deliveryAttemptKey = null;
            state.deliveryAttemptedAt = null;
            state.sentAt =
              state.deliveryStatus === AppTokenDeliveryStatus.SENT
                ? new Date()
                : null;
            state.failedAt = null;
            state.failureReason = null;

            await stateRepository.save(state);
          }
        }
      }

      if (!appToken && state.appTokenId) {
        appToken = await appTokenRepository.findOne({
          where: {
            id: state.appTokenId,
            workspaceId,
            type: In(INVITATION_APP_TOKEN_TYPES),
          },
        });
      }

      if (appToken && this.isInvitationTokenUsable(appToken)) {
        return { appToken, state };
      }

      const legacyAppToken = await this.findActiveInvitationToken({
        manager,
        workspaceId,
        normalizedEmail,
      });

      if (legacyAppToken) {
        state.appTokenId = legacyAppToken.id;
        state.deliveryStatus = this.getLegacyDeliveryStatus(legacyAppToken);
        state.deliveryAttemptKey = null;
        state.deliveryAttemptedAt = null;
        state.sentAt =
          state.deliveryStatus === AppTokenDeliveryStatus.SENT
            ? new Date()
            : null;
        state.failedAt = null;
        state.failureReason = null;

        await stateRepository.save(state);

        return { appToken: legacyAppToken, state };
      }

      const invitationToken = await this.createInvitationTokenWithManager({
        manager,
        workspaceId,
        normalizedEmail,
        roleId,
        isOnboardingInvitation,
      });

      state.appTokenId = invitationToken.id;
      state.deliveryStatus = AppTokenDeliveryStatus.PENDING;
      state.deliveryAttemptKey = null;
      state.deliveryAttemptedAt = null;
      state.sentAt = null;
      state.failedAt = null;
      state.failureReason = null;

      await stateRepository.save(state);

      return { appToken: invitationToken, state };
    });
  }

  private getInvitationDeliveryStateMessage(
    status: AppTokenDeliveryStatus,
    normalizedEmail: string,
  ): string {
    if (status === AppTokenDeliveryStatus.UNKNOWN) {
      return `O convite para ${normalizedEmail} está ativo, mas a entrega histórica é incerta. Verifique o recebimento ou use “Reenviar” conscientemente em Membros.`;
    }

    if (status === AppTokenDeliveryStatus.DISPATCHING) {
      return `O envio para ${normalizedEmail} já está em andamento ou aguarda reconciliação. Não reenvie automaticamente.`;
    }

    return `O estado do convite para ${normalizedEmail} mudou durante o envio. Atualize a página antes de tentar novamente.`;
  }

  private async transitionInvitationDeliveryState({
    stateId,
    appTokenId,
    attemptKey,
    fromStatus,
    toStatus,
    failureReason,
  }: {
    stateId: string;
    appTokenId: string;
    attemptKey: string;
    fromStatus: AppTokenDeliveryStatus;
    toStatus: AppTokenDeliveryStatus;
    failureReason?: string;
  }): Promise<boolean> {
    try {
      const now = new Date();
      const result = await this.workspaceInvitationStateRepository.update(
        {
          id: stateId,
          appTokenId,
          deliveryAttemptKey: attemptKey,
          deliveryStatus: fromStatus,
        },
        {
          deliveryStatus: toStatus,
          ...(toStatus === AppTokenDeliveryStatus.SENT
            ? { sentAt: now, failedAt: null, failureReason: null }
            : {}),
          ...(toStatus === AppTokenDeliveryStatus.FAILED
            ? {
                failedAt: now,
                failureReason: failureReason?.slice(0, 1_000) ?? null,
              }
            : {}),
          ...(toStatus === AppTokenDeliveryStatus.UNKNOWN
            ? {
                failureReason: failureReason?.slice(0, 1_000) ?? null,
              }
            : {}),
        },
      );

      return (result.affected ?? 0) > 0;
    } catch {
      return false;
    }
  }

  private async deliverWorkspaceInvitation({
    normalizedEmail,
    workspace,
    sender,
    roleId,
    isOnboardingInvitation,
    deliveryOptions,
  }: {
    normalizedEmail: string;
    workspace: WorkspaceEntity;
    sender: WorkspaceMemberWorkspaceEntity;
    roleId?: string;
    isOnboardingInvitation: boolean;
    deliveryOptions: InvitationDeliveryOptions;
  }): Promise<InvitationDeliveryResult> {
    const preparedInvitation = await this.prepareWorkspaceInvitation({
      workspaceId: workspace.id,
      normalizedEmail,
      roleId,
      isOnboardingInvitation,
      preferredAppTokenId: deliveryOptions.preferredAppTokenId,
    });
    const { appToken, state } = preparedInvitation;

    if (
      state.deliveryStatus === AppTokenDeliveryStatus.SENT &&
      deliveryOptions.allowExplicitResend !== true
    ) {
      return { appToken };
    }

    if (
      state.deliveryStatus === AppTokenDeliveryStatus.UNKNOWN &&
      deliveryOptions.allowExplicitResend !== true
    ) {
      return {
        error: this.getInvitationDeliveryStateMessage(
          state.deliveryStatus,
          normalizedEmail,
        ),
      };
    }

    if (state.deliveryStatus === AppTokenDeliveryStatus.DISPATCHING) {
      return {
        error: this.getInvitationDeliveryStateMessage(
          state.deliveryStatus,
          normalizedEmail,
        ),
      };
    }

    const claimableStatuses = [
      AppTokenDeliveryStatus.PENDING,
      AppTokenDeliveryStatus.FAILED,
      ...(deliveryOptions.allowExplicitResend === true
        ? [AppTokenDeliveryStatus.UNKNOWN, AppTokenDeliveryStatus.SENT]
        : []),
    ];
    const attemptKey = crypto.randomUUID();
    const claimResult = await this.workspaceInvitationStateRepository.update(
      {
        id: state.id,
        appTokenId: appToken.id,
        deliveryStatus: In(claimableStatuses),
      },
      {
        deliveryStatus: AppTokenDeliveryStatus.DISPATCHING,
        deliveryAttemptKey: attemptKey,
        deliveryAttemptedAt: new Date(),
        failedAt: null,
        failureReason: null,
      },
    );

    if ((claimResult.affected ?? 0) === 0) {
      const currentState =
        await this.workspaceInvitationStateRepository.findOne({
          where: { id: state.id },
        });

      if (
        currentState?.deliveryStatus === AppTokenDeliveryStatus.SENT &&
        deliveryOptions.allowExplicitResend !== true
      ) {
        return { appToken };
      }

      return {
        error: this.getInvitationDeliveryStateMessage(
          currentState?.deliveryStatus ?? AppTokenDeliveryStatus.UNKNOWN,
          normalizedEmail,
        ),
      };
    }

    try {
      await this.sendInvitationEmail({ appToken, workspace, sender });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'O serviço de e-mail recusou o convite.';
      const markedAsFailed = await this.transitionInvitationDeliveryState({
        stateId: state.id,
        appTokenId: appToken.id,
        attemptKey,
        fromStatus: AppTokenDeliveryStatus.DISPATCHING,
        toStatus: AppTokenDeliveryStatus.FAILED,
        failureReason: message,
      });

      return {
        error: markedAsFailed
          ? `Não foi possível enviar o convite para ${normalizedEmail}: ${message}`
          : `O envio para ${normalizedEmail} falhou, mas o estado local ficou incerto. Não reenvie automaticamente.`,
      };
    }

    const markedAsSent = await this.transitionInvitationDeliveryState({
      stateId: state.id,
      appTokenId: appToken.id,
      attemptKey,
      fromStatus: AppTokenDeliveryStatus.DISPATCHING,
      toStatus: AppTokenDeliveryStatus.SENT,
    });

    if (!markedAsSent) {
      await this.transitionInvitationDeliveryState({
        stateId: state.id,
        appTokenId: appToken.id,
        attemptKey,
        fromStatus: AppTokenDeliveryStatus.DISPATCHING,
        toStatus: AppTokenDeliveryStatus.UNKNOWN,
        failureReason:
          'O serviço aceitou o e-mail, mas a confirmação local falhou.',
      });

      return {
        error: `O serviço aceitou o convite para ${normalizedEmail}, mas a confirmação local ficou incerta. Não reenvie automaticamente.`,
      };
    }

    return { appToken };
  }

  private async sendInvitationEmail({
    appToken,
    workspace,
    sender,
  }: {
    appToken: AppTokenEntity;
    workspace: WorkspaceEntity;
    sender: WorkspaceMemberWorkspaceEntity;
  }): Promise<void> {
    const recipientEmail = appToken.context?.email;

    if (!recipientEmail) {
      throw new WorkspaceInvitationException(
        'Invalid email',
        WorkspaceInvitationExceptionCode.EMAIL_MISSING,
      );
    }

    const workspaceInviteHash = workspace.inviteHash;

    if (!workspaceInviteHash) {
      throw new WorkspaceInvitationException(
        'Workspace invite hash not found',
        WorkspaceInvitationExceptionCode.INVALID_INVITATION,
      );
    }

    if (!isDefined(sender.userEmail)) {
      throw new WorkspaceInvitationException(
        'Sender email is missing',
        WorkspaceInvitationExceptionCode.EMAIL_MISSING,
      );
    }

    const link = this.workspaceDomainsService.buildWorkspaceURL({
      workspace,
      pathname: getAppPath(AppPath.Invite, {
        workspaceInviteHash,
      }),
      searchParams: {
        inviteToken: appToken.value,
        email: recipientEmail,
      },
    });
    const logo = isDefined(workspace.logoFileId)
      ? await this.fileUrlService.signFileByIdUrl({
          fileId: workspace.logoFileId,
          workspaceId: workspace.id,
          fileFolder: FileFolder.CorePicture,
        })
      : undefined;
    const emailTemplate = SendInviteLinkEmail({
      link: link.toString(),
      workspace: {
        name: workspace.displayName,
        logo,
      },
      sender: {
        email: sender.userEmail,
        firstName: sender.name.firstName,
        lastName: sender.name.lastName,
      },
      serverUrl: this.twentyConfigService.get('SERVER_URL'),
      locale: sender.locale,
    });
    const html = await render(emailTemplate);
    const text = await render(emailTemplate, { plainText: true });
    await this.emailService.send({
      from: `${sender.name.firstName} ${sender.name.lastName} (via Diex CRM) <${this.twentyConfigService.get('EMAIL_FROM_ADDRESS')}>`,
      to: recipientEmail,
      subject: 'Convite para o Diex CRM',
      text,
      html,
    });
  }

  private async throwIfOnboardingInvitationLimitReached(
    workspaceId: string,
    requestedCount: number,
  ) {
    const maxOnboardingInvitations = this.twentyConfigService.get(
      'ONBOARDING_INVITE_TEAM_MAX_INVITES',
    );

    const existingOnboardingInvitations = await this.appTokenRepository.count({
      where: {
        workspaceId,
        type: AppTokenType.OnboardingInvitationToken,
        deletedAt: IsNull(),
      },
    });

    if (
      existingOnboardingInvitations + requestedCount >
      maxOnboardingInvitations
    ) {
      throw new WorkspaceInvitationException(
        `Onboarding invitation limit (${maxOnboardingInvitations}) reached for workspace ${workspaceId}`,
        WorkspaceInvitationExceptionCode.TOO_MANY_ONBOARDING_INVITATIONS,
      );
    }
  }

  private async throttleInvitationSending(
    workspaceId: string,
    emails: string[],
  ) {
    try {
      //limit invitation sending for specific invite emails
      await Promise.all(
        emails.map(async (email) => {
          await this.throttlerService.tokenBucketThrottleOrThrow(
            `invitation-resending-workspace:throttler:${email}`,
            1,
            this.twentyConfigService.get(
              'INVITATION_SENDING_BY_EMAIL_THROTTLE_LIMIT',
            ),
            this.twentyConfigService.get(
              'INVITATION_SENDING_BY_EMAIL_THROTTLE_TTL_IN_MS',
            ),
          );
        }),
      );

      //limit invitation sending for a specific workspace
      await this.throttlerService.tokenBucketThrottleOrThrow(
        `invitation-resending-workspace:throttler:${workspaceId}`,
        emails.length,
        this.twentyConfigService.get(
          'INVITATION_SENDING_BY_WORKSPACE_THROTTLE_LIMIT',
        ),
        this.twentyConfigService.get(
          'INVITATION_SENDING_BY_WORKSPACE_THROTTLE_TTL_IN_MS',
        ),
      );
    } catch {
      throw new WorkspaceInvitationException(
        'Workspace invitation sending rate limit exceeded.',
        WorkspaceInvitationExceptionCode.INVALID_INVITATION,
        {
          userFriendlyMessage: msg`Too many workspace invitations sent. Please try again later.`,
        },
      );
    }
  }
}
