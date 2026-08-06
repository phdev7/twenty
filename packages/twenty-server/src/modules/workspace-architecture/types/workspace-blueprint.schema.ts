import { z } from 'zod';

import { workspaceOperationProfileSchema } from 'src/modules/workspace-architecture/types/workspace-operation-profile.schema';

export const workspaceBlueprintStatusSchema = z.enum([
  'DRAFT',
  'VALIDATING',
  'AWAITING_APPROVAL',
  'APPLYING',
  'ACTIVE',
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

export const workspaceBlueprintSchema = z.object({
  id: z.uuid(),
  version: z.number().int().positive(),
  status: workspaceBlueprintStatusSchema,
  profileVersion: z.number().int().positive(),
  operationProfile: workspaceOperationProfileSchema,
  selectedTemplates: z.array(
    z.object({
      id: z.string().min(1),
      version: z.string().min(1),
      reason: z.string().min(1),
      confidence: z.number().min(0).max(100),
      optional: z.boolean(),
    }),
  ),
  objects: z.array(workspaceBlueprintComponentSchema),
  fields: z.array(workspaceBlueprintComponentSchema),
  relations: z.array(workspaceBlueprintComponentSchema),
  pipelines: z.array(workspaceBlueprintComponentSchema),
  pages: z.array(workspaceBlueprintComponentSchema),
  views: z.array(workspaceBlueprintComponentSchema),
  navigation: z.array(workspaceBlueprintComponentSchema),
  dashboards: z.array(workspaceBlueprintComponentSchema),
  metrics: z.array(z.string()),
  automations: z.array(workspaceBlueprintComponentSchema),
  roles: z.array(workspaceBlueprintComponentSchema),
  permissions: z.array(z.string()),
  aiContext: z.record(z.string(), z.unknown()),
  integrations: z.array(workspaceBlueprintComponentSchema),
  hypotheses: z.array(z.string()),
  optionalItems: z.array(z.string()),
  rejectedItems: z.array(z.string()),
  alerts: z.array(z.string()),
  dependencies: z.array(z.string()),
  createdAt: z.iso.datetime(),
});

export type WorkspaceBlueprint = z.infer<typeof workspaceBlueprintSchema>;
export type WorkspaceBlueprintStatus = z.infer<
  typeof workspaceBlueprintStatusSchema
>;
