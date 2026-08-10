import { getImageForVersion } from '@/cli/utilities/server/docker-container';

describe('getImageForVersion', () => {
  it('defaults to the latest tag', () => {
    expect(getImageForVersion()).toBe('diexcrm/diex-app-dev:latest');
  });

  it('keeps the latest tag as-is', () => {
    expect(getImageForVersion('latest')).toBe(
      'diexcrm/diex-app-dev:latest',
    );
  });

  it('prefixes a bare semver version with v to match published tags', () => {
    expect(getImageForVersion('2.7.5')).toBe('diexcrm/diex-app-dev:v2.7.5');
  });

  it('does not double-prefix an already v-prefixed version', () => {
    expect(getImageForVersion('v2.7.5')).toBe(
      'diexcrm/diex-app-dev:v2.7.5',
    );
  });

  it('prefixes a prerelease semver version', () => {
    expect(getImageForVersion('2.7.5-rc.1')).toBe(
      'diexcrm/diex-app-dev:v2.7.5-rc.1',
    );
  });
});
