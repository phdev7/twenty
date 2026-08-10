import { FieldMetadataType } from 'diex-shared/types';
import { assertUnreachable } from 'diex-shared/utils';

export const parseNumberValue = (
  value: unknown,
  fieldType:
    | FieldMetadataType.NUMBER
    | FieldMetadataType.NUMERIC
    | FieldMetadataType.POSITION,
): unknown => {
  if (typeof value !== 'string') {
    return value;
  }

  switch (fieldType) {
    case FieldMetadataType.NUMBER:
    case FieldMetadataType.NUMERIC:
    case FieldMetadataType.POSITION:
      return parseFloat(value);

    default:
      assertUnreachable(fieldType);
  }
};
