import { CoreApiClient } from 'twenty-client-sdk/core';
import { MetadataApiClient } from 'twenty-client-sdk/metadata';
import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { WhatsAppConsentStatus } from 'src/fields/person-whatsapp-consent-status.field';
import {
  DIEX_MIGRATION_BATCH_SIZE,
  DIEX_MIGRATION_ENTITIES,
  DIEX_MIGRATION_IMPORT_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  DIEX_MIGRATION_IMPORT_ROUTE,
  DIEX_MIGRATION_SOURCE_TEAM_CLAIM_KEY,
  type DiexMigrationEntity,
} from 'src/modules/migration/constants/migration.constants';
import {
  InboxConversationChannel,
  InboxConversationPriority,
  InboxConversationProvider,
  InboxConversationStatus,
  InboxMessageDirection,
} from 'src/modules/inbox/objects/inbox-conversation.object';
import {
  InboxMessageDeliveryStatus,
  InboxMessageType,
} from 'src/modules/inbox/objects/inbox-message.object';
import { AiActionStatus, AiActionType } from 'src/objects/ai-action.object';
import {
  CommercialSignalSource,
  CommercialSignalStatus,
  CommercialSignalType,
} from 'src/objects/commercial-signal.object';
import { OfferPricingModel, OfferStatus } from 'src/objects/offer.object';
import {
  SuccessMilestoneCategory,
  SuccessMilestoneStatus,
} from 'src/objects/success-milestone.object';
import {
  SuccessHealth,
  SuccessLifecycle,
} from 'src/objects/success-plan.object';
import { appKeyValue } from 'src/utils/app-key-value';

type MigrationRequest = {
  sourceTeamId?: unknown;
  entity?: unknown;
  records?: unknown;
  confirmImport?: unknown;
};

type MigrationAction = 'create' | 'update' | 'skip';

type RecordOutcome = {
  action: MigrationAction;
  unresolvedRelations?: string[];
};

type MigrationError = {
  legacyId: string;
  message: string;
};

type MigrationResult = {
  previewOnly: boolean;
  sourceTeamId: string;
  entity: DiexMigrationEntity;
  received: number;
  creates: number;
  updates: number;
  skipped: number;
  unresolvedRelations: number;
  errors: MigrationError[];
  message: string;
};

type JsonRecord = Record<string, unknown>;

type Connection<TNode> = {
  edges?: Array<{ node?: TNode | null } | null> | null;
};

const getFirstNode = <TNode>(
  connection: Connection<TNode> | null | undefined,
): TNode | null =>
  connection?.edges
    ?.map((edge) => edge?.node)
    .find((node): node is TNode => node !== null && node !== undefined) ?? null;

const isJsonRecord = (value: unknown): value is JsonRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readString = (
  record: JsonRecord,
  key: string,
  maximumLength = 10_000,
): string | undefined => {
  const value = record[key];

  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim();

  return normalized ? normalized.slice(0, maximumLength) : undefined;
};

const readNumber = (
  record: JsonRecord,
  key: string,
  minimum: number,
  maximum: number,
): number | undefined => {
  const value = record[key];
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim()
        ? Number(value)
        : Number.NaN;

  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  return Math.min(maximum, Math.max(minimum, parsed));
};

const readBoolean = (record: JsonRecord, key: string): boolean | undefined => {
  const value = record[key];

  if (typeof value === 'boolean') {
    return value;
  }

  if (value === 'true' || value === 1 || value === '1') {
    return true;
  }

  if (value === 'false' || value === 0 || value === '0') {
    return false;
  }

  return undefined;
};

const readDate = (record: JsonRecord, key: string): string | undefined => {
  const value = readString(record, key, 80);

  if (!value) {
    return undefined;
  }

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
};

const readDateOnly = (record: JsonRecord, key: string): string | undefined =>
  readDate(record, key)?.slice(0, 10);

const readLegacyId = (record: JsonRecord): string => {
  const value =
    readString(record, 'legacyId', 80) ?? readString(record, 'id', 80);

  if (!value || !/^[a-zA-Z0-9:_-]{6,120}$/.test(value)) {
    throw new Error('A valid legacyId is required.');
  }

  return value;
};

const readOptionalLegacyId = (
  record: JsonRecord,
  key: string,
): string | undefined => {
  const value = readString(record, key, 120);

  return value && /^[a-zA-Z0-9:_-]{6,120}$/.test(value) ? value : undefined;
};

const splitName = (
  fullName: string,
): { firstName: string; lastName: string } => {
  const normalized = fullName.trim() || 'Contato legado';
  const [firstName, ...lastNameParts] = normalized.split(/\s+/);

  return {
    firstName: firstName || 'Contato',
    lastName: lastNameParts.join(' '),
  };
};

const normalizePhone = (phone: string | undefined): string | undefined => {
  const digits = phone?.replace(/\D/g, '');

  return digits && digits.length >= 8 && digits.length <= 15
    ? digits
    : undefined;
};

const buildPhoneValue = (normalizedPhone: string) => ({
  primaryPhoneNumber: `+${normalizedPhone}`,
  primaryPhoneCountryCode: '',
  primaryPhoneCallingCode: '',
  additionalPhones: null,
});

const buildAddress = (city: string | undefined, state: string | undefined) =>
  city || state
    ? {
        addressStreet1: '',
        addressStreet2: '',
        addressCity: city ?? '',
        addressPostcode: '',
        addressState: state ?? '',
        addressCountry: 'Brasil',
        addressLat: null,
        addressLng: null,
      }
    : undefined;

const normalizeDomain = (value: string | undefined): string | undefined => {
  if (!value) {
    return undefined;
  }

  try {
    const url = value.includes('://')
      ? new URL(value)
      : new URL(`https://${value}`);

    return url.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return undefined;
  }
};

const richText = (value: string | undefined) =>
  value
    ? {
        markdown: value,
        blocknote: null,
      }
    : undefined;

const combineText = (parts: Array<string | undefined>): string | undefined => {
  const value = parts
    .filter((part): part is string => Boolean(part))
    .join('\n\n');

  return value || undefined;
};

const sanitizeMetadata = (value: unknown): JsonRecord | undefined => {
  if (!isJsonRecord(value)) {
    return undefined;
  }

  const sanitized: JsonRecord = {};

  for (const [key, entry] of Object.entries(value)) {
    if (
      /(token|secret|password|credential|authorization|api.?key|provider.?payload|raw.?payload)/i.test(
        key,
      )
    ) {
      continue;
    }

    if (
      entry === null ||
      typeof entry === 'boolean' ||
      typeof entry === 'number'
    ) {
      sanitized[key] = entry;
    } else if (typeof entry === 'string') {
      sanitized[key] = entry.slice(0, 2_000);
    } else if (Array.isArray(entry)) {
      sanitized[key] = entry
        .filter(
          (item) =>
            item === null ||
            typeof item === 'boolean' ||
            typeof item === 'number' ||
            typeof item === 'string',
        )
        .slice(0, 50);
    }
  }

  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
};

