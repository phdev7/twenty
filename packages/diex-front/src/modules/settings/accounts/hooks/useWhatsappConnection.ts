import { getTokenPair } from '@/apollo/utils/getTokenPair';
import { useLingui } from '@lingui/react/macro';
import { useCallback, useEffect, useRef, useState } from 'react';
import { REACT_APP_SERVER_BASE_URL } from '~/config';

const WHATSAPP_CONNECTION_ROUTE = '/rest/inbox/evolution/connection';

export type WhatsappConnection = {
  state:
    | 'CONNECTED'
    | 'AWAITING_SCAN'
    | 'CONNECTING'
    | 'NOT_PROVISIONED'
    | 'UNAVAILABLE';
  instanceName: string | null;
  phone: string | null;
  qrCodeDataUri: string | null;
  message: string;
};

// The connection state lives in the provider, not in the CRM, so it is read on
// demand through the app route rather than cached in a record.
export const useWhatsappConnection = () => {
  const { t } = useLingui();
  const [connection, setConnection] = useState<WhatsappConnection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // This is an imperative lock for one network operation, not rendered state.
  // oxlint-disable-next-line diex/no-state-useref
  const inFlightRefreshRef = useRef<Promise<WhatsappConnection | null> | null>(
    null,
  );

  const refresh = useCallback((): Promise<WhatsappConnection | null> => {
    if (inFlightRefreshRef.current) {
      return inFlightRefreshRef.current;
    }

    const request = (async (): Promise<WhatsappConnection | null> => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const accessToken =
          getTokenPair()?.accessOrWorkspaceAgnosticToken?.token;

        if (!accessToken) {
          throw new Error('missing-token');
        }

        const response = await fetch(
          `${REACT_APP_SERVER_BASE_URL}${WHATSAPP_CONNECTION_ROUTE}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: '{}',
          },
        );

        if (!response.ok) {
          throw new Error(String(response.status));
        }

        const result = (await response.json()) as WhatsappConnection;

        setConnection(result);

        return result;
      } catch {
        setErrorMessage(
          t`Could not reach the WhatsApp provider. Check the workspace integration settings.`,
        );

        return null;
      } finally {
        setIsLoading(false);
      }
    })();

    inFlightRefreshRef.current = request;
    void request.finally(() => {
      if (inFlightRefreshRef.current === request) {
        inFlightRefreshRef.current = null;
      }
    });

    return request;
  }, [t]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { connection, isLoading, errorMessage, refresh };
};
