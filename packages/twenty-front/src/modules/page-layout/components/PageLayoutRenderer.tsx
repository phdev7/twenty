import { PageLayoutEditModeProvider } from '@/page-layout/components/PageLayoutEditModeProvider';
import { PageLayoutInitializationQueryEffect } from '@/page-layout/components/PageLayoutInitializationQueryEffect';
import { PageLayoutRecordPageCustomizationSessionRegistrationEffect } from '@/page-layout/components/PageLayoutRecordPageCustomizationSessionRegistrationEffect';
import { PageLayoutRendererContent } from '@/page-layout/components/PageLayoutRendererContent';
import { DashboardGlobalFiltersProvider } from '@/page-layout/dashboard/contexts/DashboardGlobalFiltersContext';
import { PageLayoutComponentInstanceContext } from '@/page-layout/states/contexts/PageLayoutComponentInstanceContext';
import { getTabListInstanceIdFromPageLayoutAndRecord } from '@/page-layout/utils/getTabListInstanceIdFromPageLayoutAndRecord';
import { useLayoutRenderingContext } from '@/ui/layout/contexts/LayoutRenderingContext';
import { TabListComponentInstanceContext } from '@/ui/layout/tab-list/states/contexts/TabListComponentInstanceContext';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { PageLayoutType } from '~/generated-metadata/graphql';

type PageLayoutRendererProps = {
  pageLayoutId: string;
};

export const PageLayoutRenderer = ({
  pageLayoutId,
}: PageLayoutRendererProps) => {
  const { targetRecordIdentifier, layoutType } = useLayoutRenderingContext();

  const tabListInstanceId = getTabListInstanceIdFromPageLayoutAndRecord({
    pageLayoutId,
    layoutType,
    targetRecordIdentifier,
  });

  return (
    <PageLayoutComponentInstanceContext.Provider
      value={{
        instanceId: pageLayoutId,
      }}
    >
      <TabListComponentInstanceContext.Provider
        value={{
          instanceId: tabListInstanceId,
        }}
      >
        <PageLayoutEditModeProvider
          layoutType={layoutType}
          pageLayoutId={pageLayoutId}
        >
          <DashboardGlobalFiltersProvider
            isEnabled={layoutType === PageLayoutType.DASHBOARD}
          >
            <PageLayoutInitializationQueryEffect pageLayoutId={pageLayoutId} />
            <PageLayoutRecordPageCustomizationSessionRegistrationEffect />
            <PageLayoutRendererContent />
          </DashboardGlobalFiltersProvider>
        </PageLayoutEditModeProvider>
      </TabListComponentInstanceContext.Provider>
    </PageLayoutComponentInstanceContext.Provider>
  );
};
