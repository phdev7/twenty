import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { SettingsPageLayout } from '@/settings/components/layout/SettingsPageLayout';
import { useWhatsappConnection } from '@/settings/accounts/hooks/useWhatsappConnection';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { SettingsPath } from 'diex-shared/types';
import { getSettingsPath } from 'diex-shared/utils';
import { Button } from 'diex-ui/input';
import { Section } from 'diex-ui/layout';
import { themeCssVariables } from 'diex-ui/theme-constants';
import { H2Title } from 'diex-ui/typography';

const StyledPanel = styled.div`
  align-items: center;
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  padding: ${themeCssVariables.spacing[8]};
  text-align: center;
`;

const StyledQrCode = styled.img`
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  height: 264px;
  width: 264px;
`;

const StyledMessage = styled.p`
  color: ${themeCssVariables.font.color.secondary};
  margin: 0;
  max-width: 420px;
`;

const StyledStatus = styled.p<{ tone: 'ok' | 'pending' | 'error' }>`
  color: ${({ tone }) =>
    tone === 'ok'
      ? themeCssVariables.color.green
      : tone === 'error'
        ? themeCssVariables.color.red
        : themeCssVariables.color.orange};
  font-weight: ${themeCssVariables.font.weight.medium};
  margin: 0;
`;

export const SettingsAccountsWhatsapp = () => {
  const { t } = useLingui();
  const { connection, isLoading, errorMessage, refresh } =
    useWhatsappConnection();

  const isConnected = connection?.state === 'CONNECTED';
  const tone = isConnected ? 'ok' : connection?.state === 'UNAVAILABLE' ? 'error' : 'pending';

  const statusLabel = isConnected
    ? t`Connected`
    : connection?.state === 'AWAITING_SCAN'
      ? t`Waiting for scan`
      : connection?.state === 'UNAVAILABLE'
        ? t`Unavailable`
        : t`Connecting`;

  return (
    <SettingsPageLayout
      title={t`WhatsApp`}
      links={[
        {
          children: t`Accounts`,
          href: getSettingsPath(SettingsPath.Accounts),
        },
        { children: t`WhatsApp` },
      ]}
    >
      <SettingsPageContainer>
        <Section>
          <H2Title
            title={t`Business WhatsApp`}
            description={t`Scan the code with the phone that answers your customers. Conversations then arrive in the commercial inbox.`}
          />
          <StyledPanel>
            {errorMessage ? (
              <StyledStatus tone="error">{errorMessage}</StyledStatus>
            ) : (
              <StyledStatus tone={tone}>{statusLabel}</StyledStatus>
            )}

            {connection?.qrCodeDataUri && !isConnected ? (
              <StyledQrCode src={connection.qrCodeDataUri} alt={t`WhatsApp QR code`} />
            ) : null}

            {connection?.message ? (
              <StyledMessage>{connection.message}</StyledMessage>
            ) : null}

            <Button
              title={isConnected ? t`Check connection` : t`Refresh code`}
              variant="secondary"
              disabled={isLoading}
              onClick={() => void refresh()}
            />
          </StyledPanel>
        </Section>
      </SettingsPageContainer>
    </SettingsPageLayout>
  );
};
