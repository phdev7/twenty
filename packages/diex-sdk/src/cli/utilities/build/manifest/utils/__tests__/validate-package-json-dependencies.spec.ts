import { validatePackageJsonDependencies } from '@/cli/utilities/build/manifest/utils/validate-package-json-dependencies';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const writeTempPackageJson = async (
  packageJson: Record<string, unknown> | null,
): Promise<string> => {
  const appPath = await mkdtemp(join(tmpdir(), 'diex-sdk-deps-'));

  if (packageJson !== null) {
    await writeFile(
      join(appPath, 'package.json'),
      JSON.stringify(packageJson, null, 2),
    );
  }

  return appPath;
};

describe('validatePackageJsonDependencies', () => {
  let appPath: string;

  afterEach(async () => {
    if (appPath) {
      await rm(appPath, { recursive: true, force: true });
    }
  });

  it('should warn when diex-sdk is listed under dependencies', async () => {
    appPath = await writeTempPackageJson({
      dependencies: { 'diex-sdk': '^2.8.0' },
    });

    const warnings = await validatePackageJsonDependencies(appPath);

    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('diex-sdk');
    expect(warnings[0]).toContain('devDependencies');
  });

  it('should warn when diex-client-sdk is listed under dependencies', async () => {
    appPath = await writeTempPackageJson({
      dependencies: { 'diex-client-sdk': '^2.8.0' },
    });

    const warnings = await validatePackageJsonDependencies(appPath);

    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('diex-client-sdk');
    expect(warnings[0]).toContain('devDependencies');
  });

  it('should warn for both SDK packages when both are listed under dependencies', async () => {
    appPath = await writeTempPackageJson({
      dependencies: { 'diex-sdk': '^2.8.0', 'diex-client-sdk': '^2.8.0' },
    });

    const warnings = await validatePackageJsonDependencies(appPath);

    expect(warnings).toHaveLength(2);
    expect(warnings.some((warning) => warning.includes('diex-sdk'))).toBe(
      true,
    );
    expect(
      warnings.some((warning) => warning.includes('diex-client-sdk')),
    ).toBe(true);
  });

  it('should not warn when both SDK packages are listed under devDependencies', async () => {
    appPath = await writeTempPackageJson({
      devDependencies: {
        'diex-sdk': '^2.8.0',
        'diex-client-sdk': '^2.8.0',
      },
    });

    const warnings = await validatePackageJsonDependencies(appPath);

    expect(warnings).toEqual([]);
  });

  it('should not warn when the SDK packages are absent from dependencies', async () => {
    appPath = await writeTempPackageJson({
      dependencies: { 'some-other-package': '^1.0.0' },
    });

    const warnings = await validatePackageJsonDependencies(appPath);

    expect(warnings).toEqual([]);
  });

  it('should not warn when package.json is missing', async () => {
    appPath = await writeTempPackageJson(null);

    const warnings = await validatePackageJsonDependencies(appPath);

    expect(warnings).toEqual([]);
  });
});
