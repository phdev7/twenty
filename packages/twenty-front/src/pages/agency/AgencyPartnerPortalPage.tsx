import { useState } from 'react';
import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import { styled } from '@linaria/react';
import { Button } from 'twenty-ui/input';
import { Card } from 'twenty-ui/surfaces';
import { TextInput } from '@/ui/input/components/TextInput';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  padding: ${themeCssVariables.spacing[6]};
  max-width: 1000px;
  margin: 0 auto;
  width: 100%;
`;

const StyledHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid ${themeCssVariables.border.color.medium};
  padding-bottom: ${themeCssVariables.spacing[4]};
`;

const StyledSlotsCard = styled.div`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  padding: ${themeCssVariables.spacing[4]};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const StyledFormCard = styled.div`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  padding: ${themeCssVariables.spacing[4]};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
`;

const StyledClientGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: ${themeCssVariables.spacing[4]};
`;

const StyledClientCard = styled.div`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  padding: ${themeCssVariables.spacing[4]};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  justify-content: space-between;

  .client-header {
    display: flex;
    flex-direction: column;
    gap: 4px;

    strong {
      font-size: 16px;
      font-weight: 600;
    }

    a {
      color: ${themeCssVariables.font.color.light};
      text-decoration: none;
      font-size: 13px;
      opacity: 0.7;

      &:hover {
        text-decoration: underline;
      }
    }
  }
`;

const GET_MY_AGENCY_PORTAL_DATA = gql`
  query GetMyAgencyPortalData {
    myDiexAgency {
      id
      name
      slug
      workspaceSlotsLimit
      status
    }
    diexAgencyManagedWorkspaces {
      id
      displayName
      subdomain
      activationStatus
      createdAt
    }
  }
`;

const CREATE_AGENCY_WORKSPACE = gql`
  mutation CreateAgencyWorkspace($input: CreateAgencyWorkspaceInput!) {
    createDiexAgencyWorkspace(input: $input) {
      id
      displayName
      subdomain
    }
  }
`;

export const AgencyPartnerPortalPage = () => {
  const { data, loading, refetch } = useQuery<{ myDiexAgency: any; diexAgencyManagedWorkspaces: any[] }>(GET_MY_AGENCY_PORTAL_DATA);
  const [createWorkspace] = useMutation(CREATE_AGENCY_WORKSPACE);

  const [isCreating, setIsCreating] = useState(false);
  const [clientCompanyName, setClientCompanyName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [clientAdminEmail, setClientAdminEmail] = useState('');
  const [operationDescription, setOperationDescription] = useState('');

  const agency = data?.myDiexAgency;
  const clientWorkspaces = data?.diexAgencyManagedWorkspaces ?? [];

  const slotsUsed = clientWorkspaces.length;
  const slotsLimit = agency?.workspaceSlotsLimit ?? 0;
  const hasAvailableSlots = slotsUsed < slotsLimit;

  const handleCreateClientWorkspace = async () => {
    if (!clientCompanyName || !subdomain || !clientAdminEmail) return;

    try {
      await createWorkspace({
        variables: {
          input: {
            clientCompanyName,
            subdomain: subdomain.toLowerCase(),
            clientAdminEmail,
            operationDescription,
          },
        },
      });

      setClientCompanyName('');
      setSubdomain('');
      setClientAdminEmail('');
      setOperationDescription('');
      setIsCreating(false);
      refetch();
    } catch (err: any) {
      alert(err?.message || 'Erro ao criar workspace do cliente.');
    }
  };

  const handleAccessWorkspace = (clientSubdomain: string) => {
    window.location.href = `https://${clientSubdomain}.crm.bydiex.com`;
  };

  if (loading) return <StyledContainer>Carregando Portal do Parceiro...</StyledContainer>;

  if (!agency) {
    return (
      <StyledContainer>
        <h2>Portal do Parceiro</h2>
        <p>Sua conta de usuário ainda não está associada a nenhuma agência de marketing cadastrada.</p>
      </StyledContainer>
    );
  }

  return (
    <StyledContainer>
      <StyledHeader>
        <div>
          <h2>Portal do Parceiro — {agency.name}</h2>
          <span style={{ color: '#888', fontSize: '14px' }}>Gestão de Clientes e Licenças CRM</span>
        </div>
        <Button
          title={isCreating ? 'Cancelar' : 'Novo Cliente / Workspace'}
          disabled={!hasAvailableSlots && !isCreating}
          onClick={() => setIsCreating(!isCreating)}
        />
      </StyledHeader>

      <StyledSlotsCard>
        <div>
          <span style={{ fontSize: '13px', color: '#aaa' }}>Consumo de Licenças (Slots de Workspaces)</span>
          <div style={{ fontSize: '22px', fontWeight: 'bold', marginTop: '4px' }}>
            {slotsUsed} / {slotsLimit} slots utilizados
          </div>
        </div>
        <div>
          {hasAvailableSlots ? (
            <span style={{ color: '#4caf50', fontWeight: '600' }}>
              {slotsLimit - slotsUsed} slots disponíveis para contratação
            </span>
          ) : (
            <span style={{ color: '#f44336', fontWeight: '600' }}>
              Limite atingido. Entre em contato com a Diex para mais slots.
            </span>
          )}
        </div>
      </StyledSlotsCard>

      {isCreating && (
        <StyledFormCard>
          <h3>Cadastrar Novo Cliente</h3>
          <TextInput
            placeholder="Nome da Empresa / Cliente (ex: Clínica Odonto Riso)"
            value={clientCompanyName}
            onChange={(val: string) => {
              setClientCompanyName(val);
              setSubdomain(val.toLowerCase().replace(/[^a-z0-9]/g, ''));
            }}
          />
          <TextInput
            placeholder="Subdomínio do CRM (ex: odontoriso)"
            value={subdomain}
            onChange={setSubdomain}
          />
          <TextInput
            placeholder="E-mail do Administrador do Cliente"
            value={clientAdminEmail}
            onChange={setClientAdminEmail}
          />
          <TextInput
            placeholder="Descrição da operação do cliente (para o Arquiteto de IA montar o CRM)"
            value={operationDescription}
            onChange={setOperationDescription}
          />
          <Button title="Criar Workspace do Cliente" onClick={handleCreateClientWorkspace} />
        </StyledFormCard>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h3>Workspaces dos Seus Clientes ({clientWorkspaces.length})</h3>
        {clientWorkspaces.length === 0 ? (
          <p style={{ color: '#888' }}>Nenhum workspace de cliente cadastrado nesta agência ainda.</p>
        ) : (
          <StyledClientGrid>
            {clientWorkspaces.map((client: any) => (
              <StyledClientCard key={client.id}>
                <div className="client-header">
                  <strong>{client.displayName}</strong>
                  <a href={`https://${client.subdomain}.crm.bydiex.com`} target="_blank" rel="noreferrer">
                    {client.subdomain}.crm.bydiex.com
                  </a>
                </div>

                <Button
                  title="Acessar / Configurar CRM do Cliente"
                  onClick={() => handleAccessWorkspace(client.subdomain)}
                />
              </StyledClientCard>
            ))}
          </StyledClientGrid>
        )}
      </div>
    </StyledContainer>
  );
};
