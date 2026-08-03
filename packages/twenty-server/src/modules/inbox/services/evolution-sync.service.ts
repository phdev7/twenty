import { Injectable, Logger } from '@nestjs/common';

import { KeyValuePairType } from 'src/engine/core-modules/key-value-pair/key-value-pair.entity';
import { KeyValuePairService } from 'src/engine/core-modules/key-value-pair/key-value-pair.service';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import {
  EVOLUTION_SYNC_MAX_BACKFILL_DAYS,
  EVOLUTION_SYNC_OVERLAP_SECONDS,
  EVOLUTION_SYNC_WATERMARK_KEY,
} from 'src/modules/inbox/constants/inbox-evolution.constants';
import { EvolutionHttpService } from 'src/modules/inbox/services/evolution-http.service';
import { EvolutionIngestionService } from 'src/modules/inbox/services/evolution-ingestion.service';
import { EvolutionProvisioningService } from 'src/modules/inbox/services/evolution-provisioning.service';
import { InboxMessageWorkspaceEntity } from 'src/modules/inbox/standard-objects/inbox-message.workspace-entity';
import { type SyncEvolutionMessagesResult } from 'src/modules/inbox/types/inbox-evolution.types';
import { normalizeEvolutionMessages } from 'src/modules/inbox/utils/evolution-payload.util';

type ProviderMessageRecord = Record<string, unknown>;

const readProviderRecords = (payload: unknown): ProviderMessageRecord[] => {
  if (typeof payload !== 'object' || payload === null) {
    return [];
  }

  const messages = (payload as { messages?: unknown }).messages;

  if (Array.isArray(messages)) {
    return messages as ProviderMessageRecord[];
  }

  const records =
    typeof messages === 'object' && messages !== null
      ? (messages as { records?: unknown }).records
      : undefined;

  return Array.isArray(records) ? (records as ProviderMessageRecord[]) : [];
};

const readRecordTimestamp = (record: ProviderMessageRecord): number => {
  const raw = record.messageTimestamp;
  const numeric = typeof raw === 'string' ? Number(raw) : raw;

  return typeof numeric === 'number' && Number.isFinite(numeric)
    ? numeric * 1_000
    : 0;
};

// The stored record and the webhook body describe the same message in
// different wrappers. Rewrapping it means the sync reuses the parser the
// webhook already uses, so LID resolution, ignored addresses and message
// types cannot drift between the two paths.
const asWebhookPayload = (
  record: ProviderMessageRecord,
  instanceName: string,
): Record<string, unknown> => ({
  event: 'messages.upsert',
  instance: instanceName,
  data: record,
});

