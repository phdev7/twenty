import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { createHash, createHmac } from 'node:crypto';

import { DataSource, type QueryRunner } from 'typeorm';

import { KeyValuePairType } from 'src/engine/core-modules/key-value-pair/key-value-pair.entity';
import { KeyValuePairService } from 'src/engine/core-modules/key-value-pair/key-value-pair.service';
import { NodeEnvironment } from 'src/engine/core-modules/twenty-config/interfaces/node-environment.interface';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import {
  EVOLUTION_ACTIVE_INSTANCE_CLAIM_KEY,
  EVOLUTION_ACTIVE_SECRET_CLAIM_KEY,
  EVOLUTION_EVENTS,
  EVOLUTION_WEBHOOK_SECRET_HEADER,
  buildEvolutionInstanceClaimKey,
  buildEvolutionSecretClaimKey,
} from 'src/modules/inbox/constants/inbox-evolution.constants';
import { EvolutionHttpService } from 'src/modules/inbox/services/evolution-http.service';
import {
  type EvolutionWebhookRegistration,
  type WhatsappConnectionResult,
  type WhatsappProvisioning,
} from 'src/modules/inbox/types/inbox-evolution.types';
import {
  hashSecret,
  normalizeEvolutionInstanceName,
} from 'src/modules/inbox/utils/evolution-payload.util';

const asString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

@Injectable()
export class EvolutionProvisioningService {
  private readonly logger = new Logger(EvolutionProvisioningService.name);

  constructor(
    private readonly twentyConfigService: TwentyConfigService,
    private readonly keyValuePairService: KeyValuePairService,
    private readonly evolutionHttpService: EvolutionHttpService,
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
  ) {}

  // The instance name has to be stable per workspace and safe for a URL path,
  // so it is derived from the workspace id rather than typed by anyone.
  private buildInstanceName(workspaceId: string): string {
    return `diex-${workspaceId
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 32)
      .toLowerCase()}`;
  }

  // Each workspace gets its own webhook secret, derived from a single server
  // secret. Deriving instead of storing means one tenant can never present
  // another tenant's secret, and nothing extra has to be kept in sync.
  private buildWebhookSecret(
    serverSecret: string,
    workspaceId: string,
  ): string {
    return createHmac('sha256', serverSecret)
      .update(`diex:whatsapp:${workspaceId}`)
      .digest('hex');
  }

  async resolveProvisioning(
    workspaceId: string,
  ): Promise<WhatsappProvisioning> {
    const serverBaseUrl = asString(
      this.twentyConfigService.get('DIEX_EVOLUTION_SERVER_BASE_URL'),
    );
    const serverApiKey = asString(
      this.twentyConfigService.get('DIEX_EVOLUTION_SERVER_API_KEY'),
    );
    const serverWebhookSecret = asString(
      this.twentyConfigService.get('DIEX_EVOLUTION_SERVER_WEBHOOK_SECRET'),
    );

    const [
      workspaceBaseUrl,
      workspaceApiKey,
      workspaceInstanceName,
      workspaceSecret,
    ] = await Promise.all([
      this.readWorkspaceApplicationVariable(workspaceId, [
        'EVOLUTION_BASE_URL',
        'DIEX_EVOLUTION_BASE_URL',
      ]),
      this.readWorkspaceApplicationVariable(workspaceId, [
        'EVOLUTION_API_KEY',
        'DIEX_EVOLUTION_API_KEY',
      ]),
      this.readWorkspaceApplicationVariable(workspaceId, [
        'EVOLUTION_INSTANCE_NAME',
        'DIEX_EVOLUTION_INSTANCE_NAME',
      ]),
      this.readWorkspaceApplicationVariable(workspaceId, [
        'EVOLUTION_WEBHOOK_SECRET',
        'DIEX_EVOLUTION_WEBHOOK_SECRET',
      ]),
    ]);
    const baseUrl = workspaceBaseUrl ?? serverBaseUrl;
    const apiKey = workspaceApiKey ?? serverApiKey;
    const instanceName =
      workspaceInstanceName ?? this.buildInstanceName(workspaceId);
    const webhookSecret =
      workspaceSecret ??
      (serverWebhookSecret
        ? this.buildWebhookSecret(serverWebhookSecret, workspaceId)
        : null);

    if (baseUrl && apiKey && webhookSecret) {
      return {
        baseUrl: this.evolutionHttpService.assertUsableOrigin(baseUrl),
        apiKey,
        instanceName: normalizeEvolutionInstanceName(instanceName),
        webhookSecret,
      };
    }

    throw new Error(
      'A integração WhatsApp não está disponível: o operador da infraestrutura precisa configurar a Evolution no servidor.',
    );
  }

