import { z } from 'zod';

const externalReferenceSchema = z.object({
  provider: z.string().min(1),
  externalId: z.string().min(1),
});

export const workspaceAgencySchema = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  legalName: z.string().min(1).nullable(),
  taxId: z.string().min(1).nullable(),
  timezone: z.string().min(1),
  currency: z.string().length(3),
  externalReferences: z.array(externalReferenceSchema),
  active: z.boolean(),
});

export const workspaceUserAgendaSchema = z.object({
  workspaceMemberId: z.uuid(),
  timezone: z.string().min(1),
  workingHours: z.array(
    z.object({
      weekday: z.number().int().min(0).max(6),
      startsAt: z.string().regex(/^\d{2}:\d{2}$/),
      endsAt: z.string().regex(/^\d{2}:\d{2}$/),
    }),
  ),
  calendarConnectionIds: z.array(z.uuid()),
  acceptsSharedAppointments: z.boolean(),
});

export const workspaceCommercialInboxChannelSchema = z.object({
  key: z.string().min(1),
  platform: z.enum([
    'WHATSAPP',
    'EMAIL',
    'INSTAGRAM',
    'MESSENGER',
    'WEBCHAT',
    'SMS',
    'TIKTOK',
    'OTHER',
  ]),
  provider: z.string().min(1),
  externalAccountId: z.string().min(1),
  agencyId: z.uuid().nullable(),
  defaultAssigneeId: z.uuid().nullable(),
  active: z.boolean(),
});

export const workspaceAdsAccountSchema = z.object({
  id: z.uuid(),
  platform: z.enum(['META_ADS', 'GOOGLE_ADS']),
  externalAccountId: z.string().min(1),
  name: z.string().min(1),
  agencyId: z.uuid().nullable(),
  currency: z.string().length(3),
  timezone: z.string().min(1),
  active: z.boolean(),
});

export const workspaceAdsResultSchema = z.object({
  adsAccountId: z.uuid(),
  externalCampaignId: z.string().min(1),
  externalAdSetId: z.string().min(1).nullable(),
  externalAdId: z.string().min(1).nullable(),
  date: z.iso.date(),
  spend: z.number().nonnegative(),
  impressions: z.number().int().nonnegative(),
  clicks: z.number().int().nonnegative(),
  leads: z.number().int().nonnegative(),
  conversions: z.number().nonnegative(),
  conversionValue: z.number().nonnegative(),
  currency: z.string().length(3),
  attributionWindow: z.string().min(1).nullable(),
  importedAt: z.iso.datetime(),
  sourceFingerprint: z.string().min(1),
});

export const workspaceClientAccessSchema = z.object({
  id: z.uuid(),
  clientCompanyId: z.uuid(),
  userWorkspaceId: z.uuid(),
  agencyIds: z.array(z.uuid()),
  adsAccountIds: z.array(z.uuid()),
  permissions: z.array(
    z.enum([
      'VIEW_PIPELINE',
      'VIEW_INBOX',
      'REPLY_INBOX',
      'VIEW_AGENDA',
      'VIEW_ADS_RESULTS',
      'EXPORT_ADS_RESULTS',
    ]),
  ),
  active: z.boolean(),
  expiresAt: z.iso.datetime().nullable(),
});

export const workspaceMultiOperationSchema = z.object({
  schemaVersion: z.literal('1.0.0'),
  configuredAt: z.iso.datetime(),
  configuredByUserWorkspaceId: z.uuid(),
  agencies: z.array(workspaceAgencySchema).min(1),
  userAgendas: z.array(workspaceUserAgendaSchema),
  inboxChannels: z.array(workspaceCommercialInboxChannelSchema),
  adsAccounts: z.array(workspaceAdsAccountSchema),
  adsResults: z.array(workspaceAdsResultSchema),
  clientAccessGrants: z.array(workspaceClientAccessSchema),
});

export type WorkspaceMultiOperation = z.infer<
  typeof workspaceMultiOperationSchema
>;
