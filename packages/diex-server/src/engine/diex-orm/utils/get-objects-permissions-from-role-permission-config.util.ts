import {
  type ObjectsPermissions,
  type ObjectsPermissionsByRoleId,
} from 'diex-shared/types';
import { isDefined } from 'diex-shared/utils';

import { type RolePermissionConfig } from 'src/engine/diex-orm/types/role-permission-config';

// Multi-role union/intersection is not ready — use the first assigned role only.
export const getObjectsPermissionsFromRolePermissionConfig = ({
  rolesPermissions,
  rolePermissionConfig,
}: {
  rolesPermissions: ObjectsPermissionsByRoleId;
  rolePermissionConfig: RolePermissionConfig;
}): ObjectsPermissions => {
  if ('shouldBypassPermissionChecks' in rolePermissionConfig) {
    return {};
  }

  const roleId =
    'intersectionOf' in rolePermissionConfig
      ? rolePermissionConfig.intersectionOf[0]
      : 'unionOf' in rolePermissionConfig
        ? rolePermissionConfig.unionOf[0]
        : undefined;

  if (!isDefined(roleId)) {
    return {};
  }

  return rolesPermissions[roleId] ?? {};
};
