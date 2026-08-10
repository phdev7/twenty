import { type PhonesMetadata } from 'diex-shared/types';
import { type CountryCode } from 'libphonenumber-js';

// WhatsApp hands over one string of international digits. The CRM phone field
// stores the calling code apart from the national number, and a number saved
// without that split is unusable for dialing, filtering and dedup.
const CALLING_CODES: Array<{
  callingCode: string;
  countryCode: CountryCode;
}> = [
  { callingCode: '598', countryCode: 'UY' },
  { callingCode: '595', countryCode: 'PY' },
  { callingCode: '591', countryCode: 'BO' },
  { callingCode: '351', countryCode: 'PT' },
  { callingCode: '55', countryCode: 'BR' },
  { callingCode: '54', countryCode: 'AR' },
  { callingCode: '56', countryCode: 'CL' },
  { callingCode: '57', countryCode: 'CO' },
  { callingCode: '52', countryCode: 'MX' },
  { callingCode: '51', countryCode: 'PE' },
  { callingCode: '49', countryCode: 'DE' },
  { callingCode: '44', countryCode: 'GB' },
  { callingCode: '39', countryCode: 'IT' },
  { callingCode: '34', countryCode: 'ES' },
  { callingCode: '33', countryCode: 'FR' },
  { callingCode: '1', countryCode: 'US' },
];

export const buildPhonesValue = (normalizedPhone: string): PhonesMetadata => {
  const match = CALLING_CODES.find(
    ({ callingCode }) =>
      normalizedPhone.startsWith(callingCode) &&
      normalizedPhone.length - callingCode.length >= 8,
  );

  if (!match) {
    return {
      primaryPhoneNumber: normalizedPhone,
      primaryPhoneCountryCode: 'BR',
      primaryPhoneCallingCode: '',
      additionalPhones: null,
    };
  }

  return {
    primaryPhoneNumber: normalizedPhone.slice(match.callingCode.length),
    primaryPhoneCountryCode: match.countryCode,
    primaryPhoneCallingCode: `+${match.callingCode}`,
    additionalPhones: null,
  };
};

export const splitDisplayName = (
  displayName: string | null,
): { firstName: string; lastName: string } => {
  const normalizedName = displayName?.trim() || 'Contato WhatsApp';
  const [firstName, ...lastNameParts] = normalizedName.split(/\s+/);

  return {
    firstName: firstName || 'Contato',
    lastName: lastNameParts.join(' '),
  };
};
