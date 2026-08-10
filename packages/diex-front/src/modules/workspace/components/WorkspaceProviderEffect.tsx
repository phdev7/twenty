import { useInitializeQueryParamState } from '@/app/hooks/useInitializeQueryParamState';
import { isMultiWorkspaceEnabledState } from '@/client-config/states/isMultiWorkspaceEnabledState';
import { useGetPublicWorkspaceDataByDomain } from '@/domain-manager/hooks/useGetPublicWorkspaceDataByDomain';
import { useIsCurrentLocationOnDefaultDomain } from '@/domain-manager/hooks/useIsCurrentLocationOnDefaultDomain';
import { useLastAuthenticatedWorkspaceDomain } from '@/domain-manager/hooks/useLastAuthenticatedWorkspaceDomain';
import { useReadDefaultDomainFromConfiguration } from '@/domain-manager/hooks/useReadDefaultDomainFromConfiguration';
import { useReadWorkspaceUrlFromCurrentLocation } from '@/domain-manager/hooks/useReadWorkspaceUrlFromCurrentLocation';
import { useRedirectToWorkspaceDomain } from '@/domain-manager/hooks/useRedirectToWorkspaceDomain';
import { domainConfigurationState } from '@/domain-manager/states/domainConfigurationState';
import { lastAuthenticatedWorkspaceDomainState } from '@/domain-manager/states/lastAuthenticatedWorkspaceDomainState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useCallback, useEffect } from 'react';
import { isDefined } from 'diex-shared/utils';
import { type WorkspaceUrls } from '~/generated-metadata/graphql';
import { getWorkspaceUrl } from '~/utils/getWorkspaceUrl';

const getCurrentSearchParams = (): Record<string, string> =>
  Object.fromEntries(new URLSearchParams(window.location.search));

export const WorkspaceProviderEffect = () => {
  const { data: getPublicWorkspaceData } = useGetPublicWorkspaceDataByDomain();

  const lastAuthenticatedWorkspaceDomain = useAtomStateValue(
    lastAuthenticatedWorkspaceDomainState,
  );

  const { redirectToWorkspaceDomain } = useRedirectToWorkspaceDomain();
  const { setLastAuthenticateWorkspaceDomain } =
    useLastAuthenticatedWorkspaceDomain();
  const { isDefaultDomain } = useIsCurrentLocationOnDefaultDomain();
  const { defaultDomain } = useReadDefaultDomainFromConfiguration();
  const { frontDomain } = useAtomStateValue(domainConfigurationState);

  const { currentLocationHostname } = useReadWorkspaceUrlFromCurrentLocation();

  const isMultiWorkspaceEnabled = useAtomStateValue(
    isMultiWorkspaceEnabledState,
  );

  const { initializeQueryParamState } = useInitializeQueryParamState();

  const isWorkspaceHostnameMatchCurrentLocationHostname = useCallback(
    (workspaceUrls: WorkspaceUrls) => {
      const { hostname } = new URL(getWorkspaceUrl(workspaceUrls));
      return hostname === currentLocationHostname;
    },
    [currentLocationHostname],
  );

  useEffect(() => {
    if (
      isMultiWorkspaceEnabled &&
      isDefined(getPublicWorkspaceData) &&
      !isWorkspaceHostnameMatchCurrentLocationHostname(
        getPublicWorkspaceData.workspaceUrls,
      )
    ) {
      redirectToWorkspaceDomain(
        getWorkspaceUrl(getPublicWorkspaceData.workspaceUrls),
        window.location.pathname,
        getCurrentSearchParams(),
      );
    }
  }, [
    isMultiWorkspaceEnabled,
    redirectToWorkspaceDomain,
    getPublicWorkspaceData,
    currentLocationHostname,
    isWorkspaceHostnameMatchCurrentLocationHostname,
  ]);

  useEffect(() => {
    if (
      !isMultiWorkspaceEnabled ||
      !isDefaultDomain ||
      !isDefined(lastAuthenticatedWorkspaceDomain) ||
      !('workspaceUrl' in lastAuthenticatedWorkspaceDomain) ||
      !isDefined(lastAuthenticatedWorkspaceDomain.workspaceUrl)
    ) {
      return;
    }

    let rememberedHostname: string;

    try {
      rememberedHostname = new URL(
        lastAuthenticatedWorkspaceDomain.workspaceUrl,
      ).hostname;
    } catch {
      setLastAuthenticateWorkspaceDomain(null);
      return;
    }

    // The apex/front domain is the public landing, not a workspace. Old Diex
    // sessions used to persist crm.bydiex.com as the last workspace; the public
    // nginx redirects /welcome to app.crm.bydiex.com while this effect redirected
    // it back, producing an endless client/proxy loop. Discard that stale value
    // instead of navigating to it. The default domain is rejected as well because
    // redirecting to the current host only replays the same effect.
    if (
      rememberedHostname === frontDomain ||
      rememberedHostname === defaultDomain ||
      rememberedHostname === window.location.hostname
    ) {
      setLastAuthenticateWorkspaceDomain(null);
      return;
    }

    initializeQueryParamState();
    redirectToWorkspaceDomain(
      lastAuthenticatedWorkspaceDomain.workspaceUrl,
      window.location.pathname,
      getCurrentSearchParams(),
    );
  }, [
    isMultiWorkspaceEnabled,
    isDefaultDomain,
    defaultDomain,
    frontDomain,
    lastAuthenticatedWorkspaceDomain,
    redirectToWorkspaceDomain,
    initializeQueryParamState,
    setLastAuthenticateWorkspaceDomain,
  ]);

  return <></>;
};
