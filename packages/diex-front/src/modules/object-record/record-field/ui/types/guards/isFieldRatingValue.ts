import { RATING_VALUES } from 'diex-shared/constants';
import { type FieldRatingValue } from 'diex-shared/types';

export const isFieldRatingValue = (
  fieldValue: unknown,
): fieldValue is FieldRatingValue =>
  RATING_VALUES.includes(fieldValue as NonNullable<FieldRatingValue>);
