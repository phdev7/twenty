import { isValidDiexSubdomain } from '@/utils/validation/isValidDiexSubdomain';

describe('isValidDiexSubdomain', () => {
  describe('valid subdomains', () => {
    it('should accept standard alphanumeric subdomains', () => {
      expect(isValidDiexSubdomain('abc')).toBe(true);
      expect(isValidDiexSubdomain('test123')).toBe(true);
      expect(isValidDiexSubdomain('company1')).toBe(true);
      expect(isValidDiexSubdomain('workspace2024')).toBe(true);
    });

    it('should accept subdomains with hyphens in the middle', () => {
      expect(isValidDiexSubdomain('my-company')).toBe(true);
      expect(isValidDiexSubdomain('test-workspace')).toBe(true);
      expect(isValidDiexSubdomain('multi-word-subdomain')).toBe(true);
      expect(isValidDiexSubdomain('a-b-c-d-e')).toBe(true);
    });

    it('should accept minimum length subdomains (3 characters)', () => {
      expect(isValidDiexSubdomain('abc')).toBe(true);
      expect(isValidDiexSubdomain('a1b')).toBe(true);
      expect(isValidDiexSubdomain('a-b')).toBe(true);
    });

    it('should accept maximum length subdomains (30 characters)', () => {
      const exactly30 = 'a' + 'b'.repeat(28) + 'c';

      expect(exactly30.length).toBe(30);
      expect(isValidDiexSubdomain(exactly30)).toBe(true);
    });

    it('should accept numeric-only subdomains', () => {
      expect(isValidDiexSubdomain('123')).toBe(true);
      expect(isValidDiexSubdomain('456789')).toBe(true);
      expect(isValidDiexSubdomain('1-2-3')).toBe(true);
    });
  });

  describe('invalid subdomains', () => {
    it('should reject empty strings', () => {
      expect(isValidDiexSubdomain('')).toBe(false);
    });

    it('should reject subdomains shorter than 3 characters', () => {
      expect(isValidDiexSubdomain('a')).toBe(false);
      expect(isValidDiexSubdomain('ab')).toBe(false);
    });

    it('should reject subdomains longer than 30 characters', () => {
      const tooLong = 'a'.repeat(31);

      expect(isValidDiexSubdomain(tooLong)).toBe(false);
    });

    it('should reject subdomains starting with a hyphen', () => {
      expect(isValidDiexSubdomain('-test')).toBe(false);
      expect(isValidDiexSubdomain('-abc')).toBe(false);
    });

    it('should reject subdomains ending with a hyphen', () => {
      expect(isValidDiexSubdomain('test-')).toBe(false);
      expect(isValidDiexSubdomain('abc-')).toBe(false);
    });

    it('should reject subdomains with uppercase letters', () => {
      expect(isValidDiexSubdomain('Test')).toBe(false);
      expect(isValidDiexSubdomain('MyCompany')).toBe(false);
      expect(isValidDiexSubdomain('WORKSPACE')).toBe(false);
    });

    it('should reject subdomains with special characters', () => {
      expect(isValidDiexSubdomain('test@company')).toBe(false);
      expect(isValidDiexSubdomain('my_workspace')).toBe(false);
      expect(isValidDiexSubdomain('test.company')).toBe(false);
      expect(isValidDiexSubdomain('workspace#1')).toBe(false);
    });

    it('should reject subdomains with spaces', () => {
      expect(isValidDiexSubdomain('test company')).toBe(false);
      expect(isValidDiexSubdomain(' test')).toBe(false);
      expect(isValidDiexSubdomain('test ')).toBe(false);
    });

    it('should reject subdomains starting with "api-"', () => {
      expect(isValidDiexSubdomain('api-test')).toBe(false);
      expect(isValidDiexSubdomain('api-company')).toBe(false);
      expect(isValidDiexSubdomain('api-123')).toBe(false);
    });

    it('should accept subdomains containing "api" not as prefix', () => {
      expect(isValidDiexSubdomain('myapi')).toBe(true);
      expect(isValidDiexSubdomain('rapid')).toBe(true);
    });

    it('should reject subdomains with only hyphens', () => {
      expect(isValidDiexSubdomain('---')).toBe(false);
      expect(isValidDiexSubdomain('----')).toBe(false);
    });

    it('should reject whitespace-only strings', () => {
      expect(isValidDiexSubdomain('   ')).toBe(false);
      expect(isValidDiexSubdomain('\t')).toBe(false);
      expect(isValidDiexSubdomain('\n')).toBe(false);
    });

    it('should reject unicode characters', () => {
      expect(isValidDiexSubdomain('café')).toBe(false);
      expect(isValidDiexSubdomain('tëst')).toBe(false);
    });
  });
});
