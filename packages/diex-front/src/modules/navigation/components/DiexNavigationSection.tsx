import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  type IconComponent,
  IconBrandWhatsapp,
  IconCalendar,
  IconChartLine,
  IconInbox,
  IconRefresh,
  IconRocket,
  IconSettings,
  IconSparkles,
  IconUsers,
} from 'diex-ui/icon';

import { getDiexOnboardingRoute } from '@/diex-onboarding/utils/diexOnboardingApi';
import {
  type DiexPageCatalogItem,
  type DiexPageCatalogState,
} from '@/diex-onboarding/types/diexOnboardingTypes';
import { NavigationDrawerAnimatedCollapseWrapper } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerAnimatedCollapseWrapper';
import { NavigationDrawerItem } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerItem';
import { NavigationDrawerSection } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerSection';
import { NavigationDrawerSectionTitle } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerSectionTitle';
import { styled } from '@linaria/react';

type ReadinessResponse = { ready?: boolean };

type DiexNavigationLink = {
  label: string;
  to: string;
  Icon: IconComponent;
  group: string;
};

const StyledItems = styled.div`
  display: flex;
  flex-direction: column;
`;

const getDiexNavigationIcon = (icon: string): IconComponent => {
  switch (icon) {
    case 'inbox':
      return IconInbox;
    case 'whatsapp':
      return IconBrandWhatsapp;
    case 'calendar':
      return IconCalendar;
    case 'rocket':
      return IconRocket;
    case 'refresh':
      return IconRefresh;
    case 'users':
      return IconUsers;
    case 'sparkles':
      return IconSparkles;
    case 'settings':
      return IconSettings;
    default:
      return IconChartLine;
  }
};

export const DiexNavigationSection = () => {
  const location = useLocation();
  const [readiness, setReadiness] = useState<ReadinessResponse | null>(null);
  const [pageCatalog, setPageCatalog] = useState<DiexPageCatalogState | null>(
    null,
  );

  const loadNavigation = useCallback(async () => {
    const [nextReadiness, nextPageCatalog] = await Promise.all([
      getDiexOnboardingRoute<ReadinessResponse>(
        '/rest/diex/onboarding/readiness',
      ).catch(() => null),
      getDiexOnboardingRoute<DiexPageCatalogState>(
        '/rest/diex/onboarding/pages',
      ).catch(() => null),
    ]);

    if (nextReadiness) {
      setReadiness(nextReadiness);
    }

    if (nextPageCatalog) {
      setPageCatalog(nextPageCatalog);
    }
  }, []);

  useEffect(() => {
    const handleUpdated = () => {
      void loadNavigation().catch(() => undefined);
    };

    void loadNavigation().catch(() => undefined);
    window.addEventListener('diex-onboarding-updated', handleUpdated);

    return () => {
      window.removeEventListener('diex-onboarding-updated', handleUpdated);
    };
  }, [loadNavigation]);

  const links = useMemo<DiexNavigationLink[]>(() => {
    if (pageCatalog) {
      const usedRoutes = new Set<string>();
      const catalogLinks = pageCatalog.items
        .filter(
          (item) =>
            (item.showInNavigation ||
              (item.key === 'first-steps' && !readiness?.ready)) &&
            item.status === 'ACTIVE',
        )
        .sort((left, right) => left.position - right.position)
        .reduce<DiexNavigationLink[]>((items, item: DiexPageCatalogItem) => {
          if (usedRoutes.has(item.route)) {
            return items;
          }

          usedRoutes.add(item.route);
          items.push({
            label: item.label,
            to:
              item.key === 'first-steps'
                ? (item.nativeRoute ?? '/diex/first-steps')
                : item.route,
            Icon: getDiexNavigationIcon(item.icon),
            group: item.navigationGroup,
          });

          return items;
        }, []);

      catalogLinks.push({
        label: 'Páginas e menu',
        to: '/diex/pages',
        Icon: IconSettings,
        group: 'Configuração',
      });

      return catalogLinks;
    }

    return [
      {
        label: 'Configurar operação',
        to: '/diex/first-steps',
        Icon: IconRocket,
        group: 'Ativação',
      },
      {
        label: 'Páginas e menu',
        to: '/diex/pages',
        Icon: IconSettings,
        group: 'Configuração',
      },
    ];
  }, [pageCatalog, readiness?.ready]);

  const groupedLinks = links.reduce<Record<string, DiexNavigationLink[]>>(
    (groups, link) => {
      groups[link.group] = [...(groups[link.group] ?? []), link];

      return groups;
    },
    {},
  );

  return (
    <>
      {Object.entries(groupedLinks).map(([group, groupLinks]) => (
        <NavigationDrawerSection key={group}>
          <NavigationDrawerAnimatedCollapseWrapper>
            <NavigationDrawerSectionTitle label={group} />
          </NavigationDrawerAnimatedCollapseWrapper>
          <StyledItems>
            {groupLinks.map(({ label, to, Icon }) => (
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
      ))}
    </>
  );
};
