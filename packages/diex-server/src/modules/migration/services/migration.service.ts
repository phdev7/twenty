import { BadRequestException, Injectable } from '@nestjs/common';

import { KeyValuePairType } from 'src/engine/core-modules/key-value-pair/key-value-pair.entity';
import { KeyValuePairService } from 'src/engine/core-modules/key-value-pair/key-value-pair.service';
import { GlobalWorkspaceOrmManager } from 'src/engine/diex-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/diex-orm/utils/build-system-auth-context.util';
import {
  DIEX_MIGRATION_BATCH_SIZE,
  DIEX_MIGRATION_ENTITIES,
  DIEX_MIGRATION_SOURCE_TEAM_CLAIM_KEY,
  type DiexMigrationEntity,
} from 'src/modules/migration/constants/migration.constants';

type JsonRecord = Record<string, unknown>;
type MigratableWorkspaceEntity = JsonRecord & {
  id: string;
  legacyDiexId?: string | null;
};

export type MigrationResult = {
  previewOnly: boolean;
  sourceTeamId: string;
  entity: DiexMigrationEntity;
  received: number;
  creates: number;
  updates: number;
  skipped: number;
  unresolvedRelations: number;
  errors: Array<{ legacyId: string; message: string }>;
  message: string;
};

const isJsonRecord = (value: unknown): value is JsonRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readString = (
  record: JsonRecord,
  key: string,
  maximumLength = 10_000,
): string | undefined => {
  const value = record[key];
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim();

  return normalized ? normalized.slice(0, maximumLength) : undefined;
};

const readNumber = (
  record: JsonRecord,
  key: string,
  minimum = Number.NEGATIVE_INFINITY,
  maximum = Number.POSITIVE_INFINITY,
): number | undefined => {
  const value = record[key];
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim()
        ? Number(value)
        : Number.NaN;

  return Number.isFinite(parsed)
    ? Math.min(maximum, Math.max(minimum, parsed))
    : undefined;
};

const readBoolean = (record: JsonRecord, key: string): boolean | undefined => {
  const value = record[key];
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === 1 || value === '1') return true;
  if (value === 'false' || value === 0 || value === '0') return false;

  return undefined;
};

const readDate = (record: JsonRecord, key: string): Date | undefined => {
  const value = readString(record, key, 80);
  if (!value) return undefined;
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? undefined : date;
};

const readLegacyId = (record: JsonRecord): string => {
  const value =
    readString(record, 'legacyId', 120) ?? readString(record, 'id', 120);
  if (!value || !/^[a-zA-Z0-9:_-]{6,120}$/.test(value)) {
    throw new BadRequestException('A valid legacyId is required.');
  }

  return value;
};

const splitName = (value: string) => {
  const [firstName, ...rest] = value.trim().split(/\s+/);

  return { firstName: firstName || 'Contato legado', lastName: rest.join(' ') };
};

const phone = (value?: string) => {
  const normalized = value?.replace(/\D/g, '');

  return normalized && normalized.length >= 8 && normalized.length <= 15
    ? {
        primaryPhoneNumber: `+${normalized}`,
        primaryPhoneCountryCode: '',
        primaryPhoneCallingCode: '',
        additionalPhones: null,
      }
    : undefined;
};

