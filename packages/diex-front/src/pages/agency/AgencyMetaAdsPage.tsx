import { IconPlug } from 'diex-ui/icon';

import { AgencyMetaAds } from '@/agency/components/AgencyMetaAds';
import { PageCardLayout } from '@/ui/layout/page/components/PageCardLayout';
import { PageHeader } from '@/ui/layout/page/components/PageHeader';

export const AgencyMetaAdsPage = () => (
  <PageCardLayout
    header={<PageHeader title="Contas do Meta Ads" Icon={IconPlug} />}
  >
    <AgencyMetaAds />
  </PageCardLayout>
);
