import { IconBuildingSkyscraper } from 'diex-ui/icon';

import { AgencyPartnerPortal } from '@/agency/components/AgencyPartnerPortal';
import { PageCardLayout } from '@/ui/layout/page/components/PageCardLayout';
import { PageHeader } from '@/ui/layout/page/components/PageHeader';

export const AgencyPartnerPortalPage = () => (
  <PageCardLayout
    header={
      <PageHeader title="Portal do parceiro" Icon={IconBuildingSkyscraper} />
    }
  >
    <AgencyPartnerPortal />
  </PageCardLayout>
);
