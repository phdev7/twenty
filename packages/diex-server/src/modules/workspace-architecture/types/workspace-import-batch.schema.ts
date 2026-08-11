import { z } from 'zod';

import { workspaceImportPlanSchema } from 'src/modules/workspace-architecture/types/workspace-import-plan.schema';

export const workspaceImportBatchStatusSchema = z.enum([
  'AWAITING_APPROVAL',
  'APPROVED',
  'APPLYING',
  'ACTIVE',
  'FAILED',
  'ROLLED_BACK',
  'ROLLBACK_FAILED',
]);

export const workspaceImportBatchSchema = z.object({
  schemaVersion: z.literal('1.0.0'),
  batchId: z.uuid(),
  planId: z.string().min(1),
  plan: workspaceImportPlanSchema,
  status: workspaceImportBatchStatusSchema,
  sourceHash: z.string().min(1).nullable(),
  totalRows: z.number().int().nonnegative(),
  acceptedRows: z.number().int().nonnegative(),
  skippedRows: z.number().int().nonnegative(),
  failedRows: z.number().int().nonnegative(),
  recordIds: z.array(z.uuid()),
  rowErrors: z.array(
    z.object({
      row: z.number().int().nonnegative(),
      message: z.string().min(1),
    }),
  ),
  createdAt: z.iso.datetime(),
  approvedAt: z.iso.datetime().nullable(),
  appliedAt: z.iso.datetime().nullable(),
  rolledBackAt: z.iso.datetime().nullable(),
  error: z.string().nullable(),
});

export type WorkspaceImportBatch = z.infer<typeof workspaceImportBatchSchema>;