  private async readWorkspaceApplicationVariable(
    workspaceId: string,
    keys: readonly string[],
  ): Promise<string | null> {
    for (const key of keys) {
      const value = await this.readWorkspaceClaim(workspaceId, key);

      if (value) {
        return value;
      }
    }

    return null;
  }

  // Evolution calls this URL from outside the deployment, so it has to be the
  // public address. A single-label hostname is a container name on some internal
  // network and the provider resolves it to nothing.
  buildWebhookUrl(): string {
    const apiUrl = (this.twentyConfigService.get('SERVER_URL') ?? '').replace(
      /\/+$/,
      '',
    );

    if (!apiUrl) {
      throw new Error('SERVER_URL não está disponível para montar o webhook.');
    }

    const { hostname } = new URL(apiUrl);

    const isLocalHost = ['localhost', '127.0.0.1', '::1'].includes(hostname);
    const isLocalEnvironment = [
      NodeEnvironment.DEVELOPMENT,
      NodeEnvironment.TEST,
    ].includes(this.twentyConfigService.get('NODE_ENV'));

    if (isLocalHost && !isLocalEnvironment) {
      throw new Error(
        'O webhook da Evolution não pode usar localhost fora de um ambiente local. Configure SERVER_URL com o endereço público.',
      );
    }

    if (hostname.split('.').length < 2 && !isLocalHost) {
      throw new Error(
        `O webhook apontaria para "${hostname}", um host que a Evolution não alcança. Configure SERVER_URL com o endereço público.`,
      );
    }

    return `${apiUrl}/rest/inbox/evolution/webhook`;
  }

  private async readClaim(
    key: string,
    queryRunner?: QueryRunner,
  ): Promise<string | null> {
    const [claim] = await this.keyValuePairService.get<string>(
      {
        userId: null,
        workspaceId: null,
        type: KeyValuePairType.APPLICATION_VARIABLE,
        key,
      },
      queryRunner,
    );

    return asString((claim as { value?: unknown } | undefined)?.value);
  }

  private async writeClaim(
    key: string,
    value: string,
    queryRunner?: QueryRunner,
  ): Promise<void> {
    await this.keyValuePairService.set(
      {
        userId: null,
        workspaceId: null,
        type: KeyValuePairType.APPLICATION_VARIABLE,
        key,
        value,
      },
      queryRunner,
    );
  }

  private async deleteClaimIfOwned(
    key: string,
    workspaceId: string,
    queryRunner: QueryRunner,
  ): Promise<void> {
    await queryRunner.query(
      `DELETE FROM core."keyValuePair"
       WHERE key = $1
         AND "userId" IS NULL
         AND "workspaceId" IS NULL
         AND "applicationId" IS NULL
         AND type = $2
         AND value = $3::jsonb`,
      [key, KeyValuePairType.APPLICATION_VARIABLE, JSON.stringify(workspaceId)],
    );
  }

  private async readWorkspaceClaim(
    workspaceId: string,
    key: string,
    queryRunner?: QueryRunner,
  ): Promise<string | null> {
    const [claim] = await this.keyValuePairService.get<string>(
      {
        userId: null,
        workspaceId,
        type: KeyValuePairType.APPLICATION_VARIABLE,
        key,
      },
      queryRunner,
    );

    return asString((claim as { value?: unknown } | undefined)?.value);
  }

