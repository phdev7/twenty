import { BadRequestException, Injectable, Logger } from '@nestjs/common';

import { isDefined } from 'diex-shared/utils';

import { JwtTokenTypeEnum } from 'src/engine/core-modules/auth/types/jwt-token-type.enum';
import { DiexAgencyTrafficService } from 'src/engine/core-modules/diex-agency/services/diex-agency-traffic.service';
import { type MetaAdsOAuthStateJwtPayload } from 'src/engine/core-modules/diex-agency/types/meta-ads-oauth-state-jwt-payload.type';
import { DiexConfigService } from 'src/engine/core-modules/diex-config/diex-config.service';
import { JwtWrapperService } from 'src/engine/core-modules/jwt/services/jwt-wrapper.service';

const META_GRAPH_API_VERSION = 'v21.0';
const META_AUTHORIZATION_ENDPOINT = `https://www.facebook.com/${META_GRAPH_API_VERSION}/dialog/oauth`;
const META_GRAPH_BASE_URL = `https://graph.facebook.com/${META_GRAPH_API_VERSION}`;

// Reading insights needs ads_read; listing which ad accounts the person
// administers needs business_management. Nothing here grants write access to
// campaigns.
const META_OAUTH_SCOPES = ['ads_read', 'business_management'];

const STATE_JWT_EXPIRES_IN = '10m';

// Meta returns a short-lived user token from the code exchange and only tells
// us the lifetime of the long-lived one it is swapped for. Sixty days is what
// the documented exchange grants; it is stored so an expired connection can be
// reported as expired instead of failing at sync time.
const DEFAULT_LONG_LIVED_TOKEN_TTL_SECONDS = 60 * 24 * 60 * 60;

type MetaTokenExchangeResponse = {
  access_token?: string;
  expires_in?: number;
  error?: { message?: string; type?: string };
};

type MetaAdAccountsResponse = {
  data?: Array<{ id?: string; account_id?: string; name?: string }>;
  error?: { message?: string; type?: string };
};

export type MetaAdsConnectionResult = {
  connectedAccountCount: number;
  redirectWorkspaceId: string;
};

@Injectable()
export class DiexMetaAdsOAuthService {
  private readonly logger = new Logger(DiexMetaAdsOAuthService.name);

  constructor(
    private readonly diexConfigService: DiexConfigService,
    private readonly jwtWrapperService: JwtWrapperService,
    private readonly trafficService: DiexAgencyTrafficService,
  ) {}

  isEnabled(): boolean {
    return this.diexConfigService.get('META_ADS_OAUTH_ENABLED') === true;
  }

  async buildAuthorizationUrl({
    agencyId,
    userId,
    clientWorkspaceId,
    redirectWorkspaceId,
  }: {
    agencyId: string;
    userId: string;
    clientWorkspaceId: string | null;
    redirectWorkspaceId: string;
  }): Promise<string> {
    this.assertEnabledOrThrow();

    const state = await this.jwtWrapperService.signAsyncOrThrow(
      {
        sub: agencyId,
        type: JwtTokenTypeEnum.META_ADS_OAUTH_STATE,
        agencyId,
        userId,
        clientWorkspaceId,
        redirectWorkspaceId,
      } satisfies MetaAdsOAuthStateJwtPayload,
      { expiresIn: STATE_JWT_EXPIRES_IN },
    );

    const authorizationUrl = new URL(META_AUTHORIZATION_ENDPOINT);

    authorizationUrl.searchParams.set(
      'client_id',
      this.diexConfigService.get('META_ADS_APP_ID'),
    );
    authorizationUrl.searchParams.set('redirect_uri', this.getCallbackUrl());
    authorizationUrl.searchParams.set('response_type', 'code');
    authorizationUrl.searchParams.set('scope', META_OAUTH_SCOPES.join(','));
    authorizationUrl.searchParams.set('state', state);

    return authorizationUrl.toString();
  }

  async handleCallback({
    code,
    state,
  }: {
    code: string;
    state: string;
  }): Promise<MetaAdsConnectionResult> {
    this.assertEnabledOrThrow();

    const payload = await this.verifyState(state);
    const shortLivedToken = await this.exchangeCodeForToken(code);
    const longLivedToken =
      await this.exchangeForLongLivedToken(shortLivedToken);
    const adAccounts = await this.listAdAccounts(longLivedToken.accessToken);

    if (adAccounts.length === 0) {
      throw new BadRequestException(
        'A conta autorizada no Meta não administra nenhuma conta de anúncios.',
      );
    }

    for (const adAccount of adAccounts) {
      await this.trafficService.upsertMetaAdsAccount({
        agencyId: payload.agencyId,
        adAccountId: adAccount.adAccountId,
        accountName: adAccount.name,
        accessToken: longLivedToken.accessToken,
        tokenExpiresAt: longLivedToken.expiresAt,
        clientWorkspaceId: payload.clientWorkspaceId ?? undefined,
      });
    }

    return {
      connectedAccountCount: adAccounts.length,
      redirectWorkspaceId: payload.redirectWorkspaceId,
    };
  }

