import { type MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { assertUnreachable } from 'diex-shared/utils';

import { STANDARD_ERROR_MESSAGE } from 'src/engine/api/common/common-query-runners/errors/standard-error-message.constant';
import { CustomException } from 'src/utils/custom-exception';

export enum DiexORMExceptionCode {
  WORKSPACE_SCHEMA_NOT_FOUND = 'WORKSPACE_SCHEMA_NOT_FOUND',
  ROLES_PERMISSIONS_VERSION_NOT_FOUND = 'ROLES_PERMISSIONS_VERSION_NOT_FOUND',
  FEATURE_FLAG_MAP_VERSION_NOT_FOUND = 'FEATURE_FLAG_MAP_VERSION_NOT_FOUND',
  USER_WORKSPACE_ROLE_MAP_VERSION_NOT_FOUND = 'USER_WORKSPACE_ROLE_MAP_VERSION_NOT_FOUND',
  API_KEY_ROLE_MAP_VERSION_NOT_FOUND = 'API_KEY_ROLE_MAP_VERSION_NOT_FOUND',
  MALFORMED_METADATA = 'MALFORMED_METADATA',
  WORKSPACE_NOT_FOUND = 'WORKSPACE_NOT_FOUND',
  CONNECT_RECORD_NOT_FOUND = 'CONNECT_RECORD_NOT_FOUND',
  CONNECT_NOT_ALLOWED = 'CONNECT_NOT_ALLOWED',
  CONNECT_UNIQUE_CONSTRAINT_ERROR = 'CONNECT_UNIQUE_CONSTRAINT_ERROR',
  MISSING_MAIN_ALIAS_TARGET = 'MISSING_MAIN_ALIAS_TARGET',
  METHOD_NOT_ALLOWED = 'METHOD_NOT_ALLOWED',
  ENUM_TYPE_NAME_NOT_FOUND = 'ENUM_TYPE_NAME_NOT_FOUND',
  QUERY_READ_TIMEOUT = 'QUERY_READ_TIMEOUT',
  DUPLICATE_ENTRY_DETECTED = 'DUPLICATE_ENTRY_DETECTED',
  TOO_MANY_RECORDS_TO_UPDATE = 'TOO_MANY_RECORDS_TO_UPDATE',
  INVALID_INPUT = 'INVALID_INPUT',
  ORM_EVENT_DATA_CORRUPTED = 'ORM_EVENT_DATA_CORRUPTED',
  RLS_VALIDATION_FAILED = 'RLS_VALIDATION_FAILED',
  NO_ROLE_FOUND_FOR_USER_WORKSPACE = 'NO_ROLE_FOUND_FOR_USER_WORKSPACE',
}

const getDiexORMExceptionUserFriendlyMessage = (
  code: DiexORMExceptionCode,
) => {
  switch (code) {
    case DiexORMExceptionCode.WORKSPACE_SCHEMA_NOT_FOUND:
      return msg`Workspace schema not found.`;
    case DiexORMExceptionCode.ROLES_PERMISSIONS_VERSION_NOT_FOUND:
      return msg`Roles and permissions configuration not found.`;
    case DiexORMExceptionCode.FEATURE_FLAG_MAP_VERSION_NOT_FOUND:
      return msg`Feature configuration not found.`;
    case DiexORMExceptionCode.USER_WORKSPACE_ROLE_MAP_VERSION_NOT_FOUND:
      return msg`User workspace role configuration not found.`;
    case DiexORMExceptionCode.API_KEY_ROLE_MAP_VERSION_NOT_FOUND:
      return msg`API key role configuration not found.`;
    case DiexORMExceptionCode.MALFORMED_METADATA:
      return msg`Data structure is invalid.`;
    case DiexORMExceptionCode.WORKSPACE_NOT_FOUND:
      return msg`Workspace not found.`;
    case DiexORMExceptionCode.CONNECT_RECORD_NOT_FOUND:
      return msg`Related record not found.`;
    case DiexORMExceptionCode.CONNECT_NOT_ALLOWED:
      return msg`This connection is not allowed.`;
    case DiexORMExceptionCode.CONNECT_UNIQUE_CONSTRAINT_ERROR:
      return msg`A record with this relationship already exists.`;
    case DiexORMExceptionCode.MISSING_MAIN_ALIAS_TARGET:
      return msg`Missing main alias target.`;
    case DiexORMExceptionCode.METHOD_NOT_ALLOWED:
      return msg`This operation is not allowed.`;
    case DiexORMExceptionCode.QUERY_READ_TIMEOUT:
      return msg`Query timed out. Please try again.`;
    case DiexORMExceptionCode.DUPLICATE_ENTRY_DETECTED:
      return msg`A duplicate entry was detected.`;
    case DiexORMExceptionCode.TOO_MANY_RECORDS_TO_UPDATE:
      return msg`Too many records to update at once.`;
    case DiexORMExceptionCode.INVALID_INPUT:
      return msg`Invalid input provided.`;
    case DiexORMExceptionCode.RLS_VALIDATION_FAILED:
      return msg`Record does not satisfy security constraints.`;
    case DiexORMExceptionCode.ENUM_TYPE_NAME_NOT_FOUND:
    case DiexORMExceptionCode.ORM_EVENT_DATA_CORRUPTED:
      return STANDARD_ERROR_MESSAGE;
    case DiexORMExceptionCode.NO_ROLE_FOUND_FOR_USER_WORKSPACE:
      return msg`No role found for user.`;
    default:
      assertUnreachable(code);
  }
};

export class DiexORMException extends CustomException<DiexORMExceptionCode> {
  constructor(
    message: string,
    code: DiexORMExceptionCode,
    { userFriendlyMessage }: { userFriendlyMessage?: MessageDescriptor } = {},
  ) {
    super(message, code, {
      userFriendlyMessage:
        userFriendlyMessage ?? getDiexORMExceptionUserFriendlyMessage(code),
    });
  }
}
