import { z } from 'zod';

export const workspacePageLifecycleSchema = z.enum([
  'CORE',
  'RECOMMENDED',
  'CUSTOM',
]);

export const workspacePageStatusSchema = z.enum([
  'ACTIVE',
  'HIDDEN',
  'ARCHIVED',
]);

export const workspacePageRendererSchema = z.enum([
  'INBOX',
  'DASHBOARD',
  'PIPELINE',
  'CALENDAR',
  'OPERATIONS',
  'CUSTOM',
]);

export const workspacePageCopyOriginSchema = z.enum([
  'PROFILE',
  'USER',
  'AI',
]);

export const workspacePageBlockTypeSchema = z.enum([
  'KPI',
  'LIST',
  'PIPELINE',
  'INBOX',
  'CALENDAR',
  'TIMELINE',
  'CHECKLIST',
  'AI_SUMMARY',
]);

export type WorkspacePageBlockType = z.infer<
  typeof workspacePageBlockTypeSchema
>;
export type WorkspacePageRenderer = z.infer<typeof workspacePageRendererSchema>;

export const workspacePageDataContractKindSchema = z.enum([
  'OBJECT',
  'METRIC',
  'RELATION',
  'INBOX',
  'PIPELINE',
  'TASK',
  'CUSTOM',
]);

export const workspacePageDataClassificationSchema = z.enum([
  'PUBLIC_WORKSPACE',
  'INTERNAL',
  'CONFIDENTIAL',
  'SENSITIVE',
]);

export const workspacePageDataContractSchema = z.object({
  key: z.string().min(1),
  source: z.string().min(1),
  kind: workspacePageDataContractKindSchema,
  objectName: z.string().min(1).nullable().default(null),
  objectMetadataId: z.uuid().nullable().default(null),
  fieldNames: z.array(z.string().min(1)).default([]),
  dataClassification: workspacePageDataClassificationSchema
    .default('INTERNAL'),
  required: z.boolean().default(false),
  fallback: z.string().min(1),
});

export const workspacePageActionSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  route: z.string().min(1),
  confirmationRequired: z.boolean().default(false),
  requiresApproval: z.boolean().default(false),
  requiredPermission: z.string().min(1).default('workspace_access'),
});

export const workspacePageCapabilityContractSchema = z.object({
  version: z.string().min(1),
  key: z.string().min(1),
  dependencies: z.array(z.string().min(1)).default([]),
  fallbackRoute: z.string().min(1).default('/diex/first-steps'),
});

export type WorkspacePageDataContract = z.infer<
  typeof workspacePageDataContractSchema
>;
export type WorkspacePageAction = z.infer<typeof workspacePageActionSchema>;

export const workspacePageBlockSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  type: workspacePageBlockTypeSchema.default('LIST'),
  title: z.string().min(1),
  description: z.string().min(1),
  dataSources: z.array(z.string().min(1)).default([]),
  dataContracts: z.array(workspacePageDataContractSchema).default([]),
  actions: z.array(workspacePageActionSchema).default([]),
  actionLabel: z.string().min(1).default('Abrir primeiros passos'),
  actionRoute: z.string().min(1).default('/diex/first-steps'),
  sourceTemplateIds: z.array(z.string().min(1)).default([]),
  configuration: z.record(z.string(), z.unknown()).default({}),
  position: z.number().int().nonnegative().default(0),
});

export const workspacePageCatalogItemSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  description: z.string().min(1),
  route: z.string().min(1),
  nativeRoute: z.string().min(1).nullable().default(null),
  renderer: workspacePageRendererSchema.default('OPERATIONS'),
  icon: z.string().min(1).default('chart'),
  navigationGroup: z.string().min(1).default('Operação'),
  capabilities: z.array(z.string().min(1)).default([]),
  blocks: z.array(workspacePageBlockSchema).default([]),
  lifecycle: workspacePageLifecycleSchema,
  copyOrigin: workspacePageCopyOriginSchema.default('PROFILE'),
  status: workspacePageStatusSchema,
  sourceTemplateIds: z.array(z.string().min(1)),
  primaryAction: z.string().min(1),
  dataSources: z.array(z.string().min(1)),
  dataContracts: z.array(workspacePageDataContractSchema).default([]),
  actions: z.array(workspacePageActionSchema).default([]),
  capabilityContract: workspacePageCapabilityContractSchema
    .nullable()
    .default(null),
  emptyState: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    actionLabel: z.string().min(1),
    actionRoute: z.string().min(1),
  }),
  permissions: z.array(z.string().min(1)),
  aiGenerated: z.boolean(),
  editable: z.boolean(),
  showInNavigation: z.boolean(),
  position: z.number().int().nonnegative(),
  createdAt: z.iso.datetime(),
});

export const workspacePageCatalogStateSchema = z.object({
  version: z.number().int().positive(),
  blueprintVersion: z.number().int().positive().nullable(),
  profileVersion: z.number().int().positive().nullable(),
  navigationMode: z.literal('ADAPTIVE'),
  items: z.array(workspacePageCatalogItemSchema),
  updatedAt: z.iso.datetime(),
});

export type WorkspacePageCatalogItem = z.infer<
  typeof workspacePageCatalogItemSchema
>;
export type WorkspacePageBlock = z.infer<typeof workspacePageBlockSchema>;
export type WorkspacePageCatalogState = z.infer<
  typeof workspacePageCatalogStateSchema
>;
