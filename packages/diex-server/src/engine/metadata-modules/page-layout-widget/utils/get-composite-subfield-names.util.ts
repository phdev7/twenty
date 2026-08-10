import { COMPOSITE_FIELD_TYPE_SUB_FIELDS_NAMES } from 'diex-shared/constants';
import { type FieldMetadataType } from 'diex-shared/types';

const compositeSubFieldMaps = COMPOSITE_FIELD_TYPE_SUB_FIELDS_NAMES as Record<
  string,
  Record<string, string>
>;

export const getCompositeSubfieldNames = (fieldType: FieldMetadataType) =>
  Object.values(compositeSubFieldMaps[fieldType] ?? {});