  private async writeWorkspaceClaim(
    workspaceId: string,
    key: string,
    value: string,
    queryRunner?: QueryRunner,
  ): Promise<void> {
    await this.keyValuePairService.set(
      {
        userId: null,
        workspaceId,
        type: KeyValuePairType.APPLICATION_VARIABLE,
        key,
        value,
      },
      queryRunner,
    );
  }

  private async withClaimReservation<T>(
    operation: (queryRunner: QueryRunner) => Promise<T>,
  ): Promise<T> {
    const queryRunner = this.coreDataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const lockDigest = createHash('sha256')
        .update('diex:evolution:claim-reservation')
        .digest();

      await queryRunner.query('SELECT pg_advisory_xact_lock($1, $2)', [
        lockDigest.readInt32BE(0),
        lockDigest.readInt32BE(4),
      ]);

      const result = await operation(queryRunner);

      await queryRunner.commitTransaction();

      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction().catch(() => undefined);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // The webhook arrives unauthenticated from outside, carrying only its secret.
  // Resolving it to a workspace is exactly this lookup, plus the instance check
  // that stops a valid secret from being replayed against another tenant's
  // instance.
  async resolveWorkspaceIdForWebhook({
    webhookSecret,
    instanceName,
  }: {
    webhookSecret: string;
    instanceName: string;
  }): Promise<string | null> {
    const workspaceId = await this.readClaim(
      buildEvolutionSecretClaimKey(hashSecret(webhookSecret)),
    );

    if (!workspaceId) {
      return null;
    }

    const instanceWorkspaceId = await this.readClaim(
      buildEvolutionInstanceClaimKey(instanceName),
    );

    return instanceWorkspaceId === workspaceId ? workspaceId : null;
  }

  // Claiming and webhook configuration always travel together: a webhook the
  // route cannot map back to a workspace is silently dropped, and a claim with
  // no webhook behind it never receives anything. Both are idempotent so any
  // entry point can call this and end with a channel that actually delivers.
  async registerWebhook({
    workspaceId,
    configuration,
  }: {
    workspaceId: string;
    configuration: WhatsappProvisioning;
  }): Promise<EvolutionWebhookRegistration> {
    const webhookUrl = this.buildWebhookUrl();
    const secretClaimKey = buildEvolutionSecretClaimKey(
      hashSecret(configuration.webhookSecret),
    );
    const instanceClaimKey = buildEvolutionInstanceClaimKey(
      configuration.instanceName,
    );

    // The reservation covers every tenant registration. It is deliberately
    // coarse because the old active claim keys are only known after reading the
    // workspace row; the transaction keeps the read, claim and owner-checked
    // cleanup atomic across application instances.
    return this.withClaimReservation(async (queryRunner) => {
      const [previousSecretOwner, previousInstanceOwner] = await Promise.all([
        this.readClaim(secretClaimKey, queryRunner),
        this.readClaim(instanceClaimKey, queryRunner),
      ]);

      if (previousSecretOwner && previousSecretOwner !== workspaceId) {
        throw new Error(
          'Este segredo de webhook da Evolution já pertence a outra workspace.',
        );
      }

      if (previousInstanceOwner && previousInstanceOwner !== workspaceId) {
        throw new Error(
          'Esta instância da Evolution já pertence a outra workspace.',
        );
      }

      const [previousActiveSecretClaim, previousActiveInstanceClaim] =
        await Promise.all([
          this.readWorkspaceClaim(
            workspaceId,
            EVOLUTION_ACTIVE_SECRET_CLAIM_KEY,
            queryRunner,
          ),
          this.readWorkspaceClaim(
            workspaceId,
            EVOLUTION_ACTIVE_INSTANCE_CLAIM_KEY,
            queryRunner,
          ),
        ]);

      await this.writeClaim(secretClaimKey, workspaceId, queryRunner);
      await this.writeClaim(instanceClaimKey, workspaceId, queryRunner);

      const response = await this.postWebhookConfiguration({
        ...configuration,
        webhookUrl,
      });

      if (!response.ok) {
        throw new Error(
          `A Evolution recusou a configuração do webhook (${response.status}).`,
        );
      }

      await this.writeWorkspaceClaim(
        workspaceId,
        EVOLUTION_ACTIVE_SECRET_CLAIM_KEY,
        secretClaimKey,
        queryRunner,
      );
      await this.writeWorkspaceClaim(
        workspaceId,
        EVOLUTION_ACTIVE_INSTANCE_CLAIM_KEY,
        instanceClaimKey,
        queryRunner,
      );

      if (
        previousActiveSecretClaim &&
        previousActiveSecretClaim !== secretClaimKey
      ) {
        await this.deleteClaimIfOwned(
          previousActiveSecretClaim,
          workspaceId,
          queryRunner,
        );
      }

      if (
        previousActiveInstanceClaim &&
        previousActiveInstanceClaim !== instanceClaimKey
      ) {
        await this.deleteClaimIfOwned(
          previousActiveInstanceClaim,
          workspaceId,
          queryRunner,
        );
      }

      return {
        configured: true,
        instanceName: configuration.instanceName,
        webhookUrl,
        providerStatus: response.status,
        events: EVOLUTION_EVENTS,
      };
    });
  }

  private async postWebhookConfiguration({
    baseUrl,
    instanceName,
    apiKey,
    webhookSecret,
    webhookUrl,
  }: WhatsappProvisioning & { webhookUrl: string }): Promise<Response> {
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      apikey: apiKey,
    };
    const webhookHeaders = {
      [EVOLUTION_WEBHOOK_SECRET_HEADER]: webhookSecret,
    };
    const response = await this.evolutionHttpService.request({
      baseUrl,
      path: `/webhook/set/${encodeURIComponent(instanceName)}`,
      method: 'POST',
      headers,
      body: JSON.stringify({
        webhook: {
          enabled: true,
          url: webhookUrl,
          byEvents: false,
          base64: true,
          events: EVOLUTION_EVENTS,
          headers: webhookHeaders,
        },
      }),
    });

    if (response.status !== 400) {
      return response;
    }

    return this.evolutionHttpService.request({
      baseUrl,
      path: `/webhook/set/${encodeURIComponent(instanceName)}`,
      method: 'POST',
      headers,
      body: JSON.stringify({
        enabled: true,
        url: webhookUrl,
        webhookByEvents: false,
        webhookBase64: true,
        base64: true,
        events: EVOLUTION_EVENTS,
        headers: webhookHeaders,
      }),
    });
  }

