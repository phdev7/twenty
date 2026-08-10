import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';
import {
  type MetadataGqlOperationSignature,
  type RecordGqlOperationSignature,
} from 'diex-shared/types';

export const requiredQueryListenersState = createAtomState<
  {
    queryId: string;
    operationSignature:
      | RecordGqlOperationSignature
      | MetadataGqlOperationSignature;
  }[]
>({
  key: 'requiredQueryListenersState',
  defaultValue: [],
});
