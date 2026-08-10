import { IconTargetArrow } from 'diex-ui/icon';

import { AgencyCustomMetrics } from '@/agency/components/AgencyCustomMetrics';
import { PageCardLayout } from '@/ui/layout/page/components/PageCardLayout';
import { PageHeader } from '@/ui/layout/page/components/PageHeader';

export const AgencyCustomMetricsPage = () => (
  <PageCardLayout
    header={<PageHeader title="Métricas da agência" Icon={IconTargetArrow} />}
  >
    <AgencyCustomMetrics />
  </PageCardLayout>
);
