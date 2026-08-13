import { useCallback } from 'react';

import { DiexOnboardingWhatsappStep } from '@/diex-onboarding/components/DiexOnboardingWhatsappStep';
import { useDiexOnboardingWhatsappConnection } from '@/diex-onboarding/hooks/useDiexOnboardingWhatsappConnection';

// This legacy prompt only reads connection status on mount. Provisioning and
// QR generation still require an explicit click.
export const DiexOnboardingWhatsappPrompt = () => {
  const onConnected = useCallback(() => undefined, []);
  const {
    connection,
    errorMessage,
    isLoadingConnection,
    isConnecting,
    requestConnection,
  } = useDiexOnboardingWhatsappConnection({ onConnected });

  return (
    <DiexOnboardingWhatsappStep
      index={1}
      connection={connection}
      isConnecting={isLoadingConnection || isConnecting}
      isDone={
        connection?.state === 'CONNECTED' && Boolean(connection.validatedAt)
      }
      primaryChannel="WHATSAPP"
      errorMessage={errorMessage}
      onRequestConnection={() => void requestConnection()}
    />
  );
};
