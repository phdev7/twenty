import { z } from 'zod';

export const workspaceChangeActionSchema = z.enum([
  'CREATE',
  'UPDATE',
  'ARCHIVE',
  'REORDER',
  'ACTIVATE',
  'DEACTIVATE',
  'NO_CHANGE',
]);

export const workspaceChangeRiskSchema = z.enum([
  'LOW',
  'MEDIUM',
  'HIGH',
  'BLOCKED',
]);

export const workspaceChangeOperationSchema = z.object({
  id: z.uuid(),
  action: workspaceChangeActionSchema,
  resourceType: z.enum([
    'OBJECT',
    'FIELD',
    'RELATION',
    'VIEW',
    'PIPELINE',
    'PAGE_LAYOUT',
    'NAVIGATION',
    'DASHBOARD',
    'WORKFLOW',
    'ROLE',
    'PERMISSION',
    'AI_CONTEXT',
    'INTEGRATION',
  ]),
  resourceKey: z.string().min(1),
  label: z.string().min(1),
  reason: z.string().min(1),
  impact: z.string().min(1),
  dependencies: z.array(z.string()),
  reversible: z.boolean(),
  risk: workspaceChangeRiskSchema,
  requiresMigration: z.boolean(),
  dataImpact: z.string(),
  requiredPermission: z.string(),
  currentState: z.record(z.string(), z.unknown()).nullable(),
  desiredState: z.record(z.string(), z.unknown()).nullable(),
  blockedReason: z.string().nullable(),
});

export const workspaceChangeSetSchema = z.object({
  id: z.uuid(),
  blueprintId: z.uuid(),
  blueprintVersion: z.number().int().positive(),
  idempotencyKey: z.string().min(16),
  status: z.enum([
    'DRAFT',
    'VALIDATING',
    'AWAITING_APPROVAL',
    'APPROVED',
    'APPLYING',
    'ACTIVE',
    'PARTIALLY_APPLIED',
    'FAILED',
    'ROLLED_BACK',
  ]),
  operations: z.array(workspaceChangeOperationSchema),
  warnings: z.array(z.string()),
  validationErrors: z.array(z.string()),
  approvedAt: z.iso.datetime().nullable(),
  appliedAt: z.iso.datetime().nullable(),
  publication: z
    .object({
      nativeOperationCount: z.number().int().nonnegative(),
      manifestOperationCount: z.number().int().nonnegative(),
      pendingNativeMaterialization: z.boolean(),
      pendingNativeResourceTypes: z.array(z.string().min(1)).default([]),
      materializedAdapters: z.array(z.string().min(1)),
      rollback: z
        .object({
          attempted: z.boolean(),
          completed: z.boolean(),
          rolledBackOperationIds: z.array(z.uuid()),
          failedOperationIds: z.array(z.uuid()),
        })
        .default({
          attempted: false,
          completed: false,
          rolledBackOperationIds: [],
          failedOperationIds: [],
        }),
    })
    .default({
      nativeOperationCount: 0,
      manifestOperationCount: 0,
      pendingNativeMaterialization: false,
      pendingNativeResourceTypes: [],
      materializedAdapters: [],
      rollback: {
        attempted: false,
        completed: false,
        rolledBackOperationIds: [],
        failedOperationIds: [],
      },
    }),
  createdAt: z.iso.datetime(),
});

export type WorkspaceChangeOperation = z.infer<
  typeof workspaceChangeOperationSchema
>;
export type WorkspaceChangeSet = z.infer<typeof workspaceChangeSetSchema>;
