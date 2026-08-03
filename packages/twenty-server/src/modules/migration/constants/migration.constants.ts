export const DIEX_MIGRATION_IMPORT_ROUTE = '/diex/migration/import';
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
  'customerRenewals',
  'inboxConversations',
  'inboxMessages',
  'aiActions',
] as const;

export type DiexMigrationEntity = (typeof DIEX_MIGRATION_ENTITIES)[number];
