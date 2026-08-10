import { type EnqueueSnackbarParams } from 'diex-shared/types';
import { isDefined } from 'diex-shared/utils';

import {
  frontComponentHostCommunicationApi,
  type EnqueueSnackbarFunction,
} from '../globals/frontComponentHostCommunicationApi';

export const enqueueSnackbar: EnqueueSnackbarFunction = (
  params: EnqueueSnackbarParams,
) => {
  const enqueueSnackbarFunction =
    frontComponentHostCommunicationApi.enqueueSnackbar;

  if (!isDefined(enqueueSnackbarFunction)) {
    throw new Error('enqueueSnackbarFunction is not set');
  }

  return enqueueSnackbarFunction(params);
};
