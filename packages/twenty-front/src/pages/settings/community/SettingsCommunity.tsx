import { SettingsCard } from '@/settings/components/SettingsCard';
import { SettingsDiscoveryHeroCard } from '@/settings/components/SettingsDiscoveryHeroCard';
import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { SettingsLabContent } from '@/settings/lab/components/SettingsLabContent';
import { SettingsPageLayout } from '@/settings/components/layout/SettingsPageLayout';
import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { useContext } from 'react';
import { IconWorld, type IconComponent } from 'twenty-ui/icon';
import { H2Title } from 'twenty-ui/typography';
import { Section } from 'twenty-ui/layout';
import { SettingsPath } from 'twenty-shared/types';
import { getSettingsPath } from 'twenty-shared/utils';
import {
  MOBILE_VIEWPORT,
  ThemeContext,
  themeCssVariables,
} from 'twenty-ui/theme-constants';
const SETTINGS_COMMUNITY_HERO_INSTANCE_ID_PREFIX = 'settings-community-hero';

const StyledCardLink = styled.a`
  display: block;
  min-width: 0;
  text-decoration: none;
`;

const StyledCardsGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: repeat(2, minmax(0, 1fr));

  @media (max-width: ${MOBILE_VIEWPORT}px) {
    grid-template-columns: 1fr;
  }
`;

const StyledFeaturesContent = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[4]};
`;

type SettingsCommunityLink = {
  href: string;
  Icon: IconComponent;
  iconColor: string;
  cardTitle: string;
};

export const SettingsCommunity = () => {
  const { theme } = useContext(ThemeContext);

  const socialLinks: SettingsCommunityLink[] = [
    {
      href: 'https://bydiex.com',
      Icon: IconWorld,
      iconColor: themeCssVariables.color.blue9,
      cardTitle: t`Conheça a Diex`,
    },
  ];

  return (
    <SettingsPageLayout
      title={t`Diex CRM`}
      links={[
        {
          children: t`Other`,
          href: getSettingsPath(SettingsPath.Community),
        },
        { children: t`Diex` },
      ]}
    >
      <SettingsPageContainer>
        <Section>
          <SettingsDiscoveryHeroCard
            lightSrc="/images/brand/logomark.svg"
            darkSrc="/images/brand/logomark.svg"
            instanceIdPrefix={SETTINGS_COMMUNITY_HERO_INSTANCE_ID_PREFIX}
            tabs={[]}
          />
        </Section>

        <Section>
          <H2Title
            title={t`Ecossistema Diex`}
            description={t`Tecnologia comercial para transformar relacionamento em receita previsível.`}
          />
          <StyledCardsGrid>
            {socialLinks.map(({ href, Icon, iconColor, cardTitle }) => (
              <StyledCardLink
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
              >
                <SettingsCard
                  Icon={
                    <Icon
                      size={theme.icon.size.md}
                      stroke={theme.icon.stroke.sm}
                    />
                  }
                  iconColor={iconColor}
                  title={cardTitle}
                />
              </StyledCardLink>
            ))}
          </StyledCardsGrid>
        </Section>

        <Section>
          <H2Title
            title={t`Laboratório`}
            description={t`Ative recursos experimentais do Diex CRM somente quando fizerem sentido para sua operação.`}
          />
          <StyledFeaturesContent>
            <SettingsLabContent />
          </StyledFeaturesContent>
        </Section>
      </SettingsPageContainer>
    </SettingsPageLayout>
  );
};
