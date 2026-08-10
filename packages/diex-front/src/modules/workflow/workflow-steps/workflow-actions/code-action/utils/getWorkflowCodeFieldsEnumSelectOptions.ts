import { isNonEmptyArray } from '@sniptt/guards';
import { isDefined } from 'diex-shared/utils';
import { type InputSchemaProperty } from 'diex-shared/workflow';
import { type SelectOption } from 'diex-ui/input';

export const getWorkflowCodeFieldsEnumSelectOptions = (
  property: InputSchemaProperty | undefined,
): SelectOption[] => {
  if (!isDefined(property) || !isNonEmptyArray(property.enum)) {
    return [];
  }

  return property.enum.map((value) => ({
    value,
    label: value,
  }));
};
