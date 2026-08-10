import { type FieldAddressValue } from '@/object-record/record-field/ui/types/FieldMetadata';
import {
  ALLOWED_ADDRESS_SUBFIELDS,
  type AllowedAddressSubField,
} from 'diex-shared/types';
import { isDefined } from 'diex-shared/utils';
import { joinAddressFieldValues } from '~/utils/joinAddressFieldValues';

export const formatAddressDisplay = (
  fieldValue: FieldAddressValue | undefined,
  subFields: AllowedAddressSubField[] | null | undefined,
) => {
  if (!isDefined(fieldValue)) return '';
  const fieldsToUse =
    subFields && subFields.length > 0
      ? subFields
      : [...ALLOWED_ADDRESS_SUBFIELDS];

  return joinAddressFieldValues(fieldValue, fieldsToUse);
};
