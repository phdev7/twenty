import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const [exportDirectory, sourceTeamId, exportedAt] = process.argv.slice(2);

if (!exportDirectory || !sourceTeamId || !exportedAt) {
  throw new Error(
    'Usage: node build-manifest.mjs <export-directory> <source-team-id> <exported-at>',
  );
}

const files = [
  'companies.jsonl',
  'people.jsonl',
  'offers.jsonl',
  'opportunities.jsonl',
  'tasks.jsonl',
  'notes.jsonl',
  'success-plans.jsonl',
  'success-milestones.jsonl',
  'commercial-signals.jsonl',
  'inbox-conversations.jsonl',
  'inbox-messages.jsonl',
  'ai-actions.jsonl',
];

const manifestFiles = {};

for (const file of files) {
  const content = await readFile(path.join(exportDirectory, file));
  const text = content.toString('utf8');

  manifestFiles[file] = {
    records: text ? text.split('\n').filter(Boolean).length : 0,
    sha256: createHash('sha256').update(content).digest('hex'),
  };
}

const manifest = {
  schemaVersion: 1,
  source: 'diex-crm',
  sourceTeamId,
  exportedAt,
  security: {
    credentialsIncluded: false,
    providerPayloadsIncluded: false,
    deletedRecordsIncluded: false,
  },
  files: manifestFiles,
};

await writeFile(
  path.join(exportDirectory, 'manifest.json'),
  `${JSON.stringify(manifest, null, 2)}\n`,
  { mode: 0o600 },
);
