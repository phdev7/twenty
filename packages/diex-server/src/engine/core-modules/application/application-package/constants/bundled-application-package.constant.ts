import { access } from 'fs/promises';
import { isAbsolute, relative, resolve } from 'path';

const getBundledApplicationRoots = (): string[] => [
  ...(process.env.BUNDLED_APPLICATIONS_PATH
    ? [resolve(process.env.BUNDLED_APPLICATIONS_PATH)]
    : []),
  '/app/bundled-apps',
  resolve(process.cwd(), 'bundled-apps'),
];

export const resolveBundledApplicationPackagePath = async (
  sourcePackage: string,
): Promise<string> => {
  if (!sourcePackage || sourcePackage.trim() !== sourcePackage) {
    throw new Error('Bundled application package name must be non-empty');
  }

  for (const root of getBundledApplicationRoots()) {
    const candidate = resolve(root, sourcePackage);
    const relativeCandidate = relative(root, candidate);

    if (relativeCandidate.startsWith('..') || isAbsolute(relativeCandidate)) {
      throw new Error(
        `Bundled application package path escapes configured root: ${sourcePackage}`,
      );
    }

    try {
      await access(resolve(candidate, 'manifest.json'));
      await access(resolve(candidate, 'package.json'));

      return candidate;
    } catch {
      // Try the next supported runtime location.
    }
  }

  throw new Error(
    `Bundled application package "${sourcePackage}" was not found in the configured bundled-app roots`,
  );
};
