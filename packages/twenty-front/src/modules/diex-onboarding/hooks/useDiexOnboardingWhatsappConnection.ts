import { useCallback, useEffect, useRef, useState } from 'react';

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
  // Keep the polling cycle independent from callback identity changes.
  // oxlint-disable-next-line twenty/no-state-useref
  const onConnectedRef = useRef(onConnected);

  useEffect(() => {
    onConnectedRef.current = onConnected;
  }, [onConnected]);

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
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const schedule = () => {
      timeoutId = setTimeout(() => {
        void poll();
      }, WHATSAPP_CONNECTION_POLL_INTERVAL_MS);
    };

    const poll = async (): Promise<void> => {
      const result: WhatsappConnection | null = await refresh();

      if (isCancelled) {
        return;
      }

      if (result?.state === 'CONNECTED') {
        onConnectedRef.current();
        return;
      }

      if (result?.state === 'AWAITING_SCAN' || result?.state === 'CONNECTING') {
        schedule();
      }
    };

    schedule();

    return () => {
      isCancelled = true;

      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [connection?.state, refresh]);

  return {
    connection,
    errorMessage,
    isLoadingConnection: isLoading,
    isConnecting,
    requestConnection,
  };
};
