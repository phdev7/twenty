import { RESERVED_SUBDOMAINS } from 'diex-shared/constants';
import { isValidDiexSubdomain } from 'diex-shared/utils';

export const isSubdomainValid = (subdomain: string) => {
  return (
    isValidDiexSubdomain(subdomain) &&
    !RESERVED_SUBDOMAINS.includes(subdomain.toLowerCase())
  );
};
