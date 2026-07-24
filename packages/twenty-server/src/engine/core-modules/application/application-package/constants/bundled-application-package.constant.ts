import { access } from 'fs/promises';
import { resolve } from 'path';

export const DIEX_CORE_BUNDLED_PACKAGE_NAME = 'diex-crm-core';

const getDiexCorePackageCandidates = (): string[] => [
  ...(process.env.DIEX_CORE_BUNDLED_APP_PATH
    ? [resolve(process.env.DIEX_CORE_BUNDLED_APP_PATH)]
    : []),
  '/app/bundled-apps/diex-crm-core',
  resolve(process.cwd(), 'packages/twenty-apps/internal/diex/.twenty/output'),
  resolve(process.cwd(), '../twenty-apps/internal/diex/.twenty/output'),
];

export const resolveBundledApplicationPackagePath = async (
  sourcePackage: string,
): Promise<string> => {
  if (sourcePackage !== DIEX_CORE_BUNDLED_PACKAGE_NAME) {
    throw new Error(`Unknown bundled application package: ${sourcePackage}`);
  }

  for (const candidate of getDiexCorePackageCandidates()) {
    try {
      await access(resolve(candidate, 'manifest.json'));
      await access(resolve(candidate, 'package.json'));

      return candidate;
    } catch {
      // Try the next supported runtime location.
    }
  }

  throw new Error(
    `Bundled application package "${sourcePackage}" was not found`,
  );
};
