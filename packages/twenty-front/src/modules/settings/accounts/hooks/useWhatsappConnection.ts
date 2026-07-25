import { useCallback, useEffect, useState } from 'react';
import { useLingui } from '@lingui/react/macro';

const WHATSAPP_CONNECTION_ROUTE = '/diex/accounts/whatsapp/connection';

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

// The connection state lives in the provider, not in the CRM, so it is read
// through the app route on demand rather than cached in a record.
export const useWhatsappConnection = () => {
  const { t } = useLingui();
  const [connection, setConnection] = useState<WhatsappConnection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch(WHATSAPP_CONNECTION_ROUTE, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });

      if (!response.ok) {
        throw new Error(String(response.status));
      }

      setConnection((await response.json()) as WhatsappConnection);
    } catch {
      setErrorMessage(
        t`Could not reach the WhatsApp provider. Check the workspace integration settings.`,
      );
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { connection, isLoading, errorMessage, refresh };
};
