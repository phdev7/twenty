import { useCallback, useEffect, useState } from 'react';

import { type DiexPrimaryChannel } from '@/diex-onboarding/types/diexOnboardingTypes';
import {
  getDiexOnboardingRoute,
  postDiexOnboardingRoute,
} from '@/diex-onboarding/utils/diexOnboardingApi';

type PrimaryChannelResponse = {
  primaryChannel: DiexPrimaryChannel | null;
};

export const useDiexPrimaryChannel = () => {
  const [primaryChannel, setPrimaryChannelState] =
    useState<DiexPrimaryChannel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await getDiexOnboardingRoute<PrimaryChannelResponse>(
        '/rest/diex/onboarding/primary-channel',
      );

      setPrimaryChannelState(response.primaryChannel);
      setErrorMessage(null);
    } catch {
      setErrorMessage(
        'Não foi possível carregar a forma principal de entrada.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const setPrimaryChannel = useCallback(
    async (nextPrimaryChannel: DiexPrimaryChannel) => {
      setIsSaving(true);

      try {
        const response = await postDiexOnboardingRoute<PrimaryChannelResponse>(
          '/rest/diex/onboarding/primary-channel',
          { primaryChannel: nextPrimaryChannel },
        );

        setPrimaryChannelState(response.primaryChannel);
        setErrorMessage(null);
      } catch {
        setErrorMessage(
          'Não foi possível salvar a forma principal de entrada.',
        );
      } finally {
        setIsSaving(false);
      }
    },
    [],
  );

  return {
    primaryChannel,
    isLoading,
    isSaving,
    errorMessage,
    load,
    setPrimaryChannel,
  };
};