// The provider stores every message it receives but does not always announce
// it: a chat addressed by LID goes silent on the webhook while landing in
// storage all the same. Reading storage on a schedule turns delivery into
// something the inbox can rely on, and deduplication keeps it free when the
// webhook did its job.
@Injectable()
export class EvolutionSyncService {
  private readonly logger = new Logger(EvolutionSyncService.name);

  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    private readonly keyValuePairService: KeyValuePairService,
    private readonly evolutionHttpService: EvolutionHttpService,
    private readonly evolutionProvisioningService: EvolutionProvisioningService,
    private readonly evolutionIngestionService: EvolutionIngestionService,
  ) {}

  async syncWorkspace(
    workspaceId: string,
  ): Promise<SyncEvolutionMessagesResult> {
    const configuration =
      await this.evolutionProvisioningService.resolveProvisioning(workspaceId);
    const authContext = buildSystemAuthContext(workspaceId);
    const now = Date.now();
    const oldestAllowed = now - EVOLUTION_SYNC_MAX_BACKFILL_DAYS * 86_400_000;

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const storedWatermark = await this.readWatermark(workspaceId);
        const parsedWatermark = storedWatermark
          ? Date.parse(storedWatermark)
          : Number.NaN;
        const watermark = Number.isFinite(parsedWatermark)
          ? parsedWatermark
          : Math.max(
              (await this.readNewestStoredMessageAt(workspaceId)) ??
                oldestAllowed,
              oldestAllowed,
            );
        const floor = watermark - EVOLUTION_SYNC_OVERLAP_SECONDS * 1_000;

        const { records, fetched, isProvisioned, complete } =
          await this.fetchRecordsSince({
            baseUrl: configuration.baseUrl,
            apiKey: configuration.apiKey,
            instanceName: configuration.instanceName,
            floor,
          });

        if (!isProvisioned) {
          return {
            fetched: 0,
            considered: 0,
            createdMessages: 0,
            duplicateMessages: 0,
            transcribedAudios: 0,
            watermark: new Date(watermark).toISOString(),
            message:
              'Nenhuma instância de WhatsApp conectada nesta workspace: nada a sincronizar.',
          };
        }

        let createdMessages = 0;
        let duplicateMessages = 0;
        let newestTimestamp = watermark;
        const repositories =
          await this.evolutionIngestionService.getRepositories(workspaceId);

        // Oldest first, so a conversation is created by the message that
        // actually opened it and the thread reads in the order it happened.
        for (const record of [...records].sort(
          (left, right) =>
            readRecordTimestamp(left) - readRecordTimestamp(right),
        )) {
          const [message] = normalizeEvolutionMessages(
            asWebhookPayload(record, configuration.instanceName),
          );

          if (!message) {
            continue;
          }

          const result = await this.evolutionIngestionService.ingestMessage({
            workspaceId,
            repositories,
            message,
          });

          if (result.status === 'CREATED') {
            createdMessages += 1;
          } else {
            duplicateMessages += 1;
          }

          newestTimestamp = Math.max(
            newestTimestamp,
            readRecordTimestamp(record),
          );
        }

        const nextWatermark = complete
          ? new Date(newestTimestamp).toISOString()
          : new Date(watermark).toISOString();

        if (complete) {
          await this.writeWatermark(workspaceId, nextWatermark);
        }

        return {
          fetched,
          considered: records.length,
          createdMessages,
          duplicateMessages,
          transcribedAudios: 0,
          watermark: nextWatermark,
          message: complete
            ? createdMessages > 0
              ? `${createdMessages} mensagem(ns) que o webhook não entregou foram recuperadas.`
              : 'Nenhuma mensagem pendente: o webhook está entregando.'
            : 'Lote parcial sincronizado; o watermark foi preservado para continuar o backfill com segurança.',
        };
      },
      authContext,
    );
  }

  private async readWatermark(workspaceId: string): Promise<string | null> {
    const [entry] = await this.keyValuePairService.get<string>({
      userId: null,
      workspaceId,
      type: KeyValuePairType.APPLICATION_VARIABLE,
      key: EVOLUTION_SYNC_WATERMARK_KEY,
    });
    const value = (entry as { value?: unknown } | undefined)?.value;

    return typeof value === 'string' && value.length > 0 ? value : null;
  }

  private async writeWatermark(
    workspaceId: string,
    watermark: string,
  ): Promise<void> {
    await this.keyValuePairService.set({
      userId: null,
      workspaceId,
      type: KeyValuePairType.APPLICATION_VARIABLE,
      key: EVOLUTION_SYNC_WATERMARK_KEY,
      value: watermark,
    });
  }

  // Where to resume from on a workspace that has never synced: the newest
  // message the inbox already holds. Whatever the provider stored after that
  // is exactly the gap, however long the webhook stayed quiet.
  private async readNewestStoredMessageAt(
    workspaceId: string,
  ): Promise<number | null> {
    const messageRepository =
      await this.globalWorkspaceOrmManager.getRepository<InboxMessageWorkspaceEntity>(
        workspaceId,
        InboxMessageWorkspaceEntity,
      );
    const newest = await messageRepository.findOne({
      where: {},
      order: { sentAt: 'DESC' },
      select: { sentAt: true },
    });
    const parsed = newest?.sentAt ? Date.parse(newest.sentAt) : Number.NaN;

    return Number.isFinite(parsed) ? parsed : null;
  }

  private async fetchRecordsSince({
    baseUrl,
    apiKey,
    instanceName,
    floor,
  }: {
    baseUrl: string;
    apiKey: string;
    instanceName: string;
    floor: number;
  }): Promise<{
    records: ProviderMessageRecord[];
    fetched: number;
    isProvisioned: boolean;
    complete: boolean;
  }> {
    const collected: ProviderMessageRecord[] = [];
    let fetched = 0;
    let page = 1;
    let previousPageFingerprint: string | null = null;
    let complete = false;

    while (true) {
      const response = await this.evolutionHttpService.request({
        baseUrl,
        path: `/chat/findMessages/${encodeURIComponent(instanceName)}`,
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          apikey: apiKey,
        },
        body: JSON.stringify({ page }),
      });

      if (response.status === 404) {
        // No instance for this workspace yet: nobody connected WhatsApp here.
        return {
          records: [],
          fetched: 0,
          isProvisioned: false,
          complete: true,
        };
      }

      if (!response.ok) {
        throw new Error(
          `A Evolution não devolveu o histórico de mensagens (HTTP ${response.status}).`,
        );
      }

      const records = readProviderRecords(await response.json());

      const pageFingerprint = JSON.stringify(
        records.map((record) => [
          readRecordTimestamp(record),
          record.key ?? record.id ?? record.messageId ?? null,
        ]),
      );

      if (records.length > 0 && pageFingerprint === previousPageFingerprint) {
        this.logger.warn(
          `A Evolution repetiu a página ${page}; o watermark não será avançado além do lote seguro.`,
        );
        break;
      }

      previousPageFingerprint = pageFingerprint;

      fetched += records.length;
      collected.push(
        ...records.filter((record) => readRecordTimestamp(record) >= floor),
      );

      // Records come newest first, so the first page that ends before the
      // floor is the last one worth reading.
      const reachedFloor =
        records.length === 0 ||
        records.some((record) => readRecordTimestamp(record) < floor);

      if (reachedFloor) {
        complete = true;
        break;
      }

      page += 1;
    }

    return { records: collected, fetched, isProvisioned: true, complete };
  }
}
