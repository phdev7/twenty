import { getUrlFromFetchRequestInput } from '../getUrlFromFetchRequestInput';

describe('getUrlFromFetchRequestInput', () => {
  it('should return the string when input is a string', () => {
    expect(getUrlFromFetchRequestInput('https://api.diex.test/graphql')).toBe(
      'https://api.diex.test/graphql',
    );
  });

  it('should return the href when input is a URL instance', () => {
    expect(
      getUrlFromFetchRequestInput(new URL('https://api.diex.test/graphql')),
    ).toBe('https://api.diex.test/graphql');
  });

  it('should return the url property when input is a Request object', () => {
    const request = {
      url: 'https://api.diex.test/graphql',
    } as unknown as Request;

    expect(getUrlFromFetchRequestInput(request)).toBe(
      'https://api.diex.test/graphql',
    );
  });
});
