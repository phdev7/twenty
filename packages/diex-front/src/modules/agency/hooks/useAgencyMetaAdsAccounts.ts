import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from '@apollo/client/react';
import { isDefined } from 'diex-shared/utils';

import { GET_AGENCY_META_ADS_ACCOUNTS } from '@/agency/graphql/agencyQueries';
import { type AgencyMetaAdsAccount } from '@/agency/types/AgencyTypes';
import { useRedirect } from '@/domain-manager/hooks/useRedirect';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { REACT_APP_SERVER_BASE_URL } from '~/config';
import { GenerateTransientTokenDocument } from '~/generated-metadata/graphql';

type MetaAdsAccountsQueryResult = {
  diexMetaAdsAccounts: AgencyMetaAdsAccount[];
};

export const useAgencyMetaAdsAccounts = () => {
  const { enqueueErrorSnackBar, enqueueSuccessSnackBar } = useSnackBar();
  const [searchParams, setSearchParams] = useSearchParams();
  const { redirect } = useRedirect();

  const [generateTransientToken] = useMutation(GenerateTransientTokenDocument);

  const { data, loading, error, refetch } =
    useQuery<MetaAdsAccountsQueryResult>(GET_AGENCY_META_ADS_ACCOUNTS);

  const connectedCount = searchParams.get('metaAdsConnected');
  const connectionError = searchParams.get('metaAdsError');

  // The OAuth callback comes back as a full page load with its result in the
  // query string, so the outcome is reported here rather than by the mutation
  // that no longer exists in this flow.
  useEffect(() => {
    if (!isDefined(connectedCount) && !isDefined(connectionError)) {
      return;
    }

    if (isDefined(connectionError)) {
      enqueueErrorSnackBar({ message: connectionError });
    } else if (isDefined(connectedCount)) {
      enqueueSuccessSnackBar({
        message: `${connectedCount} conta(s) do Meta Ads conectada(s).`,
      });
      void refetch();
    }

    setSearchParams(
      (currentParams) => {
        currentParams.delete('metaAdsConnected');
        currentParams.delete('metaAdsError');

        return currentParams;
      },
      { replace: true },
    );
  }, [
    connectedCount,
    connectionError,
    enqueueErrorSnackBar,
    enqueueSuccessSnackBar,
    refetch,
    setSearchParams,
  ]);

  // A browser navigation carries no Authorization header, so the server is
  // handed a short-lived transient token to identify the agency manager, the
  // same way the Google and Microsoft account connections do.
  const startMetaAdsConnection = async (clientWorkspaceId?: string) => {
    const transientTokenResult = await generateTransientToken();
    const token =
      transientTokenResult.data?.generateTransientToken.transientToken.token;

    if (!isDefined(token)) {
      enqueueErrorSnackBar({
        message: 'Não foi possível iniciar a conexão com o Meta.',
      });

      return;
    }

    const url = new URL('/auth/meta-ads', REACT_APP_SERVER_BASE_URL);

    url.searchParams.set('transientToken', token);

    if (isDefined(clientWorkspaceId)) {
      url.searchParams.set('clientWorkspaceId', clientWorkspaceId);
    }

    redirect(url.toString());
  };

  return {
    metaAdsAccounts: data?.diexMetaAdsAccounts ?? [],
    loading,
    errorMessage: error?.message ?? null,
    refetch,
    startMetaAdsConnection,
  };
};
