import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Query,
  Res,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { type Response } from 'express';
import { isDefined } from 'diex-shared/utils';
import { Repository } from 'typeorm';

import { RestApiExceptionFilter } from 'src/engine/api/rest/rest-api-exception.filter';
import { TransientTokenService } from 'src/engine/core-modules/auth/token/services/transient-token.service';
import { DiexAgencyService } from 'src/engine/core-modules/diex-agency/services/diex-agency.service';
import { DiexMetaAdsOAuthService } from 'src/engine/core-modules/diex-agency/services/diex-meta-ads-oauth.service';
import { WorkspaceDomainsService } from 'src/engine/core-modules/domain/workspace-domains/services/workspace-domains.service';
import { UserEntity } from 'src/engine/core-modules/user/user.entity';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { PublicEndpointGuard } from 'src/engine/guards/public-endpoint.guard';

const META_ADS_PAGE_PATHNAME = '/agency/meta-ads';

// Both endpoints are reached by a full browser navigation, which carries no
// Authorization header. The start endpoint therefore authenticates with a
// transient token minted by the front, the same way the Google APIs flow does,
// and the callback authenticates with the signed state it gets back from Meta.
@Controller('auth/meta-ads')
@UseFilters(RestApiExceptionFilter)
@UseGuards(PublicEndpointGuard, NoPermissionGuard)
export class DiexMetaAdsAuthController {
  constructor(
    private readonly metaAdsOAuthService: DiexMetaAdsOAuthService,
    private readonly agencyService: DiexAgencyService,
    private readonly transientTokenService: TransientTokenService,
    private readonly workspaceDomainsService: WorkspaceDomainsService,
    // eslint-disable-next-line diex/prefer-workspace-scoped-repository
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  @Get()
  async startMetaAdsOAuth(
    @Res() res: Response,
    @Query('transientToken') transientToken?: string,
    @Query('agencyId') agencyId?: string,
    @Query('clientWorkspaceId') clientWorkspaceId?: string,
  ) {
    if (!isDefined(transientToken)) {
      throw new BadRequestException(
        'A conexão com o Meta precisa ser iniciada pelo painel da agência.',
      );
    }

    const { userId, workspaceId } =
      await this.transientTokenService.verifyTransientToken(transientToken);

    if (!isDefined(workspaceId)) {
      throw new BadRequestException(
        'A sessão usada para iniciar a conexão não está vinculada a um workspace.',
      );
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: { id: true, canAccessFullAdminPanel: true },
    });

    if (!isDefined(user)) {
      throw new NotFoundException('Usuário da sessão não encontrado.');
    }

    const targetAgencyId =
      await this.agencyService.resolveAgencyIdForCallerOrThrow(user, agencyId);

    if (isDefined(clientWorkspaceId)) {
      await this.agencyService.assertCallerCanAccessClientWorkspaceOrThrow(
        user,
        clientWorkspaceId,
      );
    }

    const authorizationUrl =
      await this.metaAdsOAuthService.buildAuthorizationUrl({
        agencyId: targetAgencyId,
        userId: user.id,
        clientWorkspaceId: clientWorkspaceId ?? null,
        redirectWorkspaceId: workspaceId,
      });

    return res.redirect(authorizationUrl);
  }

  @Get('callback')
  async metaAdsOAuthCallback(
    @Res() res: Response,
    @Query('code') code?: string,
    @Query('state') state?: string,
    @Query('error_description') errorDescription?: string,
  ) {
    if (!isDefined(state)) {
      throw new BadRequestException(
        'O Meta não devolveu o parâmetro de estado da autorização.',
      );
    }

    // The person declined the dialog, or Meta refused it. Reported back on the
    // page the agency started from rather than as a bare server error.
    if (!isDefined(code)) {
      const redirectWorkspaceId =
        await this.metaAdsOAuthService.readRedirectWorkspaceId(state);

      return res.redirect(
        await this.buildRedirectUrl(redirectWorkspaceId, {
          metaAdsError:
            errorDescription ?? 'A autorização no Meta não foi concluída.',
        }),
      );
    }

    const result = await this.metaAdsOAuthService.handleCallback({
      code,
      state,
    });

    return res.redirect(
      await this.buildRedirectUrl(result.redirectWorkspaceId, {
        metaAdsConnected: String(result.connectedAccountCount),
      }),
    );
  }

  private async buildRedirectUrl(
    workspaceId: string,
    searchParams: Record<string, string>,
  ): Promise<string> {
    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException(
        'O workspace de origem da conexão não foi encontrado.',
      );
    }

    return this.workspaceDomainsService
      .buildWorkspaceURL({
        workspace,
        pathname: META_ADS_PAGE_PATHNAME,
        searchParams,
      })
      .toString();
  }
}
