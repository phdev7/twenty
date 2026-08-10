import { writeFile } from 'node:fs/promises';
import * as path from 'path';
import { beforeAll } from 'vitest';

import { ensureDir } from '@/cli/utilities/file/fs-utils';
import { getConfigPath } from '@/cli/utilities/config/get-config-path';

const testConfigPath = getConfigPath(true);

beforeAll(async () => {
  const apiUrl = process.env.DIEX_API_URL;
  const token = process.env.DIEX_API_KEY;

  if (!apiUrl || !token) {
    throw new Error(
      'DIEX_API_URL and DIEX_API_KEY must be set.\n' +
        'Run: diex docker:start --test\n' +
        'Or set them in vitest env config.',
    );
  }

  const response = await fetch(`${apiUrl}/healthz`).catch(() => null);

  if (!response?.ok) {
    throw new Error(
      `Diex server not reachable at ${apiUrl}. ` +
        'Run: diex docker:start --test',
    );
  }

  await ensureDir(path.dirname(testConfigPath));

  await writeFile(
    testConfigPath,
    JSON.stringify(
      {
        remotes: {
          local: { apiUrl, apiKey: token },
        },
        defaultRemote: 'local',
      },
      null,
      2,
    ),
  );
});
