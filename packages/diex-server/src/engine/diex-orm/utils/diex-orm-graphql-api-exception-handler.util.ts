import { isDefined } from 'diex-shared/utils';

import { UserInputError } from 'src/engine/core-modules/graphql/utils/graphql-errors.util';
import {
  type DiexORMException,
  DiexORMExceptionCode,
} from 'src/engine/diex-orm/exceptions/diex-orm.exception';

interface DuplicateKeyErrorWithMetadata extends DiexORMException {
  conflictingRecordId?: string;
  conflictingObjectNameSingular?: string;
}

export const diexORMGraphqlApiExceptionHandler = (
  error: DiexORMException,
) => {
  switch (error.code) {
    case DiexORMExceptionCode.DUPLICATE_ENTRY_DETECTED: {
      const duplicateKeyError: DuplicateKeyErrorWithMetadata = error;

      const extensions: Record<string, unknown> = {
        userFriendlyMessage: error.userFriendlyMessage,
        ...(isDefined(duplicateKeyError.conflictingRecordId) &&
        isDefined(duplicateKeyError.conflictingObjectNameSingular)
          ? {
              conflictingRecordId: duplicateKeyError.conflictingRecordId,
              conflictingObjectNameSingular:
                duplicateKeyError.conflictingObjectNameSingular,
            }
          : {}),
      };

      throw new UserInputError(error.message, extensions);
    }

    case DiexORMExceptionCode.INVALID_INPUT:
    case DiexORMExceptionCode.CONNECT_RECORD_NOT_FOUND:
    case DiexORMExceptionCode.CONNECT_NOT_ALLOWED:
    case DiexORMExceptionCode.CONNECT_UNIQUE_CONSTRAINT_ERROR:
    case DiexORMExceptionCode.RLS_VALIDATION_FAILED:
    case DiexORMExceptionCode.TOO_MANY_RECORDS_TO_UPDATE:
      throw new UserInputError(error.message, {
        userFriendlyMessage: error.userFriendlyMessage,
      });
    default: {
      throw error;
    }
  }
};
