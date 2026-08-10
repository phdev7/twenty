import { z } from 'zod';

const manifestSourceSchema = z.enum(['CORE', 'AI', 'USER']);

export const workspaceOperationManifestItemSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  description: z.string().min(1),
  source: manifestSourceSchema,
  enabled: z.boolean(),
  confirmed: z.boolean(),
  confidence: z.number().min(0).max(100),
  configuration: z.record(z.string(), z.unknown()).default({}),
});

export const workspaceOperationManifestSchema = z.object({
  schemaVersion: z.literal('1.0.0'),
  version: z.number().int().positive(),
  profileVersion: z.number().int().positive(),
  blueprintVersion: z.number().int().positive(),
  goal: z.string().min(1).nullable(),
  segment: z.string().min(1).nullable(),
  capabilities: z.array(workspaceOperationManifestItemSchema),
  entities: z.array(workspaceOperationManifestItemSchema),
  fields: z.array(workspaceOperationManifestItemSchema),
  relations: z.array(workspaceOperationManifestItemSchema),
  pipelines: z.array(workspaceOperationManifestItemSchema),
  pages: z.array(workspaceOperationManifestItemSchema),
  dashboards: z.array(workspaceOperationManifestItemSchema),
  automations: z.array(workspaceOperationManifestItemSchema),
  roles: z.array(workspaceOperationManifestItemSchema),
  channels: z.array(workspaceOperationManifestItemSchema),
  metrics: z.array(z.string().min(1)),
  policies: z.array(z.string().min(1)),
  glossary: z.record(z.string(), z.string()),
  unresolved: z.array(z.string().min(1)),
  generatedAt: z.iso.datetime(),
});

export type WorkspaceOperationManifest = z.infer<
  typeof workspaceOperationManifestSchema
>;
