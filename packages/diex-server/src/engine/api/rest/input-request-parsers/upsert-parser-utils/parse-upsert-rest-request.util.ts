import { isDefined } from 'diex-shared/utils';

import { type AuthenticatedRequest } from 'src/engine/api/rest/types/authenticated-request';

export const parseUpsertRestRequest = (
  request: AuthenticatedRequest,
): boolean => {
  if (!isDefined(request.query.upsert)) {
    return false;
  }

  return request.query.upsert === 'true';
};
