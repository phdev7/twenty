import { RESERVED_SUBDOMAINS } from 'twenty-shared/constants';
import { isValidTwentySubdomain } from 'twenty-shared/utils';

// Upstream reserves generic names like api, admin and docs, but nothing this
// company answers on. A customer workspace that took one of these would own a
// hostname the business needs for a product, an existing deployment or the
// operator's own workspace.
const DIEX_RESERVED_SUBDOMAINS = [
  'almoxarifado',
  'crm',
  'diex',
  'ecommerce',
  'evolution',
  'homolog',
  'horizons',
  'jgexcursoes',
  'loja',
  'lotou',
  'mcp',
  'next-crm',
  'phn',
  'residencialquinze',
  'saaesemg',
  'site',
  'whatsapp',
];

export const isSubdomainValid = (subdomain: string) => {
  const normalizedSubdomain = subdomain.toLowerCase();

  return (
    isValidTwentySubdomain(subdomain) &&
    !RESERVED_SUBDOMAINS.includes(normalizedSubdomain) &&
    !DIEX_RESERVED_SUBDOMAINS.includes(normalizedSubdomain)
  );
};