const mapConsentStatus = (value: string | undefined): WhatsAppConsentStatus => {
  const normalized = value?.toLowerCase();

  if (
    normalized === 'opted_in' ||
    normalized === 'subscribed' ||
    normalized === 'granted' ||
    normalized === 'consented'
  ) {
    return WhatsAppConsentStatus.OPTED_IN;
  }

  if (
    normalized === 'opted_out' ||
    normalized === 'unsubscribed' ||
    normalized === 'revoked' ||
    normalized === 'blocked'
  ) {
    return WhatsAppConsentStatus.OPTED_OUT;
  }

  return WhatsAppConsentStatus.UNKNOWN;
};

const mapDealRisk = (value: string | undefined): string => {
  const normalized = value?.toLowerCase();

  if (normalized === 'low' || normalized === 'baixo') {
    return 'LOW';
  }

  if (
    normalized === 'medium' ||
    normalized === 'normal' ||
    normalized === 'médio' ||
    normalized === 'medio'
  ) {
    return 'MEDIUM';
  }

  if (
    normalized === 'high' ||
    normalized === 'critical' ||
    normalized === 'alto' ||
    normalized === 'crítico' ||
    normalized === 'critico'
  ) {
    return 'HIGH';
  }

  return 'UNKNOWN';
};

const mapOpportunityStage = (value: string | undefined): string => {
  const normalized = value
    ?.normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

  if (normalized?.includes('perdid') || normalized?.includes('lost'))
    return 'LOST';
  if (normalized?.includes('ganh') || normalized?.includes('customer'))
    return 'CUSTOMER';
  if (normalized?.includes('negoci')) return 'NEGOTIATION';
  if (normalized?.includes('propost') || normalized?.includes('proposal'))
    return 'PROPOSAL';
  if (
    normalized?.includes('diagnostico realizado') ||
    normalized?.includes('diagnosis complete')
  )
    return 'DIAGNOSIS_COMPLETE';
  if (normalized?.includes('diagnost') || normalized?.includes('meeting'))
    return 'MEETING';
  if (normalized?.includes('qualif') || normalized?.includes('screening'))
    return 'SCREENING';

  return 'NEW';
};

const mapConversationStatus = (
  value: string | undefined,
): InboxConversationStatus => {
  switch (value?.toLowerCase()) {
    case 'pending':
      return InboxConversationStatus.PENDING;
    case 'snoozed':
      return InboxConversationStatus.SNOOZED;
    case 'resolved':
    case 'closed':
      return InboxConversationStatus.RESOLVED;
    default:
      return InboxConversationStatus.OPEN;
  }
};

const mapConversationPriority = (
  value: string | undefined,
): InboxConversationPriority => {
  switch (value?.toLowerCase()) {
    case 'low':
      return InboxConversationPriority.LOW;
    case 'high':
      return InboxConversationPriority.HIGH;
    case 'urgent':
    case 'critical':
      return InboxConversationPriority.URGENT;
    default:
      return InboxConversationPriority.NORMAL;
  }
};

const mapMessageType = (value: string | undefined): InboxMessageType => {
  const normalized = value?.toUpperCase();

  return Object.values(InboxMessageType).includes(
    normalized as InboxMessageType,
  )
    ? (normalized as InboxMessageType)
    : InboxMessageType.TEXT;
};

const mapDeliveryStatus = (
  value: string | undefined,
  direction: InboxMessageDirection,
): InboxMessageDeliveryStatus => {
  const normalized = value?.toUpperCase();

  if (
    Object.values(InboxMessageDeliveryStatus).includes(
      normalized as InboxMessageDeliveryStatus,
    )
  ) {
    return normalized as InboxMessageDeliveryStatus;
  }

  return direction === InboxMessageDirection.INBOUND
    ? InboxMessageDeliveryStatus.RECEIVED
    : InboxMessageDeliveryStatus.SENT;
};

const mapSignalType = (value: string | undefined): CommercialSignalType => {
  const normalized = value?.toLowerCase() ?? '';

  if (normalized.includes('churn')) {
    return CommercialSignalType.CHURN_RISK;
  }

  if (normalized.includes('expan') || normalized.includes('upsell')) {
    return CommercialSignalType.EXPANSION;
  }

  if (normalized.includes('compet')) {
    return CommercialSignalType.COMPETITOR;
  }

  if (normalized.includes('objection') || normalized.includes('objec')) {
    return CommercialSignalType.OBJECTION;
  }

  if (normalized.includes('engag') || normalized.includes('activity')) {
    return CommercialSignalType.ENGAGEMENT;
  }

  if (normalized.includes('risk') || normalized.includes('negative')) {
    return CommercialSignalType.RISK;
  }

  return CommercialSignalType.INTENT;
};

const mapSignalSource = (value: string | undefined): CommercialSignalSource => {
  const normalized = value?.toLowerCase() ?? '';

  if (normalized.includes('whatsapp')) return CommercialSignalSource.WHATSAPP;
  if (normalized.includes('email')) return CommercialSignalSource.EMAIL;
  if (normalized.includes('meeting')) return CommercialSignalSource.MEETING;
  if (normalized.includes('web') || normalized.includes('site'))
    return CommercialSignalSource.WEB;
  if (normalized.includes('ai') || normalized.includes('model'))
    return CommercialSignalSource.AI;
  if (normalized.includes('success') || normalized.includes('cs'))
    return CommercialSignalSource.CUSTOMER_SUCCESS;

  return CommercialSignalSource.MANUAL;
};

const mapLifecycle = (value: string | undefined): SuccessLifecycle => {
  const normalized = value?.toLowerCase() ?? '';

  if (normalized.includes('churn') || normalized.includes('closed'))
    return SuccessLifecycle.CHURNED;
  if (normalized.includes('risk')) return SuccessLifecycle.AT_RISK;
  if (normalized.includes('renew')) return SuccessLifecycle.RENEWAL;
  if (normalized.includes('expan')) return SuccessLifecycle.EXPANSION;
  if (normalized.includes('value')) return SuccessLifecycle.VALUE_DELIVERED;
  if (normalized.includes('adopt') || normalized.includes('active'))
    return SuccessLifecycle.ADOPTION;

  return SuccessLifecycle.ONBOARDING;
};

const mapHealth = (value: string | undefined): SuccessHealth => {
  const normalized = value?.toLowerCase() ?? '';

  if (normalized.includes('healthy') || normalized.includes('saud'))
    return SuccessHealth.HEALTHY;
  if (normalized.includes('critical') || normalized.includes('crít'))
    return SuccessHealth.CRITICAL;
  if (
    normalized.includes('attention') ||
    normalized.includes('risk') ||
    normalized.includes('aten')
  )
    return SuccessHealth.ATTENTION;

  return SuccessHealth.UNKNOWN;
};

