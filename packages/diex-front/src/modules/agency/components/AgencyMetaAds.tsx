import { styled } from '@linaria/react';
import { Button } from 'diex-ui/input';
import { themeCssVariables } from 'diex-ui/theme-constants';
import { isDefined } from 'diex-shared/utils';

import { useAgencyMetaAdsAccounts } from '@/agency/hooks/useAgencyMetaAdsAccounts';
import { MetaAdsStatus } from '~/generated-metadata/graphql';

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  padding: ${themeCssVariables.spacing[6]};
  width: 100%;
`;

const StyledHeader = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
`;

const StyledSubtitle = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledAccountRow = styled.div`
  align-items: center;
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  justify-content: space-between;
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledAccountName = styled.strong`
  color: ${themeCssVariables.font.color.primary};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledAccountMeta = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledStatusBadge = styled.span<{ tone: 'positive' | 'negative' }>`
  background: ${({ tone }) =>
    tone === 'positive'
      ? themeCssVariables.tag.background.green
      : themeCssVariables.tag.background.red};
  border-radius: ${themeCssVariables.border.radius.rounded};
  color: ${({ tone }) =>
    tone === 'positive'
      ? themeCssVariables.tag.text.green
      : themeCssVariables.tag.text.red};
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  padding: ${themeCssVariables.spacing[1]} ${themeCssVariables.spacing[2]};
`;

const StyledEmptyState = styled.p`
  color: ${themeCssVariables.font.color.tertiary};
  margin: 0;
`;

const formatDate = (value?: string | null) =>
  isDefined(value) ? new Date(value).toLocaleDateString('pt-BR') : null;

export const AgencyMetaAds = () => {
  const { metaAdsAccounts, loading, startMetaAdsConnection } =
    useAgencyMetaAdsAccounts();

  if (loading) {
    return <StyledContainer>Carregando contas do Meta Ads...</StyledContainer>;
  }

  return (
    <StyledContainer>
      <StyledHeader>
        <StyledSubtitle>
          A conexão é feita pelo Meta. Nenhum token é digitado nem colado aqui.
        </StyledSubtitle>
        <Button
          title="Conectar com o Meta"
          onClick={() => void startMetaAdsConnection()}
        />
      </StyledHeader>

      {metaAdsAccounts.length === 0 ? (
        <StyledEmptyState>
          Nenhuma conta de anúncios conectada. Use o botão acima para autorizar
          o acesso às contas que você administra no Meta.
        </StyledEmptyState>
      ) : (
        metaAdsAccounts.map((account) => {
          const isConnected = account.status === MetaAdsStatus.CONNECTED;
          const expiresAt = formatDate(account.tokenExpiresAt);
          const lastSyncedAt = formatDate(account.lastSyncedAt);

          return (
            <StyledAccountRow key={account.id}>
              <div>
                <StyledAccountName>{account.accountName}</StyledAccountName>
                <div>
                  <StyledAccountMeta>
                    {account.adAccountId}
                    {isDefined(expiresAt) && ` · autorização até ${expiresAt}`}
                    {isDefined(lastSyncedAt)
                      ? ` · último sync em ${lastSyncedAt}`
                      : ' · ainda não sincronizada'}
                  </StyledAccountMeta>
                </div>
              </div>

              <StyledStatusBadge tone={isConnected ? 'positive' : 'negative'}>
                {account.status}
              </StyledStatusBadge>
            </StyledAccountRow>
          );
        })
      )}
    </StyledContainer>
  );
};
