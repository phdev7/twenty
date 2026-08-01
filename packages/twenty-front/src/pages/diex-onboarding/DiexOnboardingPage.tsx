import { useState } from 'react';

import { DiexOnboarding } from '@/diex-onboarding/components/DiexOnboarding';
import { useSkipSyncEmailOnboardingStep } from '@/onboarding/hooks/useSkipSyncEmailOnboardingStep';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';

export const DiexOnboardingPage = () => {
  const skipSyncEmailOnboardingStep = useSkipSyncEmailOnboardingStep();
  const { enqueueErrorSnackBar } = useSnackBar();
  const [isContinuing, setIsContinuing] = useState(false);

  const continueOnboarding = async (): Promise<void> => {
    setIsContinuing(true);

    try {
      await skipSyncEmailOnboardingStep();
    } catch {
      enqueueErrorSnackBar({
        message: 'Não foi possível avançar o onboarding.',
      });
      setIsContinuing(false);
    }
  };

  return (
    <DiexOnboarding
      isContinuing={isContinuing}
      onContinue={() => void continueOnboarding()}
    />
  );
};