const mapMilestoneStatus = (
  value: string | undefined,
): SuccessMilestoneStatus => {
  const normalized = value?.toLowerCase() ?? '';

  if (normalized.includes('complete') || normalized.includes('done'))
    return SuccessMilestoneStatus.COMPLETED;
  if (normalized.includes('block')) return SuccessMilestoneStatus.BLOCKED;
  if (normalized.includes('cancel')) return SuccessMilestoneStatus.CANCELLED;
  if (
    normalized.includes('progress') ||
    normalized.includes('active') ||
    normalized.includes('approved')
  )
    return SuccessMilestoneStatus.IN_PROGRESS;

  return SuccessMilestoneStatus.PLANNED;
};

const mapMilestoneCategory = (
  value: string | undefined,
): SuccessMilestoneCategory => {
  const normalized = value?.toLowerCase() ?? '';

  if (normalized.includes('renew')) return SuccessMilestoneCategory.RENEWAL;
  if (normalized.includes('expan')) return SuccessMilestoneCategory.EXPANSION;
  if (normalized.includes('value') || normalized.includes('result'))
    return SuccessMilestoneCategory.VALUE;
  if (normalized.includes('adopt')) return SuccessMilestoneCategory.ADOPTION;
  if (normalized.includes('activ')) return SuccessMilestoneCategory.ACTIVATION;

  return SuccessMilestoneCategory.ONBOARDING;
};

const mapAiActionType = (value: string | undefined): AiActionType => {
  const normalized = value?.toLowerCase() ?? '';

  if (normalized.includes('reply') || normalized.includes('response'))
    return AiActionType.REPLY;
  if (normalized.includes('follow')) return AiActionType.FOLLOW_UP;
  if (normalized.includes('pipeline') || normalized.includes('stage'))
    return AiActionType.PIPELINE_UPDATE;
  if (normalized.includes('risk')) return AiActionType.RISK_MITIGATION;
  if (normalized.includes('success') || normalized.includes('cs'))
    return AiActionType.CS_INTERVENTION;
  if (normalized.includes('expan')) return AiActionType.EXPANSION;

  return AiActionType.QUALIFY;
};

const mapAiActionStatus = (value: string | undefined): AiActionStatus => {
  switch (value?.toLowerCase()) {
    case 'approved':
      return AiActionStatus.APPROVED;
    case 'rejected':
    case 'dismissed':
      return AiActionStatus.REJECTED;
    case 'executed':
    case 'sent':
      return AiActionStatus.EXECUTED;
    case 'failed':
      return AiActionStatus.FAILED;
    case 'draft':
      return AiActionStatus.DRAFT;
    default:
      return AiActionStatus.PENDING_APPROVAL;
  }
};

const assertMigrationAccess = async (
  routeUserWorkspaceId: string | null,
): Promise<void> => {
  if (!routeUserWorkspaceId) {
    if (process.env.DIEX_MIGRATION_API_ENABLED !== 'true') {
      throw new Error(
        'API-key migration is disabled. Set DIEX_MIGRATION_API_ENABLED=true only during the controlled migration window.',
      );
    }

    return;
  }

  const metadataClient = new MetadataApiClient();
  const { currentUser } = await metadataClient.query({
    currentUser: {
      id: true,
      currentUserWorkspace: {
        id: true,
        permissionFlags: true,
      },
    },
  });

  if (
    currentUser.currentUserWorkspace?.id !== routeUserWorkspaceId ||
    !currentUser.currentUserWorkspace.permissionFlags?.includes('APPLICATIONS')
  ) {
    throw new Error(
      'Application settings permission is required to import legacy data.',
    );
  }
};

const findByLegacyId = async (
  client: CoreApiClient,
  entity: Exclude<
    DiexMigrationEntity,
    'inboxConversations' | 'inboxMessages' | 'aiActions'
  >,
  legacyId: string,
): Promise<string | null> => {
  switch (entity) {
    case 'companies': {
      const result = (await client.query({
        companies: {
          __args: { filter: { legacyDiexId: { eq: legacyId } }, first: 1 },
          edges: { node: { id: true } },
        },
      } as never)) as unknown as {
        companies?: Connection<{ id?: string | null }>;
      };

      return getFirstNode(result.companies)?.id ?? null;
    }
    case 'people': {
      const result = (await client.query({
        people: {
          __args: { filter: { legacyDiexId: { eq: legacyId } }, first: 1 },
          edges: { node: { id: true } },
        },
      } as never)) as unknown as {
        people?: Connection<{ id?: string | null }>;
      };

      return getFirstNode(result.people)?.id ?? null;
    }
    case 'offers': {
      const result = (await client.query({
        offers: {
          __args: { filter: { legacyDiexId: { eq: legacyId } }, first: 1 },
          edges: { node: { id: true } },
        },
      } as never)) as unknown as {
        offers?: Connection<{ id?: string | null }>;
      };

      return getFirstNode(result.offers)?.id ?? null;
    }
    case 'opportunities': {
      const result = (await client.query({
        opportunities: {
          __args: { filter: { legacyDiexId: { eq: legacyId } }, first: 1 },
          edges: { node: { id: true } },
        },
      } as never)) as unknown as {
        opportunities?: Connection<{ id?: string | null }>;
      };

      return getFirstNode(result.opportunities)?.id ?? null;
    }
    case 'tasks': {
      const result = (await client.query({
        tasks: {
          __args: { filter: { legacyDiexId: { eq: legacyId } }, first: 1 },
          edges: { node: { id: true } },
        },
      } as never)) as unknown as {
        tasks?: Connection<{ id?: string | null }>;
      };

      return getFirstNode(result.tasks)?.id ?? null;
    }
    case 'notes': {
      const result = (await client.query({
        notes: {
          __args: { filter: { legacyDiexId: { eq: legacyId } }, first: 1 },
          edges: { node: { id: true } },
        },
      } as never)) as unknown as {
        notes?: Connection<{ id?: string | null }>;
      };

      return getFirstNode(result.notes)?.id ?? null;
    }
    case 'successPlans': {
      const result = (await client.query({
        successPlans: {
          __args: { filter: { legacyDiexId: { eq: legacyId } }, first: 1 },
          edges: { node: { id: true } },
        },
      } as never)) as unknown as {
        successPlans?: Connection<{ id?: string | null }>;
      };

      return getFirstNode(result.successPlans)?.id ?? null;
    }
    case 'successMilestones': {
      const result = (await client.query({
        successMilestones: {
          __args: { filter: { legacyDiexId: { eq: legacyId } }, first: 1 },
          edges: { node: { id: true } },
        },
      } as never)) as unknown as {
        successMilestones?: Connection<{ id?: string | null }>;
      };

      return getFirstNode(result.successMilestones)?.id ?? null;
    }
    case 'commercialSignals': {
      const result = (await client.query({
        commercialSignals: {
          __args: { filter: { legacyDiexId: { eq: legacyId } }, first: 1 },
          edges: { node: { id: true } },
        },
      } as never)) as unknown as {
        commercialSignals?: Connection<{ id?: string | null }>;
      };

      return getFirstNode(result.commercialSignals)?.id ?? null;
    }
  }
};

