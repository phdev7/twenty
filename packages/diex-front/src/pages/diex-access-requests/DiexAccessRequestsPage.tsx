import { IconUsers } from 'diex-ui/icon';

import { DiexAccessRequests } from '@/diex-access-requests/components/DiexAccessRequests';
import { PageCardLayout } from '@/ui/layout/page/components/PageCardLayout';
import { PageHeader } from '@/ui/layout/page/components/PageHeader';

export const DiexAccessRequestsPage = () => (
  <PageCardLayout
    header={<PageHeader title="Solicitações de acesso" Icon={IconUsers} />}
  >
    <DiexAccessRequests />
  </PageCardLayout>
);
