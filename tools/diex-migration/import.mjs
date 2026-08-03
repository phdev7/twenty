import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline';

const argumentsList = process.argv.slice(2);
const exportDirectory = argumentsList.find(
  (argument) => !argument.startsWith('--'),
);
const apply = argumentsList.includes('--apply');
const onlyArgument = argumentsList.find((argument) =>
  argument.startsWith('--only='),
);
const onlyEntity = onlyArgument?.slice('--only='.length);
const batchSize = 40;

if (!exportDirectory) {
  throw new Error(
    'Usage: node import.mjs <export-directory> [--apply] [--only=entity]',
  );
}

const apiKey = process.env.TWENTY_API_KEY?.trim();
const routeUrl = process.env.TWENTY_MIGRATION_ROUTE_URL?.trim();

if (!routeUrl || !apiKey) {
  throw new Error(
    'TWENTY_API_KEY and TWENTY_MIGRATION_ROUTE_URL are required. The legacy Diex app route is no longer available.',
  );
}

const manifestPath = path.join(exportDirectory, 'manifest.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));

if (
  manifest.schemaVersion !== 1 ||
  manifest.source !== 'diex-crm' ||
  typeof manifest.sourceTeamId !== 'string'
) {
  throw new Error('Unsupported or invalid migration manifest.');
}

if (
  manifest.security?.credentialsIncluded !== false ||
  manifest.security?.providerPayloadsIncluded !== false
) {
  throw new Error('The export security declaration is invalid.');
}

if (
  apply &&
  process.env.DIEX_MIGRATION_CONFIRM !== manifest.sourceTeamId
) {
  throw new Error(
    'For --apply, DIEX_MIGRATION_CONFIRM must exactly match the manifest sourceTeamId.',
  );
}

const migrations = [
  ['companies', 'companies.jsonl'],
  ['people', 'people.jsonl'],
  ['offers', 'offers.jsonl'],
  ['opportunities', 'opportunities.jsonl'],
  ['tasks', 'tasks.jsonl'],
  ['notes', 'notes.jsonl'],
  ['successPlans', 'success-plans.jsonl'],
  ['successMilestones', 'success-milestones.jsonl'],
  ['commercialSignals', 'commercial-signals.jsonl'],
  ['inboxConversations', 'inbox-conversations.jsonl'],
  ['inboxMessages', 'inbox-messages.jsonl'],
  ['aiActions', 'ai-actions.jsonl'],
];

if (
  onlyEntity &&
  !migrations.some(([entity]) => entity === onlyEntity)
) {
  throw new Error(`Unknown entity for --only: ${onlyEntity}`);
}

const verifyFile = async (fileName) => {
  const content = await readFile(path.join(exportDirectory, fileName));
  const digest = createHash('sha256').update(content).digest('hex');
  const expected = manifest.files?.[fileName]?.sha256;

  if (!expected || digest !== expected) {
    throw new Error(`Checksum mismatch for ${fileName}.`);
  }
};

const parseErrorResponse = async (response) => {
  const text = await response.text().catch(() => '');

  try {
    const parsed = JSON.parse(text);

    return (
      parsed.messages?.[0] ??
      parsed.message ??
      parsed.error ??
      `HTTP ${response.status}`
    );
  } catch {
    return text || `HTTP ${response.status}`;
  }
};

const sendBatch = async (entity, records) => {
  const response = await fetch(routeUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      sourceTeamId: manifest.sourceTeamId,
      entity,
      records,
      confirmImport: apply,
    }),
    redirect: 'error',
  });

  if (!response.ok) {
    throw new Error(
      `Import request failed for ${entity}: ${await parseErrorResponse(response)}`,
    );
  }

  return response.json();
};

const totals = {
  received: 0,
  creates: 0,
  updates: 0,
  skipped: 0,
  unresolvedRelations: 0,
  errors: 0,
};

for (const [entity, fileName] of migrations) {
  if (onlyEntity && entity !== onlyEntity) {
    continue;
  }

  await verifyFile(fileName);

  const lineReader = readline.createInterface({
    input: createReadStream(path.join(exportDirectory, fileName), {
      encoding: 'utf8',
    }),
    crlfDelay: Infinity,
  });
  let batch = [];

  const flush = async () => {
    if (batch.length === 0) {
      return;
    }

    const result = await sendBatch(entity, batch);

    totals.received += result.received ?? 0;
    totals.creates += result.creates ?? 0;
    totals.updates += result.updates ?? 0;
    totals.skipped += result.skipped ?? 0;
    totals.unresolvedRelations += result.unresolvedRelations ?? 0;
    totals.errors += Array.isArray(result.errors) ? result.errors.length : 0;

    process.stdout.write(
      `${entity}: ${result.received ?? 0} records, ${result.creates ?? 0} creates, ${result.updates ?? 0} updates, ${result.skipped ?? 0} skipped\n`,
    );

    batch = [];
  };

  for await (const line of lineReader) {
    if (!line.trim()) {
      continue;
    }

    batch.push(JSON.parse(line));

    if (batch.length === batchSize) {
      await flush();
    }
  }

  await flush();
}

process.stdout.write(
  `${apply ? 'APPLY' : 'PREVIEW'} complete: ${totals.received} received, ${totals.creates} creates, ${totals.updates} updates, ${totals.skipped} skipped, ${totals.unresolvedRelations} unresolved relations, ${totals.errors} errors.\n`,
);

if (totals.errors > 0 || totals.unresolvedRelations > 0) {
  process.exitCode = 2;
}
