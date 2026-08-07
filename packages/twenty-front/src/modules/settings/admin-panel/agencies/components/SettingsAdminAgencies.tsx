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
  width: 100%;
`;

const StyledMetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: ${themeCssVariables.spacing[3]};
`;

const StyledMetricCard = styled.div`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  padding: ${themeCssVariables.spacing[3]};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledMetricValue = styled.span`
  font-size: 24px;
  font-weight: 700;
  color: ${themeCssVariables.font.color.primary};
`;

const StyledMetricLabel = styled.span`
  font-size: 12px;
  color: ${themeCssVariables.font.color.tertiary};
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

const GET_DIEX_AGENCIES_DATA = gql`
  query GetDiexAgenciesData {
    diexAgencyMetrics {
      totalAgencies
      activeAgencies
      totalSlotsAllocated
      totalSlotsUsed
      totalManagedWorkspaces
    }
    diexAgencies {
      id
      name
      slug
      ownerUserId
      workspaceSlotsLimit
      status
      createdAt
    }
  }
`;

const CREATE_DIEX_AGENCY = gql`
  mutation CreateDiexAgency($input: CreateAgencyInput!) {
    createDiexAgency(input: $input) {
      id
      name
      slug
    }
  }
`;

const UPDATE_DIEX_AGENCY_SLOTS = gql`
  mutation UpdateDiexAgencySlots($input: UpdateAgencySlotsInput!) {
    updateDiexAgencySlots(input: $input) {
      id
      workspaceSlotsLimit
    }
  }
`;

export const SettingsAdminAgencies = () => {
  const { data, loading, refetch } = useQuery<{ diexAgencies: any[]; diexAgencyMetrics: any }>(GET_DIEX_AGENCIES_DATA);
  const [createAgency] = useMutation(CREATE_DIEX_AGENCY);
  const [updateSlots] = useMutation(UPDATE_DIEX_AGENCY_SLOTS);

  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [slotsLimit, setSlotsLimit] = useState('5');
  const [editingSlotsId, setEditingSlotsId] = useState<string | null>(null);
  const [newSlotLimit, setNewSlotLimit] = useState('');

  const metrics = data?.diexAgencyMetrics;
  const agencies = data?.diexAgencies ?? [];

  const handleCreate = async () => {
    if (!name || !slug || !ownerEmail) return;
    try {
      await createAgency({
        variables: {
          input: {
            name,
            slug,
            ownerUserEmail: ownerEmail,
            workspaceSlotsLimit: parseInt(slotsLimit, 10) || 5,
          },
        },
      });
      setName('');
      setSlug('');
      setOwnerEmail('');
      setIsCreating(false);
      refetch();
    } catch (err: any) {
      alert(err?.message || 'Erro ao cadastrar agência');
    }
  };

  const handleUpdateSlots = async (agencyId: string) => {
    const parsed = parseInt(newSlotLimit, 10);
    if (isNaN(parsed) || parsed < 0) return;
    try {
      await updateSlots({
        variables: {
          input: {
            agencyId,
            workspaceSlotsLimit: parsed,
          },
        },
      });
      setEditingSlotsId(null);
      refetch();
    } catch (err: any) {
      alert(err?.message || 'Erro ao atualizar slots');
    }
  };

  if (loading) return <div>Carregando agências...</div>;

  return (
    <StyledContainer>
      <StyledMetricsGrid>
        <StyledMetricCard>
          <StyledMetricValue>{metrics?.totalAgencies ?? 0}</StyledMetricValue>
          <StyledMetricLabel>Total de Agências</StyledMetricLabel>
        </StyledMetricCard>
        <StyledMetricCard>
          <StyledMetricValue>{metrics?.activeAgencies ?? 0}</StyledMetricValue>
          <StyledMetricLabel>Agências Ativas</StyledMetricLabel>
        </StyledMetricCard>
        <StyledMetricCard>
          <StyledMetricValue>{metrics?.totalSlotsAllocated ?? 0}</StyledMetricValue>
          <StyledMetricLabel>Slots Alocados</StyledMetricLabel>
        </StyledMetricCard>
        <StyledMetricCard>
          <StyledMetricValue>{metrics?.totalSlotsUsed ?? 0}</StyledMetricValue>
          <StyledMetricLabel>Slots Utilizados</StyledMetricLabel>
        </StyledMetricCard>
      </StyledMetricsGrid>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Agências de Marketing Parceiras</h3>
        <Button
          title={isCreating ? 'Cancelar' : 'Nova Agência Parceira'}
          onClick={() => setIsCreating(!isCreating)}
        />
      </div>

      {isCreating && (
        <StyledFormCard>
          <h4>Cadastrar Nova Agência</h4>
          <TextInput
            placeholder="Nome da Agência (ex: Agência Growth)"
            value={name}
            onChange={(val) => {
              setName(val);
              setSlug(val.toLowerCase().replace(/[^a-z0-9]/g, '-'));
            }}
          />
          <TextInput
            placeholder="Identificador Único / Slug (ex: agencia-growth)"
            value={slug}
            onChange={setSlug}
          />
          <TextInput
            placeholder="E-mail do Gestor da Agência (deve estar cadastrado no sistema)"
            value={ownerEmail}
            onChange={setOwnerEmail}
          />
          <TextInput
            placeholder="Limite de Slots de Workspaces (ex: 5)"
            value={slotsLimit}
            onChange={setSlotsLimit}
          />
          <Button title="Salvar Agência" onClick={handleCreate} />
        </StyledFormCard>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {agencies.length === 0 ? (
          <p style={{ color: '#888' }}>Nenhuma agência parceira cadastrada ainda.</p>
        ) : (
          agencies.map((agency: any) => (
            <StyledMetricCard key={agency.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>{agency.name}</strong> <span style={{ color: '#888', fontSize: '12px' }}>({agency.slug})</span>
                <div style={{ fontSize: '12px', color: '#aaa', marginTop: '4px' }}>
                  Gestor User ID: {agency.ownerUserId}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {editingSlotsId === agency.id ? (
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <TextInput
                      value={newSlotLimit}
                      onChange={setNewSlotLimit}
                      style={{ width: '60px' }}
                    />
                    <Button title="Confirmar" onClick={() => handleUpdateSlots(agency.id)} />
                    <Button title="X" onClick={() => setEditingSlotsId(null)} />
                  </div>
                ) : (
                  <div>
                    <span>Slots: <strong>{agency.workspaceSlotsLimit}</strong></span>
                    <Button
                      title="Editar Slots"
                      onClick={() => {
                        setEditingSlotsId(agency.id);
                        setNewSlotLimit(String(agency.workspaceSlotsLimit));
                      }}
                    />
                  </div>
                )}
              </div>
            </StyledMetricCard>
          ))
        )}
      </div>
    </StyledContainer>
  );
};
