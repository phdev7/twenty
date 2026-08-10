import { type FieldMetadataFunctionDefaultValue } from 'diex-shared/types';

export const serializeFunctionDefaultValue = (
  defaultValue?: FieldMetadataFunctionDefaultValue,
) => {
  switch (defaultValue) {
    case 'uuid':
      return 'public.uuid_generate_v4()';
    case 'now':
      return 'now()';
    default:
      return null;
  }
};
