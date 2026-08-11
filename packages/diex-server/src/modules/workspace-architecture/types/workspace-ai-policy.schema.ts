import { z } from 'zod';

const aiActionTypeSchema = z.enum([
  'QUALIFY',
  'REPLY',
  'FOLLOW_UP',
  'PIPELINE_UPDATE',
  'RISK_MITIGATION',
  'CS_INTERVENTION',
  'EXPANSION',
]);

const aiActionRiskSchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'BLOCKED']);

export const workspaceAiPolicySchema = z.object({
  schemaVersion: z.literal('1.0.0'),
  version: z.number().int().positive(),
  limits: z.object({
    maxProposalsPerHour: z.number().int().positive(),
    maxExecutionsPerHour: z.number().int().positive(),
    maxEstimatedCreditsPerDay: z.number().int().positive(),
    maxExternalMessagesPerDay: z.number().int().positive(),
  }),
  operatingWindow: z.object({
    timezone: z.string().min(1),
    start: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    end: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  }),
  allowedChannels: z.array(z.string().min(1)).max(20),
  blockedActionTypes: z.array(aiActionTypeSchema).max(20),
  minimumApprovalRisk: aiActionRiskSchema,
  updatedAt: z.iso.datetime(),
  updatedBy: z.string().nullable(),
});

export const workspaceAiPolicyUpdateSchema = z.object({
  limits: z
    .object({
      maxProposalsPerHour: z.number().int().positive().max(10_000).optional(),
      maxExecutionsPerHour: z.number().int().positive().max(10_000).optional(),
      maxEstimatedCreditsPerDay: z
        .number()
        .int()
        .positive()
        .max(1_000_000)
        .optional(),
      maxExternalMessagesPerDay: z
        .number()
        .int()
        .positive()
        .max(1_000_000)
        .optional(),
    })
    .optional(),
  operatingWindow: z
    .object({
      timezone: z.string().min(1).optional(),
      start: z
        .string()
        .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
        .optional(),
      end: z
        .string()
        .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
        .optional(),
    })
    .optional(),
  allowedChannels: z.array(z.string().min(1)).max(20).optional(),
  blockedActionTypes: z.array(aiActionTypeSchema).max(20).optional(),
  minimumApprovalRisk: aiActionRiskSchema.optional(),
  updatedBy: z.string().min(1).nullable().optional(),
});

export type WorkspaceAiPolicy = z.infer<typeof workspaceAiPolicySchema>;
export type WorkspaceAiPolicyUpdate = z.infer<
  typeof workspaceAiPolicyUpdateSchema
>;

export const DEFAULT_WORKSPACE_AI_POLICY: WorkspaceAiPolicy = {
  schemaVersion: '1.0.0',
  version: 1,
  limits: {
    maxProposalsPerHour: 10_000,
    maxExecutionsPerHour: 10_000,
    maxEstimatedCreditsPerDay: 1_000_000,
    maxExternalMessagesPerDay: 100_000,
  },
  operatingWindow: {
    timezone: 'America/Sao_Paulo',
    // Start and end equal means 24 hours in the execution policy. Workspaces
    // can narrow this window without blocking night or global operations by
    // default.
    start: '00:00',
    end: '00:00',
  },
  allowedChannels: ['WHATSAPP', 'EMAIL', 'INBOX'],
  blockedActionTypes: [],
  minimumApprovalRisk: 'LOW',
  updatedAt: new Date(0).toISOString(),
  updatedBy: null,
};