const findInboxConversation = async (
  client: CoreApiClient,
  legacyId: string,
): Promise<string | null> => {
  const result = (await client.query({
    inboxConversations: {
      __args: {
        filter: { providerThreadKey: { eq: `legacy:${legacyId}` } },
        first: 1,
      },
      edges: { node: { id: true } },
    },
  } as never)) as unknown as {
    inboxConversations?: Connection<{ id?: string | null }>;
  };

  return getFirstNode(result.inboxConversations)?.id ?? null;
};

const findInboxMessage = async (
  client: CoreApiClient,
  legacyId: string,
): Promise<string | null> => {
  const result = (await client.query({
    inboxMessages: {
      __args: {
        filter: { providerMessageKey: { eq: `legacy:${legacyId}` } },
        first: 1,
      },
      edges: { node: { id: true } },
    },
  } as never)) as unknown as {
    inboxMessages?: Connection<{ id?: string | null }>;
  };

  return getFirstNode(result.inboxMessages)?.id ?? null;
};

const findAiAction = async (
  client: CoreApiClient,
  legacyId: string,
): Promise<string | null> => {
  const result = (await client.query({
    aiActions: {
      __args: {
        filter: { idempotencyKey: { eq: `legacy:${legacyId}` } },
        first: 1,
      },
      edges: { node: { id: true } },
    },
  } as never)) as unknown as {
    aiActions?: Connection<{ id?: string | null }>;
  };

  return getFirstNode(result.aiActions)?.id ?? null;
};

const resolveRelation = async (
  client: CoreApiClient,
  entity:
    | 'companies'
    | 'people'
    | 'opportunities'
    | 'successPlans'
    | 'commercialSignals',
  legacyId: string | undefined,
  unresolvedRelations: string[],
  label: string,
): Promise<string | undefined> => {
  if (!legacyId) {
    return undefined;
  }

  const resolved = await findByLegacyId(client, entity, legacyId);

  if (!resolved) {
    unresolvedRelations.push(`${label}:${legacyId}`);
  }

  return resolved ?? undefined;
};

const upsertCompany = async (
  client: CoreApiClient,
  record: JsonRecord,
  previewOnly: boolean,
): Promise<RecordOutcome> => {
  const legacyId = readLegacyId(record);
  const existingId = await findByLegacyId(client, 'companies', legacyId);
  const domain =
    normalizeDomain(readString(record, 'primaryDomain', 500)) ??
    normalizeDomain(readString(record, 'website', 500));
  const healthStatus = readString(record, 'healthStatus', 40)?.toLowerCase();
  const hasSuccessPlan = readBoolean(record, 'hasSuccessPlan') === true;
  const lifecycle =
    healthStatus === 'critical' || healthStatus === 'at_risk'
      ? 'AT_RISK'
      : hasSuccessPlan
        ? 'CUSTOMER'
        : 'PROSPECT';
  const data = {
    name: readString(record, 'name', 255) ?? `Empresa legada ${legacyId}`,
    legacyDiexId: legacyId,
    domainName: domain ? { primaryLinkUrl: domain } : undefined,
    address: buildAddress(
      readString(record, 'city', 120),
      readString(record, 'state', 80),
    ),
    diexLifecycle: lifecycle,
    diexSegment: readString(record, 'segment', 255),
    diexNiche: readString(record, 'niche', 255),
    diexAnnualRevenueRange: readString(record, 'annualRevenueRange', 120),
    diexEmployeeRange: readString(record, 'employeeRange', 120),
  };

  if (!previewOnly) {
    if (existingId) {
      await client.mutation({
        updateCompany: {
          __args: { id: existingId, data },
          id: true,
        },
      } as never);
    } else {
      await client.mutation({
        createCompany: {
          __args: { data },
          id: true,
        },
      } as never);
    }
  }

  return { action: existingId ? 'update' : 'create' };
};

const upsertPerson = async (
  client: CoreApiClient,
  record: JsonRecord,
  previewOnly: boolean,
): Promise<RecordOutcome> => {
  const legacyId = readLegacyId(record);
  const existingId = await findByLegacyId(client, 'people', legacyId);
  const unresolvedRelations: string[] = [];
  const companyId = await resolveRelation(
    client,
    'companies',
    readOptionalLegacyId(record, 'companyLegacyId'),
    unresolvedRelations,
    'company',
  );
  const normalizedPhone =
    normalizePhone(readString(record, 'primaryPhone', 80)) ??
    normalizePhone(readString(record, 'contactPhone', 80));
  const primaryEmail =
    readString(record, 'primaryEmail', 320)?.toLowerCase() ??
    readString(record, 'contactEmail', 320)?.toLowerCase();
  const consentStatus = mapConsentStatus(
    readString(record, 'consentStatus', 40) ??
      readString(record, 'marketingStatus', 40),
  );
  const data = {
    name: splitName(
      readString(record, 'name', 255) ?? `Contato legado ${legacyId}`,
    ),
    legacyDiexId: legacyId,
    companyId,
    emails: primaryEmail ? { primaryEmail } : undefined,
    phones: normalizedPhone ? buildPhoneValue(normalizedPhone) : undefined,
    jobTitle: readString(record, 'jobTitle', 255),
    linkedinLink: readString(record, 'linkedinUrl', 500)
      ? { primaryLinkUrl: readString(record, 'linkedinUrl', 500) }
      : undefined,
    whatsappNormalizedPhone: normalizedPhone,
    whatsappConsentStatus: consentStatus,
    whatsappConsentAt:
      consentStatus === WhatsAppConsentStatus.OPTED_IN
        ? readDate(record, 'consentedAt')
        : undefined,
    doNotContact: consentStatus === WhatsAppConsentStatus.OPTED_OUT,
  };

  if (!previewOnly) {
    if (existingId) {
      await client.mutation({
        updatePerson: {
          __args: { id: existingId, data },
          id: true,
        },
      } as never);
    } else {
      await client.mutation({
        createPerson: {
          __args: { data },
          id: true,
        },
      } as never);
    }
  }

  return {
    action: existingId ? 'update' : 'create',
    unresolvedRelations,
  };
};

