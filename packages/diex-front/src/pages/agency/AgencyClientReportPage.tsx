import { IconFileText } from 'diex-ui/icon';

import { AgencyClientReport } from '@/agency/components/AgencyClientReport';
import { PageCardLayout } from '@/ui/layout/page/components/PageCardLayout';
import { PageHeader } from '@/ui/layout/page/components/PageHeader';

export const AgencyClientReportPage = () => (
  <PageCardLayout
    header={<PageHeader title="Relatório do cliente" Icon={IconFileText} />}
  >
    <AgencyClientReport />
  </PageCardLayout>
);
