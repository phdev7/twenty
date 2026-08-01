import { IconRocket } from 'twenty-ui/icon';

import { DiexOnboarding } from '@/diex-onboarding/components/DiexOnboarding';
import { PageCardLayout } from '@/ui/layout/page/components/PageCardLayout';
import { PageHeader } from '@/ui/layout/page/components/PageHeader';

export const DiexOnboardingPage = () => (
  <PageCardLayout
    header={<PageHeader title="Primeiros passos" Icon={IconRocket} />}
  >
    <DiexOnboarding />
  </PageCardLayout>
);
