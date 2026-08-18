import { useState } from 'react';
import { styled } from '@linaria/react';
import { Button } from 'diex-ui/input';
import { themeCssVariables } from 'diex-ui/theme-constants';
import { isDefined } from 'diex-shared/utils';
import { isNonEmptyString } from '@sniptt/guards';

import { useAgencyMetaAdsAccounts } from '@/agency/hooks/useAgencyMetaAdsAccounts';
import { useAgencyPortal } from '@/agency/hooks/useAgencyPortal';
import { Select } from '@/ui/input/components/Select';
import { MetaAdsStatus } from '~/generated-metadata/graphql';

// The connection can stay at agency level, which is what every account created
// before the client picker existed already is.
const NO_CLIENT_WORKSPACE = 'AGENCY';

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

const StyledErrorState = styled.p`
  background: ${themeCssVariables.tag.background.orange};
  border-radius: ${themeCssVariables.border.radius.md};
  color: ${themeCssVariables.tag.text.orange};
  margin: 0;
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledIntegrationNotice = styled.p`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
  margin: 0;
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledConnectRow = styled.div`
  align-items: flex-end;
  display: flex;
  gap: ${themeCssVariables.spacing[3]};
`;

const formatDate = (value?: string | null) =>
  isDefined(value) ? new Date(value).toLocaleDateString('pt-BR') : null;

export const AgencyMetaAds = () => {
  const { metaAdsAccounts, loading, errorMessage, startMetaAdsConnection } =
    useAgencyMetaAdsAccounts();
  const { clientWorkspaces } = useAgencyPortal();
  const [clientWorkspaceId, setClientWorkspaceId] =
    useState(NO_CLIENT_WORKSPACE);

  const clientWorkspaceNameById = new Map(
    clientWorkspaces.map((clientWorkspace) => [
      clientWorkspace.id,
      clientWorkspace.displayName ?? clientWorkspace.subdomain,
    ]),
  );

  if (loading) {
    return <StyledContainer>Carregando contas do Meta Ads...</StyledContainer>;
  }

  return (
    <StyledContainer>
      <StyledHeader>
        <StyledSubtitle>
          A conexão é feita pelo Meta. Nenhum token é digitado nem colado aqui.
        </StyledSubtitle>
        <StyledConnectRow>
          <Select
            dropdownId="agency-meta-ads-client-workspace"
            label="Vincular ao cliente"
            value={clientWorkspaceId}
            options={[
              { value: NO_CLIENT_WORKSPACE, label: 'Somente a agência' },
              ...clientWorkspaces.map((clientWorkspace) => ({
                value: clientWorkspace.id,
                label: clientWorkspace.displayName ?? clientWorkspace.subdomain,
              })),
            ]}
            onChange={setClientWorkspaceId}
          />
          <Button
            title="Conectar com o Meta"
            onClick={() =>
              void startMetaAdsConnection(
                clientWorkspaceId === NO_CLIENT_WORKSPACE
                  ? undefined
                  : clientWorkspaceId,
              )
            }
          />
        </StyledConnectRow>
      </StyledHeader>

      {/* Stated rather than left to be inferred from an empty page: this
          installation has no Google Ads integration, so no Google figure can
          appear in any agency dashboard. */}
      <StyledIntegrationNotice>
        Somente o Meta Ads está integrado nesta instalação. O Google Ads ainda
        não tem conexão disponível, e nenhum número de Google entra nos painéis
        ou nos relatórios de cliente.
      </StyledIntegrationNotice>

      {isNonEmptyString(errorMessage) ? (
        <StyledErrorState>
          Não foi possível carregar as contas conectadas: {errorMessage}
        </StyledErrorState>
      ) : null}

      {metaAdsAccounts.length === 0 ? (
        isNonEmptyString(errorMessage) ? null : (
          <StyledEmptyState>
            Nenhuma conta de anúncios conectada. Use o botão acima para
            autorizar o acesso às contas que você administra no Meta.
          </StyledEmptyState>
        )
      ) : (
        metaAdsAccounts.map((account) => {
          const isConnected = account.status === MetaAdsStatus.CONNECTED;
          const expiresAt = formatDate(account.tokenExpiresAt);
          const lastSyncedAt = formatDate(account.lastSyncedAt);
          const clientName = isDefined(account.clientWorkspaceId)
            ? (clientWorkspaceNameById.get(account.clientWorkspaceId) ??
              'Cliente fora desta agência')
            : null;

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
                    {isDefined(clientName)
                      ? ` · cliente: ${clientName}`
                      : ' · sem cliente vinculado'}
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