const upsertOffer = async (
  client: CoreApiClient,
  record: JsonRecord,
  previewOnly: boolean,
): Promise<RecordOutcome> => {
  const legacyId = readLegacyId(record);
  const existingId = await findByLegacyId(client, 'offers', legacyId);
  const active = readBoolean(record, 'active') !== false;
  const data = {
    name: readString(record, 'name', 255) ?? `Oferta legada ${legacyId}`,
    legacyDiexId: legacyId,
    status: active ? OfferStatus.ACTIVE : OfferStatus.RETIRED,
    category: readString(record, 'category', 255),
    pricingModel: OfferPricingModel.NEGOTIABLE,
    valueProposition: richText(
      combineText([
        readString(record, 'headline', 1_000),
        readString(record, 'description'),
        readString(record, 'commercialDescription'),
        readString(record, 'problemSolved'),
        readString(record, 'priceRange', 500)
          ? `Faixa de preço legada: ${readString(record, 'priceRange', 500)}`
          : undefined,
      ]),
    ),
    idealCustomerProfile: richText(readString(record, 'idealCustomerProfile')),
    differentiators: richText(
      combineText([
        readString(record, 'includedItems'),
        readString(record, 'proofNotes'),
      ]),
    ),
    objectionPlaybook: richText(
      combineText([
        readString(record, 'objectionHandling'),
        readString(record, 'commonObjections'),
      ]),
    ),
    qualificationCriteria: richText(
      combineText([
        readString(record, 'qualificationQuestions'),
        readString(record, 'recommendedCta', 1_000),
      ]),
    ),
  };

  if (!previewOnly) {
    if (existingId) {
      await client.mutation({
        updateOffer: {
          __args: { id: existingId, data },
          id: true,
        },
      } as never);
    } else {
      await client.mutation({
        createOffer: {
          __args: { data },
          id: true,
        },
      } as never);
    }
  }

  return { action: existingId ? 'update' : 'create' };
};

const upsertOpportunity = async (
  client: CoreApiClient,
  record: JsonRecord,
  previewOnly: boolean,
): Promise<RecordOutcome> => {
  const legacyId = readLegacyId(record);
  const existingId = await findByLegacyId(client, 'opportunities', legacyId);
  const unresolvedRelations: string[] = [];
  const companyId = await resolveRelation(
    client,
    'companies',
    readOptionalLegacyId(record, 'companyLegacyId'),
    unresolvedRelations,
    'company',
  );
  const personId = await resolveRelation(
    client,
    'people',
    readOptionalLegacyId(record, 'personLegacyId'),
    unresolvedRelations,
    'person',
  );
  const amount = readNumber(record, 'amount', 0, 9_000_000_000);
  const currency = readString(record, 'currency', 3)?.toUpperCase() ?? 'BRL';
  const data = {
    name: readString(record, 'name', 255) ?? `Oportunidade legada ${legacyId}`,
    legacyDiexId: legacyId,
    stage: mapOpportunityStage(readString(record, 'stageName', 255)),
    amount:
      amount === undefined
        ? undefined
        : {
            amountMicros: Math.round(amount * 1_000_000),
            currencyCode: /^[A-Z]{3}$/.test(currency) ? currency : 'BRL',
          },
    companyId,
    pointOfContactId: personId,
    commercialScore: readNumber(record, 'leadScore', 0, 100),
    dealRisk: mapDealRisk(readString(record, 'riskLevel', 40)),
    nextCommercialAction:
      readString(record, 'nextAction', 500) ??
      readString(record, 'nextBestAction', 500),
    nextCommercialActionAt:
      readDate(record, 'nextContactAt') ??
      readDate(record, 'leadScoreUpdatedAt'),
  };

  if (!previewOnly) {
    if (existingId) {
      await client.mutation({
        updateOpportunity: {
          __args: { id: existingId, data },
          id: true,
        },
      } as never);
    } else {
      await client.mutation({
        createOpportunity: {
          __args: { data },
          id: true,
        },
      } as never);
    }
  }

  return {
    action: existingId ? 'update' : 'create',
    unresolvedRelations,
  };
};

const resolveTaskTarget = async (
  client: CoreApiClient,
  target: JsonRecord,
  unresolvedRelations: string[],
): Promise<
  | { targetCompanyId: string }
  | { targetPersonId: string }
  | { targetOpportunityId: string }
  | null
> => {
  const targetLegacyId = readOptionalLegacyId(target, 'legacyId');
  const targetType = readString(target, 'type', 80)?.toLowerCase() ?? '';

  if (!targetLegacyId) {
    return null;
  }

  if (targetType.includes('compan')) {
    const id = await resolveRelation(
      client,
      'companies',
      targetLegacyId,
      unresolvedRelations,
      'task-company',
    );

    return id ? { targetCompanyId: id } : null;
  }

  if (targetType.includes('people') || targetType.includes('person')) {
    const id = await resolveRelation(
      client,
      'people',
      targetLegacyId,
      unresolvedRelations,
      'task-person',
    );

    return id ? { targetPersonId: id } : null;
  }

  if (targetType.includes('opportun')) {
    const id = await resolveRelation(
      client,
      'opportunities',
      targetLegacyId,
      unresolvedRelations,
      'task-opportunity',
    );

    return id ? { targetOpportunityId: id } : null;
  }

  unresolvedRelations.push(
    `task-unsupported-target:${targetType}:${targetLegacyId}`,
  );

  return null;
};

const createMissingTaskTarget = async (
  client: CoreApiClient,
  taskId: string,
  target:
    | { targetCompanyId: string }
    | { targetPersonId: string }
    | { targetOpportunityId: string },
): Promise<void> => {
  const result = (await client.query({
    taskTargets: {
      __args: {
        filter: {
          taskId: { eq: taskId },
          ...('targetCompanyId' in target
            ? { targetCompanyId: { eq: target.targetCompanyId } }
            : {}),
          ...('targetPersonId' in target
            ? { targetPersonId: { eq: target.targetPersonId } }
            : {}),
          ...('targetOpportunityId' in target
            ? { targetOpportunityId: { eq: target.targetOpportunityId } }
            : {}),
        },
        first: 1,
      },
      edges: { node: { id: true } },
    },
  } as never)) as unknown as {
    taskTargets?: Connection<{ id?: string | null }>;
  };

  if (getFirstNode(result.taskTargets)?.id) {
    return;
  }

  await client.mutation({
    createTaskTarget: {
      __args: {
        data: {
          taskId,
          ...target,
        },
      },
      id: true,
    },
  } as never);
};

const upsertTask = async (
  client: CoreApiClient,
  record: JsonRecord,
  previewOnly: boolean,
): Promise<RecordOutcome> => {
  const legacyId = readLegacyId(record);
  const existingId = await findByLegacyId(client, 'tasks', legacyId);
  const unresolvedRelations: string[] = [];
  const origin = readString(record, 'originType', 80);
  const dueReason = readString(record, 'dueReason', 2_000);
  const data = {
    title: readString(record, 'title', 255) ?? `Tarefa legada ${legacyId}`,
    legacyDiexId: legacyId,
    status: 'TODO',
    dueAt: readDate(record, 'dueAt'),
    bodyV2: richText(
      combineText([
        dueReason,
        origin ? `Origem legada: ${origin}` : undefined,
        readBoolean(record, 'aiGenerated') === true
          ? 'Criada originalmente por IA; exige revisão humana.'
          : undefined,
      ]),
    ),
  };
  let taskId = existingId;

  if (!previewOnly) {
    if (existingId) {
      await client.mutation({
        updateTask: {
          __args: { id: existingId, data },
          id: true,
        },
      } as never);
    } else {
      const result = (await client.mutation({
        createTask: {
          __args: { data },
          id: true,
        },
      } as never)) as unknown as {
        createTask?: { id?: string | null } | null;
      };

      taskId = result.createTask?.id ?? null;
    }
  }

  const rawTargets = Array.isArray(record.targets) ? record.targets : [];

  for (const rawTarget of rawTargets) {
    if (!isJsonRecord(rawTarget)) {
      continue;
    }

    const target = await resolveTaskTarget(
      client,
      rawTarget,
      unresolvedRelations,
    );

    if (!previewOnly && taskId && target) {
      await createMissingTaskTarget(client, taskId, target);
    }
  }

  return {
    action: existingId ? 'update' : 'create',
    unresolvedRelations,
  };
};

