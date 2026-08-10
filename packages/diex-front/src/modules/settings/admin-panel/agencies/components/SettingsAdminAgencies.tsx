import { useState } from 'react';
import { styled } from '@linaria/react';
import { Button } from 'diex-ui/input';
import { themeCssVariables } from 'diex-ui/theme-constants';
import { isNonEmptyString } from '@sniptt/guards';

import {
  type AdminAgency,
  useAdminAgencies,
} from '@/settings/admin-panel/agencies/hooks/useAdminAgencies';
import { TextInput } from '@/ui/input/components/TextInput';
import { DiexAgencyStatus } from '~/generated-metadata/graphql';

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  width: 100%;
`;

const StyledMetricsGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
`;

const StyledCard = styled.div`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledMetricValue = styled.span`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.lg};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledMetricLabel = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
`;

const StyledSectionHeader = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
`;

const StyledSectionTitle = styled.h3`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  margin: 0;
`;

const StyledFormCard = styled(StyledCard)`
  gap: ${themeCssVariables.spacing[3]};
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledAgencyRow = styled(StyledCard)`
  align-items: center;
  flex-direction: row;
  justify-content: space-between;
`;

const StyledAgencyMeta = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
`;

const StyledActions = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledEmptyState = styled.p`
  color: ${themeCssVariables.font.color.tertiary};
  margin: 0;
`;

const toSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '-');

export const SettingsAdminAgencies = () => {
  const {
    agencies,
    metrics,
    loading,
    createAgency,
    updateSlots,
    updateStatus,
  } = useAdminAgencies();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [ownerUserEmail, setOwnerUserEmail] = useState('');
  const [slotsLimit, setSlotsLimit] = useState('5');
  const [editingSlotsAgencyId, setEditingSlotsAgencyId] = useState<
    string | null
  >(null);
  const [newSlotLimit, setNewSlotLimit] = useState('');

  const handleCreate = async () => {
    if (
      !isNonEmptyString(name) ||
      !isNonEmptyString(slug) ||
      !isNonEmptyString(ownerUserEmail)
    ) {
      return;
    }

    const wasCreated = await createAgency({
      name,
      slug,
      ownerUserEmail,
      workspaceSlotsLimit: Number.parseInt(slotsLimit, 10) || 5,
    });

    if (!wasCreated) {
      return;
    }

    setName('');
    setSlug('');
    setOwnerUserEmail('');
    setSlotsLimit('5');
    setIsFormOpen(false);
  };

  const handleUpdateSlots = async (agencyId: string) => {
    const parsedLimit = Number.parseInt(newSlotLimit, 10);

    if (Number.isNaN(parsedLimit) || parsedLimit < 0) {
      return;
    }

    const wasUpdated = await updateSlots(agencyId, parsedLimit);

    if (wasUpdated) {
      setEditingSlotsAgencyId(null);
    }
  };

  const handleToggleStatus = async (agency: AdminAgency) => {
    await updateStatus(
      agency.id,
      agency.status === DiexAgencyStatus.ACTIVE
        ? DiexAgencyStatus.SUSPENDED
        : DiexAgencyStatus.ACTIVE,
    );
  };

  if (loading) {
    return <StyledContainer>Carregando agências...</StyledContainer>;
  }

  return (
    <StyledContainer>
      <StyledMetricsGrid>
        <StyledCard>
          <StyledMetricValue>{metrics?.totalAgencies ?? 0}</StyledMetricValue>
          <StyledMetricLabel>Total de agências</StyledMetricLabel>
        </StyledCard>
        <StyledCard>
          <StyledMetricValue>{metrics?.activeAgencies ?? 0}</StyledMetricValue>
          <StyledMetricLabel>Agências ativas</StyledMetricLabel>
        </StyledCard>
        <StyledCard>
          <StyledMetricValue>
            {metrics?.totalSlotsAllocated ?? 0}
          </StyledMetricValue>
          <StyledMetricLabel>Slots alocados</StyledMetricLabel>
        </StyledCard>
        <StyledCard>
          <StyledMetricValue>{metrics?.totalSlotsUsed ?? 0}</StyledMetricValue>
          <StyledMetricLabel>Slots utilizados</StyledMetricLabel>
        </StyledCard>
      </StyledMetricsGrid>

      <StyledSectionHeader>
        <StyledSectionTitle>Agências parceiras</StyledSectionTitle>
        <Button
          title={isFormOpen ? 'Cancelar' : 'Nova agência'}
          onClick={() => setIsFormOpen(!isFormOpen)}
        />
      </StyledSectionHeader>

      {isFormOpen && (
        <StyledFormCard>
          <TextInput
            label="Nome da agência"
            placeholder="Agência Growth"
            value={name}
            onChange={(value) => {
              setName(value);
              setSlug(toSlug(value));
            }}
          />
          <TextInput
            label="Identificador"
            placeholder="agencia-growth"
            value={slug}
            onChange={setSlug}
          />
          <TextInput
            label="E-mail do gestor"
            placeholder="gestor@agencia.com.br"
            value={ownerUserEmail}
            onChange={setOwnerUserEmail}
          />
          <TextInput
            label="Limite de slots"
            placeholder="5"
            value={slotsLimit}
            onChange={setSlotsLimit}
          />
          <Button title="Salvar agência" onClick={() => void handleCreate()} />
        </StyledFormCard>
      )}

      {agencies.length === 0 ? (
        <StyledEmptyState>
          Nenhuma agência parceira cadastrada ainda.
        </StyledEmptyState>
      ) : (
        agencies.map((agency) => (
          <StyledAgencyRow key={agency.id}>
            <div>
              <strong>{agency.name}</strong>
              <div>
                <StyledAgencyMeta>
                  {agency.slug} · gestor {agency.ownerUserId} · {agency.status}
                </StyledAgencyMeta>
              </div>
            </div>

            <StyledActions>
              {editingSlotsAgencyId === agency.id ? (
                <>
                  <TextInput value={newSlotLimit} onChange={setNewSlotLimit} />
                  <Button
                    title="Confirmar"
                    onClick={() => void handleUpdateSlots(agency.id)}
                  />
                  <Button
                    title="Cancelar"
                    onClick={() => setEditingSlotsAgencyId(null)}
                  />
                </>
              ) : (
                <>
                  <StyledAgencyMeta>
                    Slots: {agency.workspaceSlotsLimit}
                  </StyledAgencyMeta>
                  <Button
                    title="Editar slots"
                    onClick={() => {
                      setEditingSlotsAgencyId(agency.id);
                      setNewSlotLimit(String(agency.workspaceSlotsLimit));
                    }}
                  />
                  <Button
                    title={
                      agency.status === DiexAgencyStatus.ACTIVE
                        ? 'Suspender'
                        : 'Reativar'
                    }
                    accent={
                      agency.status === DiexAgencyStatus.ACTIVE
                        ? 'danger'
                        : 'default'
                    }
                    onClick={() => void handleToggleStatus(agency)}
                  />
                </>
              )}
            </StyledActions>
          </StyledAgencyRow>
        ))
      )}
    </StyledContainer>
  );
};
