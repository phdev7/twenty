import { type ObjectRecord } from 'diex-shared/types';

export type PartialObjectRecordWithId = Partial<ObjectRecord> & { id: string };