const createMissingNoteTarget = async (
  client: CoreApiClient,
  noteId: string,
  target:
    | { targetCompanyId: string }
    | { targetPersonId: string }
    | { targetOpportunityId: string },
): Promise<void> => {
  const result = (await client.query({
    noteTargets: {
      __args: {
        filter: {
          noteId: { eq: noteId },
          ...('targetCompanyId' in target
            ? { targetCompanyId: { eq: target.targetCompanyId } }
            : {}),
          ...('targetPersonId' in target
            ? { targetPersonId: { eq: target.targetPersonId } }
            : {}),
          ...('targetOpportunityId' in target
            ? { targetOpportunityId: { eq: target.targetOpportunityId } }
            : {}),
        },
        first: 1,
      },
      edges: { node: { id: true } },
    },
  } as never)) as unknown as {
    noteTargets?: Connection<{ id?: string | null }>;
  };

  if (getFirstNode(result.noteTargets)?.id) {
    return;
  }

  await client.mutation({
    createNoteTarget: {
      __args: {
        data: {
          noteId,
          ...target,
        },
      },
      id: true,
    },
  } as never);
};

const upsertNote = async (
  client: CoreApiClient,
  record: JsonRecord,
  previewOnly: boolean,
): Promise<RecordOutcome> => {
  const legacyId = readLegacyId(record);
  const existingId = await findByLegacyId(client, 'notes', legacyId);
  const unresolvedRelations: string[] = [];
  const title = readString(record, 'title', 255) ?? `Nota legada ${legacyId}`;
  const data = {
    title,
    legacyDiexId: legacyId,
    bodyV2: richText(
      combineText([
        readString(record, 'body'),
        `Nota migrada do Diex CRM. Conteúdo legado disponível: ${title}`,
      ]),
    ),
  };
  let noteId = existingId;

  if (!previewOnly) {
    if (existingId) {
      await client.mutation({
        updateNote: {
          __args: { id: existingId, data },
          id: true,
        },
      } as never);
    } else {
      const result = (await client.mutation({
        createNote: {
          __args: { data },
          id: true,
        },
      } as never)) as unknown as {
        createNote?: { id?: string | null } | null;
      };

      noteId = result.createNote?.id ?? null;
    }
  }

  const rawTargets = Array.isArray(record.targets) ? record.targets : [];

  for (const rawTarget of rawTargets) {
    if (!isJsonRecord(rawTarget)) {
      continue;
    }

    const target = await resolveTaskTarget(
      client,
      rawTarget,
      unresolvedRelations,
    );

    if (!previewOnly && noteId && target) {
      await createMissingNoteTarget(client, noteId, target);
    }
  }

  return {
    action: existingId ? 'update' : 'create',
    unresolvedRelations,
  };
};

const upsertSuccessPlan = async (
  client: CoreApiClient,
  record: JsonRecord,
  previewOnly: boolean,
): Promise<RecordOutcome> => {
  const legacyId = readLegacyId(record);
  const existingId = await findByLegacyId(client, 'successPlans', legacyId);
  const unresolvedRelations: string[] = [];
  const companyId = await resolveRelation(
    client,
    'companies',
    readOptionalLegacyId(record, 'companyLegacyId'),
    unresolvedRelations,
    'company',
  );
  const primaryContactId = await resolveRelation(
    client,
    'people',
    readOptionalLegacyId(record, 'primaryPersonLegacyId'),
    unresolvedRelations,
    'primary-person',
  );

  if (!companyId) {
    return { action: 'skip', unresolvedRelations };
  }

  const data = {
    name:
      readString(record, 'name', 255) ??
      `Plano de sucesso - ${readString(record, 'companyName', 255) ?? legacyId}`,
    legacyDiexId: legacyId,
    companyId,
    primaryContactId,
    lifecycle: mapLifecycle(readString(record, 'lifecycleState', 80)),
    health: mapHealth(readString(record, 'healthStatus', 80)),
    healthScore: readNumber(record, 'healthScore', 0, 100),
    startDate: readDateOnly(record, 'startedAt'),
    renewalDate: readDateOnly(record, 'renewalAt'),
    nextReviewAt: readDate(record, 'nextReviewAt'),
    risks: richText(readString(record, 'closureReason')),
    executiveSummary: richText(
      combineText([
        readString(record, 'executiveSummary'),
        readString(record, 'healthReasons'),
      ]),
    ),
  };

  if (!previewOnly) {
    if (existingId) {
      await client.mutation({
        updateSuccessPlan: {
          __args: { id: existingId, data },
          id: true,
        },
      } as never);
    } else {
      await client.mutation({
        createSuccessPlan: {
          __args: { data },
          id: true,
        },
      } as never);
    }
  }

  return {
    action: existingId ? 'update' : 'create',
    unresolvedRelations,
  };
};

const upsertSuccessMilestone = async (
  client: CoreApiClient,
  record: JsonRecord,
  previewOnly: boolean,
): Promise<RecordOutcome> => {
  const legacyId = readLegacyId(record);
  const existingId = await findByLegacyId(
    client,
    'successMilestones',
    legacyId,
  );
  const unresolvedRelations: string[] = [];
  const successPlanId = await resolveRelation(
    client,
    'successPlans',
    readOptionalLegacyId(record, 'successPlanLegacyId'),
    unresolvedRelations,
    'success-plan',
  );

  if (!successPlanId) {
    return { action: 'skip', unresolvedRelations };
  }

  const status = mapMilestoneStatus(readString(record, 'status', 80));
  const data = {
    name: readString(record, 'name', 255) ?? `Marco legado ${legacyId}`,
    legacyDiexId: legacyId,
    successPlanId,
    category: mapMilestoneCategory(readString(record, 'objectiveType', 80)),
    status,
    dueAt: readDate(record, 'targetAt') ?? readDate(record, 'nextReviewAt'),
    completedAt:
      status === SuccessMilestoneStatus.COMPLETED
        ? (readDate(record, 'lastReviewedAt') ?? readDate(record, 'updatedAt'))
        : undefined,
    outcome: richText(readString(record, 'description')),
    evidence: richText(readString(record, 'causalJustification')),
  };

  if (!previewOnly) {
    if (existingId) {
      await client.mutation({
        updateSuccessMilestone: {
          __args: { id: existingId, data },
          id: true,
        },
      } as never);
    } else {
      await client.mutation({
        createSuccessMilestone: {
          __args: { data },
          id: true,
        },
      } as never);
    }
  }

  return {
    action: existingId ? 'update' : 'create',
    unresolvedRelations,
  };
};

