import { useMemo, useState } from 'react';
import { AppPath } from 'diex-shared/types';

import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { DiexOnboarding } from '@/diex-onboarding/components/DiexOnboarding';
import { buildDescriptionFromSignupAnswers } from '@/diex-onboarding/utils/buildDescriptionFromSignupAnswers';
import { completeDiexOnboarding } from '@/diex-onboarding/utils/completeDiexOnboarding';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

export const DiexOnboardingPage = () => {
  const { enqueueErrorSnackBar } = useSnackBar();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currentWorkspace = useAtomStateValue(currentWorkspaceState);
  const initialDescription = useMemo(
    () => buildDescriptionFromSignupAnswers(currentWorkspace),
    [currentWorkspace],
  );

  const submitOperation = async (
    operationDescription: string,
  ): Promise<void> => {
    setIsSubmitting(true);

    try {
      await completeDiexOnboarding(operationDescription);
      window.location.replace(AppPath.DiexFirstSteps);
    } catch (error) {
      // Telling the user to revise the description is wrong whenever the cause
      // is on the server, which it usually is.
      const reason = error instanceof Error ? error.message : String(error);

      enqueueErrorSnackBar({
        message: `Não foi possível preparar o contexto: ${reason}`,
      });
      setIsSubmitting(false);
    }
  };

  return (
    <DiexOnboarding
      isSubmitting={isSubmitting}
      initialDescription={initialDescription}
      onSubmit={(operationDescription) =>
        void submitOperation(operationDescription)
      }
    />
  );
};
