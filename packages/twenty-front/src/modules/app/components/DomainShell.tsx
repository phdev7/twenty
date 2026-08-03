import { BrowserRouter } from 'react-router-dom';
import { AppPath } from 'twenty-shared/types';

import { RootApp } from '@/app/components/RootApp';
import { SharedAppProviders } from '@/app/components/SharedAppProviders';
import { WorkspaceApp } from '@/app/components/WorkspaceApp';
import { isOnOnboardingTransitionPath } from '@/auth/utils/isOnOnboardingTransitionPath';
import { clientConfigApiStatusState } from '@/client-config/states/clientConfigApiStatusState';
import { isMultiWorkspaceEnabledState } from '@/client-config/states/isMultiWorkspaceEnabledState';
import { useIsCurrentLocationOnDefaultDomain } from '@/domain-manager/hooks/useIsCurrentLocationOnDefaultDomain';
import { OnboardingPageLoader } from '@/onboarding/components/OnboardingPageLoader';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { UserOrMetadataLoader } from '~/loading/components/UserOrMetadataLoader';
import { DiexPublicAccessRequestPage } from '~/pages/diex-access-request/DiexPublicAccessRequestPage';

export const DomainShell = () => {
  const { isLoadedOnce } = useAtomStateValue(clientConfigApiStatusState);
  const isMultiWorkspaceEnabled = useAtomStateValue(
    isMultiWorkspaceEnabledState,
  );
  const { isDefaultDomain } = useIsCurrentLocationOnDefaultDomain();

  if (
    window.location.pathname.replace(/\/$/, '') === AppPath.DiexAccessRequest
  ) {
    return (
      <BrowserRouter>
        <SharedAppProviders>
          <DiexPublicAccessRequestPage />
        </SharedAppProviders>
      </BrowserRouter>
    );
  }

  if (!isLoadedOnce) {
    return (
      <BrowserRouter>
        <SharedAppProviders>
          {isOnOnboardingTransitionPath(window.location.pathname) ? (
            <OnboardingPageLoader />
          ) : (
            <UserOrMetadataLoader />
          )}
        </SharedAppProviders>
      </BrowserRouter>
    );
  }

  if (!isMultiWorkspaceEnabled) {
    return <WorkspaceApp />;
  }

  return isDefaultDomain ? <RootApp /> : <WorkspaceApp />;
};
