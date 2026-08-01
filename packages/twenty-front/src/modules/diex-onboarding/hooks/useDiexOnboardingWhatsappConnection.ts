import { useCallback, useEffect, useState } from 'react';

import { WHATSAPP_CONNECTION_POLL_INTERVAL_MS } from '@/diex-onboarding/constants/WHATSAPP_CONNECTION_POLL_INTERVAL_MS';
import {
  type WhatsappConnection,
  useWhatsappConnection,
} from '@/settings/accounts/hooks/useWhatsappConnection';

// Asking the connection route on open is what makes the QR appear without a
// click; the route is idempotent and provisions the instance if missing. It
// then keeps re-asking on its own while a scan is pending, since nothing
// pushes the "connected" transition to the front.
export const useDiexOnboardingWhatsappConnection = ({
  onConnected,
}: {
  onConnected: () => void;
}) => {
  const { connection, isLoading, errorMessage, refresh } =
    useWhatsappConnection();
  const [isConnecting, setIsConnecting] = useState(false);

  const requestConnection = useCallback(async (): Promise<void> => {
    setIsConnecting(true);

    try {
      await refresh();
    } finally {
      setIsConnecting(false);
    }
  }, [refresh]);

  useEffect(() => {
    if (
      connection?.state !== 'AWAITING_SCAN' &&
      connection?.state !== 'CONNECTING'
    ) {
      return;
    }

    let isCancelled = false;

    const timeoutId = setTimeout(() => {
      void refresh().then((result: WhatsappConnection | null) => {
        if (!isCancelled && result?.state === 'CONNECTED') {
          onConnected();
        }
      });
    }, WHATSAPP_CONNECTION_POLL_INTERVAL_MS);

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, [connection?.state, onConnected, refresh]);

  return {
    connection,
    errorMessage,
    isLoadingConnection: isLoading,
    isConnecting,
    requestConnection,
  };
};
