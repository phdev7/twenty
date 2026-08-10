import { extractDomainFromLink } from 'src/modules/contact-creation-manager/utils/extract-domain-from-link.util';

describe('extractDomainFromLink', () => {
  it('should extract domain from link', () => {
    const link = 'https://www.diex.com';
    const result = extractDomainFromLink(link);

    expect(result).toBe('diex.com');
  });

  it('should extract domain from link without www', () => {
    const link = 'https://diex.com';
    const result = extractDomainFromLink(link);

    expect(result).toBe('diex.com');
  });

  it('should extract domain from link without protocol', () => {
    const link = 'diex.com';
    const result = extractDomainFromLink(link);

    expect(result).toBe('diex.com');
  });

  it('should extract domain from link with path', () => {
    const link = 'https://diex.com/about';
    const result = extractDomainFromLink(link);

    expect(result).toBe('diex.com');
  });
});
