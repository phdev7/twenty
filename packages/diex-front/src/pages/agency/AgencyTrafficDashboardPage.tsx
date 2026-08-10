import { IconChartBar } from 'diex-ui/icon';

import { AgencyTrafficDashboard } from '@/agency/components/AgencyTrafficDashboard';
import { PageCardLayout } from '@/ui/layout/page/components/PageCardLayout';
import { PageHeader } from '@/ui/layout/page/components/PageHeader';

export const AgencyTrafficDashboardPage = () => (
  <PageCardLayout
    header={<PageHeader title="Painel de tráfego" Icon={IconChartBar} />}
  >
    <AgencyTrafficDashboard />
  </PageCardLayout>
);
