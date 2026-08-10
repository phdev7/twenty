import { type ObjectRecordGroupByDateGranularity } from 'diex-shared/types';

export type GroupByDefinition = {
  columnNameWithQuotes: string;
  expression: string;
  alias: string;
  dateGranularity?: ObjectRecordGroupByDateGranularity;
};
