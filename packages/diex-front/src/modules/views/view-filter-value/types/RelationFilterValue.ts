import { type jsonRelationFilterValueSchema } from 'diex-shared/utils';
import { type z } from 'zod';

export type RelationFilterValue = z.infer<typeof jsonRelationFilterValueSchema>;