  // Exposed so the callback can report a rejected authorisation on the page the
  // agency started from, which is only knowable from the signed state.
  async readRedirectWorkspaceId(state: string): Promise<string> {
    const payload = await this.verifyState(state);

    return payload.redirectWorkspaceId;
  }

  private assertEnabledOrThrow(): void {
    if (!this.isEnabled()) {
      throw new BadRequestException(
        'A integração com o Meta Ads não está habilitada nesta instância.',
      );
    }
  }

  getCallbackUrl(): string {
    return new URL(
      '/auth/meta-ads/callback',
      this.diexConfigService.get('SERVER_URL'),
    ).toString();
  }

  private async verifyState(
    state: string,
  ): Promise<MetaAdsOAuthStateJwtPayload> {
    try {
      const verified = (await this.jwtWrapperService.verifyJwtToken(
        state,
      )) as MetaAdsOAuthStateJwtPayload;

      if (verified.type !== JwtTokenTypeEnum.META_ADS_OAUTH_STATE) {
        throw new Error('Wrong JWT type for Meta Ads OAuth state');
      }

      return verified;
    } catch (error) {
      this.logger.warn(
        `Rejected Meta Ads OAuth state: ${(error as Error).message ?? 'unknown reason'}`,
      );

      throw new BadRequestException(
        'A autorização do Meta expirou ou é inválida. Refaça a conexão pelo painel.',
      );
    }
  }

  private async exchangeCodeForToken(code: string): Promise<string> {
    const url = new URL(`${META_GRAPH_BASE_URL}/oauth/access_token`);

    url.searchParams.set(
      'client_id',
      this.diexConfigService.get('META_ADS_APP_ID'),
    );
    url.searchParams.set(
      'client_secret',
      this.diexConfigService.get('META_ADS_APP_SECRET'),
    );
    url.searchParams.set('redirect_uri', this.getCallbackUrl());
    url.searchParams.set('code', code);

    const response = await this.requestJson<MetaTokenExchangeResponse>(url);

    if (!isDefined(response.access_token)) {
      throw new BadRequestException(
        `O Meta recusou a troca do código de autorização: ${response.error?.message ?? 'motivo não informado'}`,
      );
    }

    return response.access_token;
  }

  private async exchangeForLongLivedToken(
    shortLivedToken: string,
  ): Promise<{ accessToken: string; expiresAt: Date }> {
    const url = new URL(`${META_GRAPH_BASE_URL}/oauth/access_token`);

    url.searchParams.set('grant_type', 'fb_exchange_token');
    url.searchParams.set(
      'client_id',
      this.diexConfigService.get('META_ADS_APP_ID'),
    );
    url.searchParams.set(
      'client_secret',
      this.diexConfigService.get('META_ADS_APP_SECRET'),
    );
    url.searchParams.set('fb_exchange_token', shortLivedToken);

    const response = await this.requestJson<MetaTokenExchangeResponse>(url);

    if (!isDefined(response.access_token)) {
      throw new BadRequestException(
        `O Meta recusou a emissão do token de longa duração: ${response.error?.message ?? 'motivo não informado'}`,
      );
    }

    const ttlSeconds =
      response.expires_in ?? DEFAULT_LONG_LIVED_TOKEN_TTL_SECONDS;

    return {
      accessToken: response.access_token,
      expiresAt: new Date(Date.now() + ttlSeconds * 1000),
    };
  }

  private async listAdAccounts(
    accessToken: string,
  ): Promise<Array<{ adAccountId: string; name: string }>> {
    const url = new URL(`${META_GRAPH_BASE_URL}/me/adaccounts`);

    url.searchParams.set('fields', 'account_id,name');
    url.searchParams.set('access_token', accessToken);

    const response = await this.requestJson<MetaAdAccountsResponse>(url);

    if (isDefined(response.error)) {
      throw new BadRequestException(
        `Não foi possível listar as contas de anúncios: ${response.error.message ?? 'motivo não informado'}`,
      );
    }

    return (response.data ?? []).flatMap((account) => {
      const adAccountId = account.account_id ?? account.id;

      if (!isDefined(adAccountId)) {
        return [];
      }

      return [{ adAccountId, name: account.name ?? adAccountId }];
    });
  }

  // The access token travels in the query string because that is the only form
  // the Graph API accepts for these endpoints. It is never logged: the error
  // path reports the Meta message, not the request URL.
  private async requestJson<T>(url: URL): Promise<T> {
    const response = await fetch(url, { method: 'GET' });
    const body = (await response.json()) as T;

    if (!response.ok) {
      this.logger.warn(
        `Meta Graph API returned ${response.status} for ${url.pathname}`,
      );
    }

    return body;
  }
}
