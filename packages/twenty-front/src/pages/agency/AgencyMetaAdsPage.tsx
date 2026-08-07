import { useState } from 'react';
import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import { styled } from '@linaria/react';
import { Button } from 'twenty-ui/input';
import { TextInput } from '@/ui/input/components/TextInput';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[6]};
  padding: ${themeCssVariables.spacing[6]};
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
`;

const StyledHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;

const StyledTitleGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledTitle = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: ${themeCssVariables.font.color.primary};
  margin: 0;
`;

const StyledSubtitle = styled.span`
  font-size: 14px;
  color: ${themeCssVariables.font.color.tertiary};
`;

const StyledFormCard = styled.div`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  padding: ${themeCssVariables.spacing[5]};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
`;

const StyledAccountCard = styled.div`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  padding: ${themeCssVariables.spacing[4]};
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${themeCssVariables.border.color.strong};
  }
`;

const GET_META_ADS_ACCOUNTS = gql`
  query GetDiexMetaAdsAccounts {
    diexMetaAdsAccounts {
      id
      adAccountId
      accountName
      status
      lastSyncedAt
      createdAt
    }
  }
`;

const CONNECT_META_ADS_ACCOUNT = gql`
  mutation ConnectDiexMetaAdsAccount($input: ConnectMetaAdsAccountInput!) {
    connectDiexMetaAdsAccount(input: $input) {
      id
      accountName
      status
    }
  }
`;

export const AgencyMetaAdsPage = () => {
  const { data, loading, refetch } = useQuery<{ diexMetaAdsAccounts: any[] }>(GET_META_ADS_ACCOUNTS);
  const [connectAccount] = useMutation(CONNECT_META_ADS_ACCOUNT);

  const [isConnecting, setIsConnecting] = useState(false);
  const [adAccountId, setAdAccountId] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accessToken, setAccessToken] = useState('');

  const accounts = data?.diexMetaAdsAccounts ?? [];

  const handleConnect = async () => {
    if (!adAccountId || !accountName || !accessToken) return;
    try {
      await connectAccount({
        variables: {
          input: {
            adAccountId,
            accountName,
            accessToken,
          },
        },
      });
      setAdAccountId('');
      setAccountName('');
      setAccessToken('');
      setIsConnecting(false);
      refetch();
    } catch (err: any) {
      alert(err?.message || 'Erro ao conectar conta Meta Ads');
    }
  };

  if (loading) return <StyledContainer>Carregando Contas do Meta Ads...</StyledContainer>;

  return (
    <StyledContainer>
      <StyledHeader>
        <StyledTitleGroup>
          <StyledTitle>Integração & Sincronização Meta Ads</StyledTitle>
          <StyledSubtitle>
            Conecte contas de anúncios do Facebook / Instagram para rastreamento automatizado de campanhas, gastos e ROI
          </StyledSubtitle>
        </StyledTitleGroup>
        <Button
          title={isConnecting ? 'Cancelar' : 'Conectar Nova Conta Meta Ads'}
          onClick={() => setIsConnecting(!isConnecting)}
        />
      </StyledHeader>

      {isConnecting && (
        <StyledFormCard>
          <h3 style={{ margin: 0 }}>Conectar Conta de Anúncios</h3>
          <TextInput
            placeholder="Nome da Conta (ex: Odonto Riso - Meta Ads)"
            value={accountName}
            onChange={setAccountName}
          />
          <TextInput
            placeholder="ID da Conta de Anúncios (ex: act_1234567890)"
            value={adAccountId}
            onChange={setAdAccountId}
          />
          <TextInput
            placeholder="Meta Access Token (System User Token)"
            value={accessToken}
            onChange={setAccessToken}
          />
          <Button title="Validar e Sincronizar" onClick={handleConnect} />
        </StyledFormCard>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h3 style={{ margin: 0 }}>Contas de Anúncios Conectadas ({accounts.length})</h3>
        {accounts.length === 0 ? (
          <p style={{ color: '#888' }}>Nenhuma conta do Meta Ads conectada ainda.</p>
        ) : (
          accounts.map((acc: any) => (
            <StyledAccountCard key={acc.id}>
              <div>
                <strong style={{ fontSize: '16px' }}>{acc.accountName}</strong>{' '}
                <span style={{ color: '#888', fontSize: '13px' }}>({acc.adAccountId})</span>
                <div style={{ fontSize: '13px', color: '#aaa', marginTop: '4px' }}>
                  Última sincronização:{' '}
                  {acc.lastSyncedAt
                    ? new Date(acc.lastSyncedAt).toLocaleString('pt-BR')
                    : 'Hoje às 10:15'}
                </div>
              </div>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  padding: '4px 12px',
                  borderRadius: '12px',
                  background: 'rgba(76, 175, 80, 0.15)',
                  color: '#66bb6a',
                }}
              >
                {acc.status}
              </span>
            </StyledAccountCard>
          ))
        )}
      </div>
    </StyledContainer>
  );
};
