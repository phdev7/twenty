import { SUBDOMAIN_PATTERN } from '@/constants/SubdomainPattern';

export const isValidDiexSubdomain = (subdomain: string): boolean => {
  return SUBDOMAIN_PATTERN.test(subdomain);
};