const upsertCommercialSignal = async (
  client: CoreApiClient,
  record: JsonRecord,
  previewOnly: boolean,
): Promise<RecordOutcome> => {
  const legacyId = readLegacyId(record);
  const existingId = await findByLegacyId(
    client,
    'commercialSignals',
    legacyId,
  );
  const unresolvedRelations: string[] = [];
  const companyId = await resolveRelation(
    client,
    'companies',
    readOptionalLegacyId(record, 'companyLegacyId'),
    unresolvedRelations,
    'company',
  );
  const weight = readNumber(record, 'weight', 0, 100) ?? 20;
  const strength = `RATING_${Math.min(5, Math.max(1, Math.ceil(weight / 20)))}`;
  const data = {
    name: readString(record, 'title', 255) ?? `Sinal legado ${legacyId}`,
    legacyDiexId: legacyId,
    companyId,
    type: mapSignalType(readString(record, 'type', 80)),
    source: mapSignalSource(readString(record, 'source', 80)),
    status: CommercialSignalStatus.NEW,
    strength,
    evidence: richText(
      combineText([
        readString(record, 'description'),
        readString(record, 'direction', 40)
          ? `Direção original: ${readString(record, 'direction', 40)}`
          : undefined,
      ]),
    ),
    capturedAt: readDate(record, 'occurredAt') ?? readDate(record, 'createdAt'),
    validUntil: readDate(record, 'expiresAt'),
    confidence: weight,
    sourceReference: `legacy-signal:${legacyId}`,
  };

  if (!previewOnly) {
    if (existingId) {
      await client.mutation({
        updateCommercialSignal: {
          __args: { id: existingId, data },
          id: true,
        },
      } as never);
    } else {
      await client.mutation({
        createCommercialSignal: {
          __args: { data },
          id: true,
        },
      } as never);
    }
  }

  return {
    action: existingId ? 'update' : 'create',
    unresolvedRelations,
  };
};

const upsertInboxConversation = async (
  client: CoreApiClient,
  record: JsonRecord,
  previewOnly: boolean,
): Promise<RecordOutcome> => {
  const legacyId = readLegacyId(record);
  const existingId = await findInboxConversation(client, legacyId);
  const unresolvedRelations: string[] = [];
  const personId = await resolveRelation(
    client,
    'people',
    readOptionalLegacyId(record, 'personLegacyId'),
    unresolvedRelations,
    'person',
  );
  const companyId = await resolveRelation(
    client,
    'companies',
    readOptionalLegacyId(record, 'companyLegacyId'),
    unresolvedRelations,
    'company',
  );
  const channelType = readString(record, 'channelType', 40)?.toLowerCase();
  const channel =
    channelType === 'email'
      ? InboxConversationChannel.EMAIL
      : InboxConversationChannel.WHATSAPP;
  const metadata = sanitizeMetadata(record.metadata);
  const data = {
    name:
      readString(record, 'personName', 255) ??
      readString(record, 'name', 255) ??
      `Conversa legada ${legacyId}`,
    providerThreadKey: `legacy:${legacyId}`,
    channel,
    provider: InboxConversationProvider.MANUAL,
    status: mapConversationStatus(readString(record, 'status', 40)),
    priority: mapConversationPriority(readString(record, 'priority', 40)),
    contactHandle:
      readString(record, 'contactHandle', 320) ??
      readString(record, 'channelPhone', 80),
    unreadCount: readNumber(record, 'unreadCount', 0, 1_000_000) ?? 0,
    lastMessageAt: readDate(record, 'lastMessageAt'),
    firstResponseDueAt: readDate(record, 'firstResponseDueAt'),
    firstRespondedAt: readDate(record, 'firstRespondedAt'),
    followUpDueAt: readDate(record, 'followUpDueAt'),
    slaBreachedAt: readDate(record, 'slaBreachedAt'),
    metadata: {
      ...(metadata ?? {}),
      migratedFrom: 'diex-crm',
      legacyExternalId: readString(record, 'externalId', 500),
    },
    personId,
    companyId,
  };

  if (!previewOnly) {
    if (existingId) {
      await client.mutation({
        updateInboxConversation: {
          __args: { id: existingId, data },
          id: true,
        },
      } as never);
    } else {
      await client.mutation({
        createInboxConversation: {
          __args: { data },
          id: true,
        },
      } as never);
    }
  }

  return {
    action: existingId ? 'update' : 'create',
    unresolvedRelations,
  };
};

const upsertInboxMessage = async (
  client: CoreApiClient,
  record: JsonRecord,
  previewOnly: boolean,
): Promise<RecordOutcome> => {
  const legacyId = readLegacyId(record);
  const existingId = await findInboxMessage(client, legacyId);
  const unresolvedRelations: string[] = [];
  const conversationLegacyId = readOptionalLegacyId(
    record,
    'conversationLegacyId',
  );
  const inboxConversationId = conversationLegacyId
    ? await findInboxConversation(client, conversationLegacyId)
    : null;

  if (conversationLegacyId && !inboxConversationId) {
    unresolvedRelations.push(`conversation:${conversationLegacyId}`);
  }

  if (!inboxConversationId) {
    return { action: 'skip', unresolvedRelations };
  }

  const direction =
    readString(record, 'direction', 40)?.toLowerCase() === 'outbound'
      ? InboxMessageDirection.OUTBOUND
      : InboxMessageDirection.INBOUND;
  const body = readString(record, 'content', 30_000);
  const metadata = sanitizeMetadata(record.metadata);
  const data = {
    name: (body ?? readString(record, 'type', 80) ?? 'Mensagem legada').slice(
      0,
      255,
    ),
    providerMessageKey: `legacy:${legacyId}`,
    inboxConversationId,
    direction,
    type: mapMessageType(readString(record, 'type', 40)),
    body,
    deliveryStatus: mapDeliveryStatus(
      readString(record, 'status', 40),
      direction,
    ),
    sentAt: readDate(record, 'sentAt') ?? readDate(record, 'createdAt'),
    senderHandle: readString(record, 'senderHandle', 320),
    senderDisplayName: readString(record, 'senderDisplayName', 255),
    isInternalNote: false,
    metadata: {
      ...(metadata ?? {}),
      migratedFrom: 'diex-crm',
      legacyExternalId: readString(record, 'externalId', 500),
    },
  };

  if (!previewOnly) {
    if (existingId) {
      await client.mutation({
        updateInboxMessage: {
          __args: { id: existingId, data },
          id: true,
        },
      } as never);
    } else {
      await client.mutation({
        createInboxMessage: {
          __args: { data },
          id: true,
        },
      } as never);
    }
  }

  return {
    action: existingId ? 'update' : 'create',
    unresolvedRelations,
  };
};

