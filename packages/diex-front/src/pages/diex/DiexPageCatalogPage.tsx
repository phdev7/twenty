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
    readiness,
    architecture,
    isLoadingCommercialData,
    isUpdatingArchitecture,
    commercialError,
    isReadinessReadConfirmed,
    isPageCatalogReadConfirmed,
    load,
    createPage,
    archivePage,
    restorePage,
    togglePageNavigation,
    updatePage,
  } = useDiexOnboarding();
  const operationLabel =
    (isReadinessReadConfirmed
      ? readiness?.readinessPack?.operationLabel?.toLowerCase()
      : null) ?? 'operação';

  return (
    <PageCardLayout
      header={
        <PageHeader
          title={`Estrutura e menu da ${operationLabel}`}
          Icon={IconSettings}
        />
      }
    >
      <StyledBody>
        <DiexOnboardingPageCatalogStep
          catalog={architecture?.pageCatalog ?? null}
          isLoading={isLoadingCommercialData}
          isReadConfirmed={isPageCatalogReadConfirmed}
          isUpdating={isUpdatingArchitecture}
          errorMessage={commercialError}
          onRefresh={() => void load()}
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
