import { getUniqueHttpOriginsFromUrls } from '../getUniqueHttpOriginsFromUrls';

describe('getUniqueHttpOriginsFromUrls', () => {
  it('should reduce urls to their origins', () => {
    expect(
      getUniqueHttpOriginsFromUrls([
        'https://api.diex.test/graphql',
        'http://functions.diex.test/base/path',
      ]),
    ).toEqual(['https://api.diex.test', 'http://functions.diex.test']);
  });

  it('should deduplicate identical origins', () => {
    expect(
      getUniqueHttpOriginsFromUrls([
        'https://api.diex.test/graphql',
        'https://api.diex.test/rest/front-components/id',
      ]),
    ).toEqual(['https://api.diex.test']);
  });

  it('should drop undefined urls', () => {
    expect(
      getUniqueHttpOriginsFromUrls([undefined, 'https://api.diex.test']),
    ).toEqual(['https://api.diex.test']);
  });

  it('should drop malformed urls', () => {
    expect(
      getUniqueHttpOriginsFromUrls(['not a url', 'https://api.diex.test']),
    ).toEqual(['https://api.diex.test']);
  });

  it('should drop urls with non http schemes', () => {
    expect(
      getUniqueHttpOriginsFromUrls([
        'data:text/html,<script>alert(1)</script>',
        'file:///etc/passwd',
        'blob:https://api.diex.test/id',
        'https://api.diex.test',
      ]),
    ).toEqual(['https://api.diex.test']);
  });
});