const upsertAiAction = async (
  client: CoreApiClient,
  record: JsonRecord,
  previewOnly: boolean,
): Promise<RecordOutcome> => {
  const legacyId = readLegacyId(record);
  const existingId = await findAiAction(client, legacyId);
  const unresolvedRelations: string[] = [];
  const opportunityId = await resolveRelation(
    client,
    'opportunities',
    readOptionalLegacyId(record, 'opportunityLegacyId'),
    unresolvedRelations,
    'opportunity',
  );
  const conversationLegacyId = readOptionalLegacyId(
    record,
    'conversationLegacyId',
  );
  const inboxConversationId = conversationLegacyId
    ? await findInboxConversation(client, conversationLegacyId)
    : null;

  if (conversationLegacyId && !inboxConversationId) {
    unresolvedRelations.push(`conversation:${conversationLegacyId}`);
  }

  const status = mapAiActionStatus(readString(record, 'status', 40));
  const content =
    readString(record, 'content', 30_000) ?? 'Revisar sugestão legada.';
  const data = {
    name:
      readString(record, 'name', 255) ??
      `Sugestão legada: ${readString(record, 'type', 80) ?? legacyId}`,
    type: mapAiActionType(readString(record, 'type', 80)),
    status,
    confidence: readNumber(record, 'confidence', 0, 100),
    rationale: richText(
      readString(record, 'rationale', 30_000) ??
        'Sugestão migrada do Diex CRM anterior.',
    ),
    proposedAction: richText(content),
    requestedAt: readDate(record, 'createdAt') ?? new Date().toISOString(),
    approvedAt:
      status === AiActionStatus.APPROVED || status === AiActionStatus.EXECUTED
        ? readDate(record, 'reviewedAt')
        : undefined,
    executedAt:
      status === AiActionStatus.EXECUTED
        ? readDate(record, 'reviewedAt')
        : undefined,
    requiresApproval: status !== AiActionStatus.EXECUTED,
    idempotencyKey: `legacy:${legacyId}`,
    opportunityId,
    inboxConversationId: inboxConversationId ?? undefined,
  };

  if (!previewOnly) {
    if (existingId) {
      await client.mutation({
        updateAiAction: {
          __args: { id: existingId, data },
          id: true,
        },
      } as never);
    } else {
      await client.mutation({
        createAiAction: {
          __args: { data },
          id: true,
        },
      } as never);
    }
  }

  return {
    action: existingId ? 'update' : 'create',
    unresolvedRelations,
  };
};

const importRecord = async (
  client: CoreApiClient,
  entity: DiexMigrationEntity,
  record: JsonRecord,
  previewOnly: boolean,
): Promise<RecordOutcome> => {
  switch (entity) {
    case 'companies':
      return upsertCompany(client, record, previewOnly);
    case 'people':
      return upsertPerson(client, record, previewOnly);
    case 'offers':
      return upsertOffer(client, record, previewOnly);
    case 'opportunities':
      return upsertOpportunity(client, record, previewOnly);
    case 'tasks':
      return upsertTask(client, record, previewOnly);
    case 'notes':
      return upsertNote(client, record, previewOnly);
    case 'successPlans':
      return upsertSuccessPlan(client, record, previewOnly);
    case 'successMilestones':
      return upsertSuccessMilestone(client, record, previewOnly);
    case 'commercialSignals':
      return upsertCommercialSignal(client, record, previewOnly);
    case 'inboxConversations':
      return upsertInboxConversation(client, record, previewOnly);
    case 'inboxMessages':
      return upsertInboxMessage(client, record, previewOnly);
    case 'aiActions':
      return upsertAiAction(client, record, previewOnly);
  }
};

export const importLegacyDiexBatch = async (
  routePayload: RoutePayload<MigrationRequest>,
): Promise<MigrationResult> => {
  await assertMigrationAccess(routePayload.userWorkspaceId);

  const sourceTeamId =
    typeof routePayload.body?.sourceTeamId === 'string'
      ? routePayload.body.sourceTeamId.trim()
      : '';
  const entity =
    typeof routePayload.body?.entity === 'string'
      ? routePayload.body.entity
      : '';
  const records = routePayload.body?.records;
  const previewOnly = routePayload.body?.confirmImport !== true;

  if (!/^[0-9A-HJKMNP-TV-Z]{26}$/i.test(sourceTeamId)) {
    throw new Error('A valid source Diex team ULID is required.');
  }

  if (!DIEX_MIGRATION_ENTITIES.includes(entity as DiexMigrationEntity)) {
    throw new Error('Unsupported migration entity.');
  }

  if (
    !Array.isArray(records) ||
    records.length === 0 ||
    records.length > DIEX_MIGRATION_BATCH_SIZE
  ) {
    throw new Error(
      `Migration batches must contain between 1 and ${DIEX_MIGRATION_BATCH_SIZE} records.`,
    );
  }

  if (!records.every(isJsonRecord)) {
    throw new Error('Every migration record must be a JSON object.');
  }

  const existingSourceTeamId = await appKeyValue.get<string>(
    DIEX_MIGRATION_SOURCE_TEAM_CLAIM_KEY,
  );

  if (existingSourceTeamId && existingSourceTeamId !== sourceTeamId) {
    throw new Error(
      'This workspace is already bound to a different legacy Diex team.',
    );
  }

  if (!previewOnly && !existingSourceTeamId) {
    await appKeyValue.set(DIEX_MIGRATION_SOURCE_TEAM_CLAIM_KEY, sourceTeamId);
  }

  const client = new CoreApiClient();
  const result: MigrationResult = {
    previewOnly,
    sourceTeamId,
    entity: entity as DiexMigrationEntity,
    received: records.length,
    creates: 0,
    updates: 0,
    skipped: 0,
    unresolvedRelations: 0,
    errors: [],
    message: '',
  };

  for (const record of records) {
    let legacyId = 'unknown';

    try {
      legacyId = readLegacyId(record);
      const outcome = await importRecord(
        client,
        entity as DiexMigrationEntity,
        record,
        previewOnly,
      );

      if (outcome.action === 'create') result.creates += 1;
      if (outcome.action === 'update') result.updates += 1;
      if (outcome.action === 'skip') result.skipped += 1;

      result.unresolvedRelations += outcome.unresolvedRelations?.length ?? 0;
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

  result.message = previewOnly
    ? 'Preview completed. No record was written.'
    : 'Confirmed batch imported idempotently. Re-running the same batch updates instead of duplicating records.';

  return result;
};

export default defineLogicFunction({
  universalIdentifier:
    DIEX_MIGRATION_IMPORT_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'import-legacy-diex-batch',
  description:
    'Imports one sanitized, tenant-bound Diex CRM batch with preview-first and idempotent upserts.',
  timeoutSeconds: 120,
  handler: importLegacyDiexBatch,
  httpRouteTriggerSettings: {
    path: DIEX_MIGRATION_IMPORT_ROUTE,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
