import { useCallback, useEffect, useState } from 'react';

import { type DiexPageCatalogState } from '@/diex-onboarding/types/diexOnboardingTypes';
import { getDiexOnboardingRoute } from '@/diex-onboarding/utils/diexOnboardingApi';

type DiexPagePresentation = {
  label: string;
  description: string;
  primaryAction: string | null;
};

export const useDiexPagePresentation = ({
  pageKey,
  fallbackLabel,
  fallbackDescription,
}: {
  pageKey: string;
  fallbackLabel: string;
  fallbackDescription: string;
}): DiexPagePresentation => {
  const [presentation, setPresentation] = useState<DiexPagePresentation>({
    label: fallbackLabel,
    description: fallbackDescription,
    primaryAction: null,
  });

  const loadPresentation = useCallback(async () => {
    try {
      const catalog = await getDiexOnboardingRoute<DiexPageCatalogState>(
        '/rest/diex/onboarding/pages',
      );
      const page = catalog.items.find(({ key }) => key === pageKey);

      setPresentation({
        label: page?.label?.trim() || fallbackLabel,
        description: page?.description?.trim() || fallbackDescription,
        primaryAction: page?.primaryAction?.trim() || null,
      });
    } catch {
      setPresentation({
        label: fallbackLabel,
        description: fallbackDescription,
        primaryAction: null,
      });
    }
  }, [fallbackDescription, fallbackLabel, pageKey]);

  useEffect(() => {
    const handleUpdated = () => void loadPresentation();

    void loadPresentation();
    window.addEventListener('diex-onboarding-updated', handleUpdated);

    return () => {
      window.removeEventListener('diex-onboarding-updated', handleUpdated);
    };
  }, [loadPresentation]);

  return presentation;
};