  assertPayloadMatchesInstance({
    payloadInstanceName,
    configuration,
  }: {
    payloadInstanceName: string | null;
    configuration: WhatsappProvisioning;
  }): void {
    if (
      !payloadInstanceName ||
      normalizeEvolutionInstanceName(payloadInstanceName) !==
        normalizeEvolutionInstanceName(configuration.instanceName)
    ) {
      throw new Error(
        'O payload da Evolution não corresponde à instância desta workspace.',
      );
    }
  }

  // One Evolution instance per workspace, provisioned on demand from the
  // settings page. The workspace admin never handles the provider API key: they
  // scan a QR and the inbox starts receiving.
  async resolveConnection(
    workspaceId: string,
  ): Promise<WhatsappConnectionResult> {
    const configuration = await this.resolveProvisioning(workspaceId);
    const { baseUrl, instanceName, apiKey, webhookSecret } = configuration;
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      apikey: apiKey,
    };
    // An instance created before this workspace claimed it, or one whose webhook
    // was configured against a stale address, delivers nothing. Re-registering on
    // every call keeps scanning the QR enough to get a working inbox.
    const ensureWebhookRegistration = async (): Promise<string | null> => {
      try {
        await this.registerWebhook({ workspaceId, configuration });

        return null;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'A configuração do webhook da Evolution falhou.';

        this.logger.warn(
          `Evolution webhook registration failed for workspace ${workspaceId}: ${message}`,
        );

        return message;
      }
    };

