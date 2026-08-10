import { isUrlFromProxiedOrigin } from '../isUrlFromProxiedOrigin';

describe('isUrlFromProxiedOrigin', () => {
  it('should return true when the url origin is in the proxied origins', () => {
    expect(
      isUrlFromProxiedOrigin('https://api.diex.test/graphql', [
        'https://api.diex.test',
      ]),
    ).toBe(true);
  });

  it('should return false when the origin differs', () => {
    expect(
      isUrlFromProxiedOrigin('https://evil.test/graphql', [
        'https://api.diex.test',
      ]),
    ).toBe(false);
  });

  it('should return false when the url is malformed', () => {
    expect(
      isUrlFromProxiedOrigin('not a url', ['https://api.diex.test']),
    ).toBe(false);
  });

  it('should match on origin regardless of path', () => {
    expect(
      isUrlFromProxiedOrigin(
        'https://api.diex.test/rest/front-components/id',
        ['https://api.diex.test'],
      ),
    ).toBe(true);
  });
});
