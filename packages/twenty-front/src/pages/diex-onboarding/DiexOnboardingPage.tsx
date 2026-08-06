import { useState } from 'react';
import { AppPath } from 'twenty-shared/types';

import { DiexOnboarding } from '@/diex-onboarding/components/DiexOnboarding';
import { completeDiexOnboarding } from '@/diex-onboarding/utils/completeDiexOnboarding';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';

export const DiexOnboardingPage = () => {
  const { enqueueErrorSnackBar } = useSnackBar();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitOperation = async (
    operationDescription: string,
  ): Promise<void> => {
    setIsSubmitting(true);

    try {
      await completeDiexOnboarding(operationDescription);
      window.location.replace(AppPath.DiexFirstSteps);
    } catch {
      enqueueErrorSnackBar({
        message:
          'Não foi possível preparar o contexto. Revise a descrição e tente novamente.',
      });
      setIsSubmitting(false);
    }
  };

  return (
    <DiexOnboarding
      isSubmitting={isSubmitting}
      onSubmit={(operationDescription) =>
        void submitOperation(operationDescription)
      }
    />
  );
};