    const stateResponse = await this.evolutionHttpService.request({
      baseUrl,
      path: `/instance/connectionState/${encodeURIComponent(instanceName)}`,
      method: 'GET',
      headers,
    });

    if (stateResponse.ok) {
      const payload = await this.readJson(stateResponse);

      if (this.readConnectionState(payload) === 'open') {
        const registrationError = await ensureWebhookRegistration();

        return {
          state: 'CONNECTED',
          instanceName,
          phone: null,
          qrCodeDataUri: null,
          message: registrationError
            ? `WhatsApp conectado, mas o webhook não pôde ser configurado: ${registrationError}`
            : 'WhatsApp conectado. As mensagens chegam no Inbox Comercial.',
        };
      }
    }

    if (stateResponse.status === 404) {
      const createResponse = await this.evolutionHttpService.request({
        baseUrl,
        path: '/instance/create',
        method: 'POST',
        headers,
        body: JSON.stringify({
          instanceName,
          qrcode: true,
          integration: 'WHATSAPP-BAILEYS',
          webhook: {
            enabled: true,
            url: this.buildWebhookUrl(),
            byEvents: false,
            base64: true,
            events: EVOLUTION_EVENTS,
            headers: { [EVOLUTION_WEBHOOK_SECRET_HEADER]: webhookSecret },
          },
        }),
      });

      if (!createResponse.ok) {
        return {
          state: 'UNAVAILABLE',
          instanceName,
          phone: null,
          qrCodeDataUri: null,
          message: `Não foi possível criar a instância na Evolution (HTTP ${createResponse.status}).`,
        };
      }

      const qrCodeDataUri = this.extractQrCode(
        await this.readJson(createResponse),
      );

      await ensureWebhookRegistration();

      return {
        state: qrCodeDataUri ? 'AWAITING_SCAN' : 'CONNECTING',
        instanceName,
        phone: null,
        qrCodeDataUri,
        message: qrCodeDataUri
          ? 'Leia o código no WhatsApp do número comercial para conectar.'
          : 'Instância criada. Atualize em alguns segundos para obter o código.',
      };
    }

    const connectResponse = await this.evolutionHttpService.request({
      baseUrl,
      path: `/instance/connect/${encodeURIComponent(instanceName)}`,
      method: 'GET',
      headers,
    });

    if (!connectResponse.ok) {
      return {
        state: 'UNAVAILABLE',
        instanceName,
        phone: null,
        qrCodeDataUri: null,
        message: `A Evolution não respondeu ao pedido de conexão (HTTP ${connectResponse.status}).`,
      };
    }

    const qrCodeDataUri = this.extractQrCode(
      await this.readJson(connectResponse),
    );

    await ensureWebhookRegistration();

    return {
      state: qrCodeDataUri ? 'AWAITING_SCAN' : 'CONNECTING',
      instanceName,
      phone: null,
      qrCodeDataUri,
      message: qrCodeDataUri
        ? 'Leia o código no WhatsApp do número comercial para conectar.'
        : 'Conexão em andamento. Atualize em alguns segundos.',
    };
  }

  private async readJson(response: Response): Promise<Record<string, unknown>> {
    try {
      return (await response.json()) as Record<string, unknown>;
    } catch {
      return {};
    }
  }

  private extractQrCode(payload: Record<string, unknown>): string | null {
    const direct = asString(payload.base64);

    if (direct) {
      return direct.startsWith('data:')
        ? direct
        : `data:image/png;base64,${direct}`;
    }

    const nested = payload.qrcode;

    if (nested && typeof nested === 'object') {
      const base64 = asString((nested as Record<string, unknown>).base64);

      if (base64) {
        return base64.startsWith('data:')
          ? base64
          : `data:image/png;base64,${base64}`;
      }
    }

    return null;
  }

  private readConnectionState(payload: Record<string, unknown>): string | null {
    const instance = payload.instance;

    if (instance && typeof instance === 'object') {
      return asString((instance as Record<string, unknown>).state);
    }

    return asString(payload.state);
  }
}
