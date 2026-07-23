export const DIEX_MIGRATION_IMPORT_ROUTE = '/diex/migration/import';
export const DIEX_MIGRATION_IMPORT_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER =
  'd1e0b000-0000-4000-8000-000000000008';
export const DIEX_MIGRATION_SOURCE_TEAM_CLAIM_KEY =
  'diex:migration:source-team';
export const DIEX_MIGRATION_BATCH_SIZE = 40;

export const DIEX_MIGRATION_ENTITIES = [
  'companies',
  'people',
  'offers',
  'opportunities',
  'tasks',
  'notes',
  'successPlans',
  'successMilestones',
  'commercialSignals',
  'inboxConversations',
  'inboxMessages',
  'aiActions',
] as const;

export type DiexMigrationEntity =
  (typeof DIEX_MIGRATION_ENTITIES)[number];
