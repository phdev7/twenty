import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { getEngineVersionRange } from '@/cli/utilities/version/get-engine-version-range';

describe('getEngineVersionRange', () => {
  const createdDirs: string[] = [];

  const seed = (contents: unknown): string => {
    const dir = mkdtempSync(join(tmpdir(), 'diex-app-server-range-'));

    writeFileSync(join(dir, 'package.json'), JSON.stringify(contents), 'utf-8');
    createdDirs.push(dir);

    return dir;
  };

  afterEach(() => {
    while (createdDirs.length > 0) {
      rmSync(createdDirs.pop() as string, { recursive: true, force: true });
    }
  });

  it('returns the engines.diex range', () => {
    const dir = seed({ engines: { diex: '>=2.2.0' } });

    expect(getEngineVersionRange(dir)).toBe('>=2.2.0');
  });

  it('trims surrounding whitespace', () => {
    const dir = seed({ engines: { diex: '  ^2.2.0  ' } });

    expect(getEngineVersionRange(dir)).toBe('^2.2.0');
  });

  it('returns null when engines.diex is missing', () => {
    const dir = seed({ engines: { node: '^24.0.0' } });

    expect(getEngineVersionRange(dir)).toBeNull();
  });

  it('returns null when engines.diex is empty', () => {
    const dir = seed({ engines: { diex: '   ' } });

    expect(getEngineVersionRange(dir)).toBeNull();
  });

  it('returns null when engines.diex is not a string', () => {
    const dir = seed({ engines: { diex: 2 } });

    expect(getEngineVersionRange(dir)).toBeNull();
  });

  it('returns null when no package.json exists', () => {
    const dir = mkdtempSync(join(tmpdir(), 'diex-app-server-range-empty-'));

    createdDirs.push(dir);

    expect(getEngineVersionRange(dir)).toBeNull();
  });
});
