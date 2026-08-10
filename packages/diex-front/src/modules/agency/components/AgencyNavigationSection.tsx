import { useLocation } from 'react-router-dom';
import { styled } from '@linaria/react';
import { AppPath } from 'diex-shared/types';
import {
  IconBuildingSkyscraper,
  IconChartBar,
  IconFileText,
  IconPlug,
  IconTargetArrow,
} from 'diex-ui/icon';

import { currentUserState } from '@/auth/states/currentUserState';
import { NavigationDrawerAnimatedCollapseWrapper } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerAnimatedCollapseWrapper';
import { NavigationDrawerItem } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerItem';
import { NavigationDrawerSection } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerSection';
import { NavigationDrawerSectionTitle } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerSectionTitle';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

const StyledItems = styled.div`
  display: flex;
  flex-direction: column;
`;

const AGENCY_NAVIGATION_LINKS = [
  {
    label: 'Portal do parceiro',
    to: AppPath.AgencyPortal,
    Icon: IconBuildingSkyscraper,
  },
  {
    label: 'Painel de tráfego',
    to: AppPath.AgencyTrafficDashboard,
    Icon: IconChartBar,
  },
  {
    label: 'Métricas',
    to: AppPath.AgencyCustomMetrics,
    Icon: IconTargetArrow,
  },
  { label: 'Meta Ads', to: AppPath.AgencyMetaAds, Icon: IconPlug },
  {
    label: 'Relatórios',
    to: AppPath.AgencyClientReports,
    Icon: IconFileText,
  },
];

// Separate from DiexNavigationSection, which renders the client-facing CRM pages
// from the workspace page catalog. These links belong to whoever manages the
// agency, not to the workspace being managed.
export const AgencyNavigationSection = () => {
  const location = useLocation();
  const currentUser = useAtomStateValue(currentUserState);

  const canAccessAgencyPortal = currentUser?.isAgencyManager === true;

  if (!canAccessAgencyPortal) {
    return null;
  }

  return (
    <NavigationDrawerSection>
      <NavigationDrawerAnimatedCollapseWrapper>
        <NavigationDrawerSectionTitle label="Agência" />
      </NavigationDrawerAnimatedCollapseWrapper>
      <StyledItems>
        {AGENCY_NAVIGATION_LINKS.map(({ label, to, Icon }) => (
          <NavigationDrawerItem
            key={to}
            label={label}
            to={to}
            Icon={Icon}
            active={location.pathname === to}
          />
        ))}
      </StyledItems>
    </NavigationDrawerSection>
  );
};
