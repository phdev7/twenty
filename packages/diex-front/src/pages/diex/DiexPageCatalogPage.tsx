import { styled } from '@linaria/react';
import { IconSettings } from 'diex-ui/icon';

import { DiexOnboardingPageCatalogStep } from '@/diex-onboarding/components/DiexOnboardingPageCatalogStep';
import { useDiexOnboarding } from '@/diex-onboarding/hooks/useDiexOnboarding';
import { PageCardLayout } from '@/ui/layout/page/components/PageCardLayout';
import { PageHeader } from '@/ui/layout/page/components/PageHeader';
import { themeCssVariables } from 'diex-ui/theme-constants';

const StyledBody = styled.main`
  box-sizing: border-box;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  overflow-y: auto;
  padding: ${themeCssVariables.spacing[5]};
`;

export const DiexPageCatalogPage = () => {
  const {
    architecture,
    isLoadingCommercialData,
    isUpdatingArchitecture,
    createPage,
    archivePage,
    restorePage,
    togglePageNavigation,
    updatePage,
  } = useDiexOnboarding();

  return (
    <PageCardLayout
      header={<PageHeader title="Páginas e menu" Icon={IconSettings} />}
    >
      <StyledBody>
        <DiexOnboardingPageCatalogStep
          catalog={architecture?.pageCatalog ?? null}
          isLoading={isLoadingCommercialData}
          isUpdating={isUpdatingArchitecture}
          onCreate={createPage}
          onArchive={(key) => void archivePage(key)}
          onRestore={(key) => void restorePage(key)}
          onToggleNavigation={(page) => void togglePageNavigation(page)}
          onUpdate={updatePage}
        />
      </StyledBody>
    </PageCardLayout>
  );
};
