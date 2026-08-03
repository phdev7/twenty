import { type FlatRole } from 'src/engine/metadata-modules/flat-role/types/flat-role.type';
import {
  STANDARD_ROLE,
  STANDARD_ROLE_OBJECT_PERMISSION_DEFINITIONS,
  STANDARD_ROLE_PERMISSION_FLAG_UNIVERSAL_IDENTIFIERS,
  getStandardRoleObjectPermissionUniversalIdentifier,
  getStandardRolePermissionFlagUniversalIdentifier,
} from 'src/engine/workspace-manager/twenty-standard-application/constants/standard-role.constant';
import { type AllStandardRoleName } from 'src/engine/workspace-manager/twenty-standard-application/types/all-standard-role-name.type';
import {
  type CreateStandardRoleArgs,
  createStandardRoleFlatMetadata,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/role-metadata/create-standard-role-flat-metadata.util';

export const STANDARD_FLAT_ROLE_METADATA_BUILDERS_BY_ROLE_NAME = {
  admin: (args: Omit<CreateStandardRoleArgs, 'context'>) =>
    createStandardRoleFlatMetadata({
      ...args,
      context: {
        roleName: 'admin',
        label: 'Admin',
        description: 'Admin role',
        icon: 'IconUserCog',
        isEditable: false,
        canUpdateAllSettings: true,
        canAccessAllTools: true,
        canReadAllObjectRecords: true,
        canUpdateAllObjectRecords: true,
        canSoftDeleteAllObjectRecords: true,
        canDestroyAllObjectRecords: true,
        canBeAssignedToUsers: true,
        canBeAssignedToAgents: false,
        canBeAssignedToApiKeys: true,
      },
    }),
  defaultFunction: (args: Omit<CreateStandardRoleArgs, 'context'>) => {
    const roleUniversalIdentifier =
      STANDARD_ROLE.defaultFunction.universalIdentifier;

    return createStandardRoleFlatMetadata({
      ...args,
      context: {
        roleName: 'defaultFunction',
        label: 'Diex CRM function role',
        description:
          'Acesso mínimo para Inbox, inteligência comercial e Customer Success, sem exclusão, configurações ou ferramentas arbitrárias.',
        icon: null,
        isEditable: true,
        canUpdateAllSettings: false,
        canAccessAllTools: false,
        canReadAllObjectRecords: false,
        canUpdateAllObjectRecords: false,
        canSoftDeleteAllObjectRecords: false,
        canDestroyAllObjectRecords: false,
        canBeAssignedToUsers: false,
        canBeAssignedToAgents: false,
        canBeAssignedToApiKeys: true,
        rolePermissionFlagUniversalIdentifiers:
          STANDARD_ROLE_PERMISSION_FLAG_UNIVERSAL_IDENTIFIERS.map(
            (permissionFlagUniversalIdentifier) =>
              getStandardRolePermissionFlagUniversalIdentifier({
                roleUniversalIdentifier,
                permissionFlagUniversalIdentifier,
              }),
          ),
        objectPermissionUniversalIdentifiers:
          STANDARD_ROLE_OBJECT_PERMISSION_DEFINITIONS.map(
            ({ objectUniversalIdentifier }) =>
              getStandardRoleObjectPermissionUniversalIdentifier({
                roleUniversalIdentifier,
                objectUniversalIdentifier,
              }),
          ),
      },
    });
  },
} satisfies {
  [P in AllStandardRoleName]: (
    args: Omit<CreateStandardRoleArgs, 'context'>,
  ) => FlatRole;
};
