import { z } from 'zod';

import { workspaceOperationProfileSchema } from 'src/modules/workspace-architecture/types/workspace-operation-profile.schema';
import { workspaceOperationManifestSchema } from 'src/modules/workspace-architecture/types/workspace-operation-manifest.schema';

export const workspaceBlueprintStatusSchema = z.enum([
  'DRAFT',
  'VALIDATING',
  'AWAITING_APPROVAL',
  'APPLYING',
  'ACTIVE',
  'PARTIALLY_APPLIED',
  'FAILED',
  'ROLLED_BACK',
]);

export const workspaceBlueprintComponentSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  description: z.string(),
  required: z.boolean(),
  benefit: z.string(),
  sourceTemplateIds: z.array(z.string().min(1)),
  configuration: z.record(z.string(), z.unknown()).optional(),
});

export type WorkspaceBlueprintComponent = z.infer<
  typeof workspaceBlueprintComponentSchema
>;

export const workspaceBlueprintSchema = z.object({
  id: z.uuid(),
  version: z.number().int().positive(),
  status: workspaceBlueprintStatusSchema,
  profileVersion: z.number().int().positive(),
  operationProfile: workspaceOperationProfileSchema,
  operationManifest: workspaceOperationManifestSchema.nullable().default(null),
  selectedTemplates: z.array(
    z.object({
      id: z.string().min(1),
      version: z.string().min(1),
      reason: z.string().min(1),
      confidence: z.number().min(0).max(100),
      optional: z.boolean(),
      matchedCriteria: z.array(z.string().min(1)).default([]),
      matchedSegments: z.array(z.string().min(1)).default([]),
      excludedBy: z.array(z.string().min(1)).default([]),
      requiresConfirmation: z.boolean().default(false),
    }),
  ),
  objects: z.array(workspaceBlueprintComponentSchema),
  fields: z.array(workspaceBlueprintComponentSchema),
  relations: z.array(workspaceBlueprintComponentSchema),
  pipelines: z.array(workspaceBlueprintComponentSchema),
  pages: z.array(workspaceBlueprintComponentSchema),
  blocks: z.array(workspaceBlueprintComponentSchema).default([]),
  views: z.array(workspaceBlueprintComponentSchema),
  navigation: z.array(workspaceBlueprintComponentSchema),
  dashboards: z.array(workspaceBlueprintComponentSchema),
  metrics: z.array(z.string()),
  automations: z.array(workspaceBlueprintComponentSchema),
  roles: z.array(workspaceBlueprintComponentSchema),
  permissions: z.array(z.string()),
  aiContext: z.record(z.string(), z.unknown()),
  integrations: z.array(workspaceBlueprintComponentSchema),
  operationalRules: z.array(z.string()).default([]),
  filters: z.array(z.string()).default([]),
  glossary: z.record(z.string(), z.string()).default({}),
  aiInstructions: z.array(z.string()).default([]),
  forbiddenRules: z.array(z.string()).default([]),
  readinessCriteria: z.array(z.string()).default([]),
  selectedCapabilities: z.array(z.string().min(1)).default([]),
  hypotheses: z.array(z.string()),
  optionalItems: z.array(z.string()),
  rejectedItems: z.array(z.string()),
  alerts: z.array(z.string()),
  dependencies: z.array(z.string()),
  publishedOperations: z
    .array(
      z.object({
        operationId: z.uuid(),
        resourceType: z.string().min(1),
        resourceKey: z.string().min(1),
        publishedAt: z.iso.datetime(),
        adapter: z
          .string()
          .min(1)
          .default('workspace-operation-manifest-adapter@1.0.0'),
        materialization: z
          .enum(['DIEX_CATALOG', 'MANIFEST'])
          .default('MANIFEST'),
      }),
    )
    .default([]),
  createdAt: z.iso.datetime(),
});

export type WorkspaceBlueprint = z.infer<typeof workspaceBlueprintSchema>;
export type WorkspaceBlueprintStatus = z.infer<
  typeof workspaceBlueprintStatusSchema
>;
