import { Navigate, Outlet } from 'react-router-dom';
import { AppPath } from 'diex-shared/types';

import { currentUserState } from '@/auth/states/currentUserState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

// Agency membership is not a workspace permission flag, so the routes cannot be
// gated by the settings permission map.
//
// Server admins are deliberately not let through on the admin flag alone. Every
// query behind these routes resolves the caller's own agency, and an admin who
// manages none makes resolveAgencyIdForCallerOrThrow refuse the request: the
// portal would open only to fail. Admins administer agencies from the admin
// panel, and an admin who does manage one carries isAgencyManager anyway.
export const AgencyManagerGate = () => {
  const currentUser = useAtomStateValue(currentUserState);

  const canAccessAgencyPortal = currentUser?.isAgencyManager === true;

  if (!canAccessAgencyPortal) {
    return <Navigate to={AppPath.Index} replace />;
  }

  return <Outlet />;
};
