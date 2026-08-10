import { pascalCase } from 'diex-shared/utils';

export const computeEnumFieldGqlTypeKey = (
  objectMetadataName: string,
  fieldMetadataName: string,
): string => {
  return `${pascalCase(objectMetadataName)}${pascalCase(
    fieldMetadataName,
  )}Enum`;
};
