import { z } from 'zod';

export const workspaceImportMappingConfidenceSchema = z.enum([
  'EXACT',
  'ALIAS',
  'UNMAPPED',
]);

export const workspaceImportFieldMappingSchema = z.object({
  sourceHeader: z.string().min(1),
  targetField: z.string().min(1).nullable(),
  confidence: workspaceImportMappingConfidenceSchema,
  sampleValues: z.array(z.string()).max(5),
});

export const workspaceImportPlanSchema = z.object({
  schemaVersion: z.literal('1.0.0'),
  planId: z.string().min(1),
  objectName: z.string().min(1),
  objectLabel: z.string().min(1),
  headers: z.array(z.string().min(1)),
  mappings: z.array(workspaceImportFieldMappingSchema),
  dedupeKeys: z.array(z.string().min(1)),
  requiredFields: z.array(z.string().min(1)).default([]),
  requiredFieldsWithoutMapping: z.array(z.string().min(1)),
  warnings: z.array(z.string().min(1)),
  rollback: z.object({
    strategy: z.literal('STAGED_IMPORT'),
    reversible: z.literal(true),
    guidance: z.string().min(1),
  }),
  createdAt: z.iso.datetime(),
});

export type WorkspaceImportPlan = z.infer<typeof workspaceImportPlanSchema>;
