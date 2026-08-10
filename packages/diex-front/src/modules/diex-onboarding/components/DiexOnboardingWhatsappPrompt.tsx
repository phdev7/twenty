import { useCallback } from 'react';

import { DiexOnboardingWhatsappStep } from '@/diex-onboarding/components/DiexOnboardingWhatsappStep';
import { useDiexOnboardingWhatsappConnection } from '@/diex-onboarding/hooks/useDiexOnboardingWhatsappConnection';

// The QR is intentionally mounted on the first Diex screen. A new workspace
// must start receiving commercial conversations before the owner reaches the
// longer architecture review, and the connection hook provisions the instance
// idempotently on mount.
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
      isDone={connection?.state === 'CONNECTED'}
      errorMessage={errorMessage}
      onRequestConnection={() => void requestConnection()}
    />
  );
};
