import { settingsPersistedRoleFamilyState } from '@/settings/roles/states/settingsPersistedRoleFamilyState';
import { settingsRoleIdsState } from '@/settings/roles/states/settingsRoleIdsState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useStore } from 'jotai';
import { isDefined } from 'diex-shared/utils';

export const useSettingsAllRoles = () => {
  // oxlint-disable-next-line diex/matching-state-variable
  const roleIds = useAtomStateValue(settingsRoleIdsState);
  const store = useStore();

  const roles = roleIds
    .map((roleId) =>
      store.get(settingsPersistedRoleFamilyState.atomFamily(roleId)),
    )
    .filter(isDefined);

  return roles;
};