@Injectable()
export class MigrationService {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    private readonly keyValuePairService: KeyValuePairService,
  ) {}

  async importBatch(input: {
    workspaceId: string;
    sourceTeamId: string;
    entity: string;
    records: unknown;
    confirmImport: boolean;
  }): Promise<MigrationResult> {
    const sourceTeamId = input.sourceTeamId.trim();
    const entity = input.entity as DiexMigrationEntity;
    if (!/^[0-9A-HJKMNP-TV-Z]{26}$/i.test(sourceTeamId)) {
      throw new BadRequestException(
        'A valid source Diex team ULID is required.',
      );
    }
    if (!DIEX_MIGRATION_ENTITIES.includes(entity)) {
      throw new BadRequestException('Unsupported migration entity.');
    }
    const records = input.records;
    if (
      !Array.isArray(records) ||
      records.length === 0 ||
      records.length > DIEX_MIGRATION_BATCH_SIZE
    ) {
      throw new BadRequestException(
        `Migration batches must contain between 1 and ${DIEX_MIGRATION_BATCH_SIZE} records.`,
      );
    }
    if (!records.every(isJsonRecord)) {
      throw new BadRequestException(
        'Every migration record must be a JSON object.',
      );
    }

    const authContext = buildSystemAuthContext(input.workspaceId);
    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const claim = await this.keyValuePairService.get({
          userId: null,
          workspaceId: input.workspaceId,
          type: KeyValuePairType.USER_VARIABLE,
          key: DIEX_MIGRATION_SOURCE_TEAM_CLAIM_KEY,
        });
        const existingSourceTeamId = (
          claim[0] as { value?: unknown } | undefined
        )?.value;
        if (
          typeof existingSourceTeamId === 'string' &&
          existingSourceTeamId !== sourceTeamId
        ) {
          throw new BadRequestException(
            'This workspace is already bound to a different legacy Diex team.',
          );
        }
        if (input.confirmImport && !existingSourceTeamId) {
          await this.keyValuePairService.set({
            userId: null,
            workspaceId: input.workspaceId,
            key: DIEX_MIGRATION_SOURCE_TEAM_CLAIM_KEY,
            value: sourceTeamId,
            type: KeyValuePairType.USER_VARIABLE,
          });
        }

        const result: MigrationResult = {
          previewOnly: !input.confirmImport,
          sourceTeamId,
          entity,
          received: records.length,
          creates: 0,
          updates: 0,
          skipped: 0,
          unresolvedRelations: 0,
          errors: [],
          message: '',
        };

        for (const record of records) {
          const legacyId = (() => {
            try {
              return readLegacyId(record);
            } catch {
              return 'unknown';
            }
          })();
          try {
            const outcome = await this.upsertRecord(
              input.workspaceId,
              entity,
              record,
              input.confirmImport,
            );
            if (outcome === 'create') result.creates += 1;
            if (outcome === 'update') result.updates += 1;
            if (outcome === 'skip') result.skipped += 1;
          } catch (error) {
            result.skipped += 1;
            result.errors.push({
              legacyId,
              message:
                error instanceof Error
                  ? error.message.slice(0, 500)
                  : 'Unknown import error.',
            });
          }
        }
        result.message = result.previewOnly
          ? 'Preview completed. No record was written.'
          : 'Confirmed batch imported idempotently. Re-running the same batch updates instead of duplicating records.';

        return result;
      },
      authContext,
    );
  }

  private async upsertRecord(
    workspaceId: string,
    entity: DiexMigrationEntity,
    record: JsonRecord,
    write: boolean,
  ): Promise<'create' | 'update' | 'skip'> {
    const legacyDiexId = readLegacyId(record);
    const definitions: Record<
      DiexMigrationEntity,
      { name: string; map: (record: JsonRecord) => JsonRecord }
    > = {
      companies: {
        name: 'company',
        map: (value) => ({
          name: readString(value, 'name') ?? 'Empresa legada',
          diexSegment: readString(value, 'segment'),
          diexNiche: readString(value, 'niche'),
          diexLifecycle: readString(value, 'lifecycle'),
          icpFit: readString(value, 'icpFit'),
          legacyDiexId,
        }),
      },
      people: {
        name: 'person',
        map: (value) => ({
          name: splitName(
            readString(value, 'name') ??
              `${readString(value, 'firstName') ?? ''} ${readString(value, 'lastName') ?? ''}`,
          ),
          emails: readString(value, 'email')
            ? { primaryEmail: readString(value, 'email') }
            : undefined,
          phone: readString(value, 'phone'),
          phones: phone(readString(value, 'phone')),
          companyId: readString(value, 'companyId'),
          legacyDiexId,
        }),
      },
      offers: {
        name: 'offer',
        map: (value) => ({
          name: readString(value, 'name') ?? 'Oferta legada',
          status: readString(value, 'status'),
          pricingModel: readString(value, 'pricingModel'),
          legacyDiexId,
        }),
      },
      opportunities: {
        name: 'opportunity',
        map: (value) => ({
          name: readString(value, 'name') ?? 'Oportunidade legada',
          stage: readString(value, 'stage') ?? 'NEW',
          closeDate: readDate(value, 'closeDate'),
          companyId: readString(value, 'companyId'),
          legacyDiexId,
        }),
      },
      tasks: {
        name: 'task',
        map: (value) => ({
          title:
            readString(value, 'title') ??
            readString(value, 'name') ??
            'Tarefa legada',
          status: readString(value, 'status') ?? 'TODO',
          dueAt: readDate(value, 'dueAt'),
          legacyDiexId,
        }),
      },
      notes: {
        name: 'note',
        map: (value) => ({
          title: readString(value, 'title') ?? 'Nota legada',
          bodyV2: {
            markdown:
              readString(value, 'body') ?? readString(value, 'content') ?? '',
            blocknote: null,
          },
          legacyDiexId,
        }),
      },
      successPlans: {
        name: 'successPlan',
        map: (value) => ({
          name: readString(value, 'name') ?? 'Plano de sucesso legado',
          lifecycle: readString(value, 'lifecycle'),
          health: readString(value, 'health'),
          healthScore: readNumber(value, 'healthScore', 0, 100),
          renewalDate: readDate(value, 'renewalDate'),
          companyId: readString(value, 'companyId'),
          opportunityId: readString(value, 'opportunityId'),
          legacyDiexId,
        }),
      },
      successMilestones: {
        name: 'successMilestone',
        map: (value) => ({
          name: readString(value, 'name') ?? 'Marco legado',
          category: readString(value, 'category'),
          status: readString(value, 'status'),
          dueAt: readDate(value, 'dueAt'),
          successPlanId: readString(value, 'successPlanId'),
          legacyDiexId,
        }),
      },
      commercialSignals: {
        name: 'commercialSignal',
        map: (value) => ({
          name: readString(value, 'name') ?? 'Sinal comercial legado',
          signalType: readString(value, 'signalType') ?? 'INTENT',
          source: readString(value, 'source') ?? 'MANUAL',
          status: readString(value, 'status') ?? 'NEW',
          strength: readString(value, 'strength'),
          confidence: readNumber(value, 'confidence', 0, 100),
          capturedAt: readDate(value, 'capturedAt'),
          companyId: readString(value, 'companyId'),
          opportunityId: readString(value, 'opportunityId'),
          legacyDiexId,
        }),
      },
      customerRenewals: {
        name: 'customerRenewal',
        map: (value) => ({
          name: readString(value, 'name') ?? 'Renovação legada',
          stage: readString(value, 'stage') ?? 'PLANNING',
          risk: readString(value, 'risk') ?? 'MEDIUM',
          forecast: readString(value, 'forecast') ?? 'PIPELINE',
          targetDate: readDate(value, 'targetDate'),
          nextAction: readString(value, 'nextAction'),
          companyId: readString(value, 'companyId'),
          successPlanId: readString(value, 'successPlanId'),
          legacyDiexId,
        }),
      },
      inboxConversations: {
        name: 'inboxConversation',
        map: (value) => ({
          name: readString(value, 'name') ?? 'Conversa legada',
          channel: readString(value, 'channel') ?? 'WHATSAPP',
          provider: readString(value, 'provider'),
          status: readString(value, 'status') ?? 'OPEN',
          priority: readString(value, 'priority') ?? 'NORMAL',
          contactHandle: readString(value, 'contactHandle'),
          companyId: readString(value, 'companyId'),
          legacyDiexId,
        }),
      },
      inboxMessages: {
        name: 'inboxMessage',
        map: (value) => ({
          name: readString(value, 'name') ?? 'Mensagem legada',
          body: readString(value, 'body') ?? '',
          direction: readString(value, 'direction') ?? 'INBOUND',
          messageType: readString(value, 'messageType') ?? 'TEXT',
          inboxConversationId: readString(value, 'inboxConversationId'),
          legacyDiexId,
        }),
      },
      aiActions: {
        name: 'aiAction',
        map: (value) => ({
          name: readString(value, 'name') ?? 'Ação de IA legada',
          actionType: readString(value, 'actionType') ?? 'QUALIFY',
          status: readString(value, 'status') ?? 'PENDING_APPROVAL',
          confidence: readNumber(value, 'confidence', 0, 100),
          rationale: {
            markdown: readString(value, 'rationale') ?? '',
            blocknote: null,
          },
          proposedAction: {
            markdown: readString(value, 'proposedAction') ?? '',
            blocknote: null,
          },
          requiresApproval: readBoolean(value, 'requiresApproval') ?? true,
          legacyDiexId,
        }),
      },
    };
    const definition = definitions[entity];
    const repository =
      await this.globalWorkspaceOrmManager.getRepository<MigratableWorkspaceEntity>(
        workspaceId,
        definition.name,
        { shouldBypassPermissionChecks: true },
      );
    const existing = await repository.findOne({
      where: { legacyDiexId },
    } as never);
    if (!write) return existing ? 'update' : 'create';
    const data = definition.map(record);
    if (existing) {
      await repository.update(existing.id, data as never);
      return 'update';
    }
    await repository.save(repository.create(data as never));
    return 'create';
  }
}
