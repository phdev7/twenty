import { type ObjectsPermissions } from 'diex-shared/types';
import { type PermissionFlagType } from 'diex-shared/constants';

export type UserWorkspacePermissions = {
  permissionFlags: Record<PermissionFlagType, boolean>;
  objectsPermissions: ObjectsPermissions;
};
