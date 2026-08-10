import { useState } from 'react';
import { styled } from '@linaria/react';
import { Button } from 'diex-ui/input';
import { themeCssVariables } from 'diex-ui/theme-constants';
import { isNonEmptyString } from '@sniptt/guards';

import { useAgencyPortal } from '@/agency/hooks/useAgencyPortal';
import { type AgencyClientWorkspace } from '@/agency/types/AgencyTypes';
import { TextInput } from '@/ui/input/components/TextInput';
import { getWorkspaceUrl } from '~/utils/getWorkspaceUrl';
import { WorkspaceActivationStatus } from '~/generated-metadata/graphql';

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  padding: ${themeCssVariables.spacing[6]};
  width: 100%;
`;

const StyledSlotsCard = styled.div`
  align-items: center;
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  justify-content: space-between;
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledSlotsLabel = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledSlotsValue = styled.div`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.lg};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledSlotsAvailability = styled.span<{ hasAvailableSlots: boolean }>`
  color: ${({ hasAvailableSlots }) =>
    hasAvailableSlots
      ? themeCssVariables.tag.text.green
      : themeCssVariables.tag.text.red};
  font-weight: ${themeCssVariables.font.weight.medium};
`;

const StyledFormCard = styled.div`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  padding: ${themeCssVariables.spacing[4]};
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

const StyledClientGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[4]};
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
`;

const StyledClientCard = styled.div`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  justify-content: space-between;
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledClientName = styled.strong`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledClientUrl = styled.a`
  color: ${themeCssVariables.font.color.light};
  font-size: ${themeCssVariables.font.size.sm};
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const StyledEmptyState = styled.p`
  color: ${themeCssVariables.font.color.tertiary};
  margin: 0;
`;

const StyledPendingNotice = styled.span`
  color: ${themeCssVariables.tag.text.orange};
  font-size: ${themeCssVariables.font.size.xs};
`;

const ACTIVE_ACTIVATION_STATUSES: string[] = [
  WorkspaceActivationStatus.ACTIVE,
  WorkspaceActivationStatus.CREATED,
];

const toSubdomainCandidate = (companyName: string) =>
  companyName.toLowerCase().replace(/[^a-z0-9]/g, '');

export const AgencyPartnerPortal = () => {
  const {
    agency,
    clientWorkspaces,
    usedSlots,
    slotsLimit,
    hasAvailableSlots,
    loading,
    errorMessage,
    isCreatingClientWorkspace,
    createClientWorkspace,
  } = useAgencyPortal();

  const [isCreating, setIsCreating] = useState(false);
  const [clientCompanyName, setClientCompanyName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [clientAdminEmail, setClientAdminEmail] = useState('');
  const [operationDescription, setOperationDescription] = useState('');

  const canSubmit =
    isNonEmptyString(clientCompanyName) &&
    isNonEmptyString(subdomain) &&
    isNonEmptyString(clientAdminEmail) &&
    !isCreatingClientWorkspace;

  const handleCreateClientWorkspace = async () => {
    if (!canSubmit) {
      return;
    }

    const wasCreated = await createClientWorkspace({
      clientCompanyName,
      subdomain,
      clientAdminEmail,
      operationDescription,
    });

    if (!wasCreated) {
      return;
    }

    setClientCompanyName('');
    setSubdomain('');
    setClientAdminEmail('');
    setOperationDescription('');
    setIsCreating(false);
  };

  const openClientWorkspace = (clientWorkspace: AgencyClientWorkspace) => {
    window.open(getWorkspaceUrl(clientWorkspace.workspaceUrls), '_blank');
  };

  if (loading) {
    return <StyledContainer>Carregando portal do parceiro...</StyledContainer>;
  }

  if (isNonEmptyString(errorMessage)) {
    return (
      <StyledContainer>
        <StyledEmptyState>
          Não foi possível carregar o portal: {errorMessage}
        </StyledEmptyState>
      </StyledContainer>
    );
  }

  if (agency === null) {
    return (
      <StyledContainer>
        <StyledEmptyState>
          Sua conta ainda não está associada a nenhuma agência cadastrada. Peça
          à equipe Diex para vincular seu usuário a uma agência parceira.
        </StyledEmptyState>
      </StyledContainer>
    );
  }

  return (
    <StyledContainer>
      <StyledSlotsCard>
        <div>
          <StyledSlotsLabel>
            Consumo de licenças (slots de workspaces)
          </StyledSlotsLabel>
          <StyledSlotsValue>
            {usedSlots} / {slotsLimit} slots utilizados
          </StyledSlotsValue>
        </div>
        <StyledSlotsAvailability hasAvailableSlots={hasAvailableSlots}>
          {hasAvailableSlots
            ? `${slotsLimit - usedSlots} slots disponíveis`
            : 'Limite atingido. Fale com a Diex para adquirir mais slots.'}
        </StyledSlotsAvailability>
      </StyledSlotsCard>

      <StyledSectionHeader>
        <StyledSectionTitle>
          Workspaces dos seus clientes ({clientWorkspaces.length})
        </StyledSectionTitle>
        <Button
          title={isCreating ? 'Cancelar' : 'Novo cliente'}
          disabled={!hasAvailableSlots && !isCreating}
          onClick={() => setIsCreating(!isCreating)}
        />
      </StyledSectionHeader>

      {isCreating && (
        <StyledFormCard>
          <TextInput
            label="Nome da empresa"
            placeholder="Clínica Odonto Riso"
            value={clientCompanyName}
            onChange={(value) => {
              setClientCompanyName(value);
              setSubdomain(toSubdomainCandidate(value));
            }}
          />
          <TextInput
            label="Subdomínio do CRM"
            placeholder="odontoriso"
            value={subdomain}
            onChange={setSubdomain}
          />
          <TextInput
            label="E-mail do administrador do cliente"
            placeholder="contato@cliente.com.br"
            value={clientAdminEmail}
            onChange={setClientAdminEmail}
          />
          <TextInput
            label="Descrição da operação do cliente"
            placeholder="O que a empresa faz, como vende e qual o gargalo atual"
            value={operationDescription}
            onChange={setOperationDescription}
          />
          <Button
            title={
              isCreatingClientWorkspace
                ? 'Criando workspace...'
                : 'Criar workspace do cliente'
            }
            disabled={!canSubmit}
            onClick={() => void handleCreateClientWorkspace()}
          />
        </StyledFormCard>
      )}

      {clientWorkspaces.length === 0 ? (
        <StyledEmptyState>
          Nenhum workspace de cliente cadastrado nesta agência ainda.
        </StyledEmptyState>
      ) : (
        <StyledClientGrid>
          {clientWorkspaces.map((clientWorkspace) => {
            const workspaceUrl = getWorkspaceUrl(clientWorkspace.workspaceUrls);
            // A workspace whose activation failed still exists and still spends
            // a slot. Saying so is the only way the agency can tell it apart
            // from a healthy one and ask for it to be finished.
            const isUsable = ACTIVE_ACTIVATION_STATUSES.includes(
              clientWorkspace.activationStatus,
            );

            return (
              <StyledClientCard key={clientWorkspace.id}>
                <div>
                  <StyledClientName>
                    {clientWorkspace.displayName ?? clientWorkspace.subdomain}
                  </StyledClientName>
                  <div>
                    <StyledClientUrl
                      href={workspaceUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {workspaceUrl}
                    </StyledClientUrl>
                  </div>
                  {!isUsable && (
                    <StyledPendingNotice>
                      Ativação incompleta ({clientWorkspace.activationStatus}).
                      O slot está ocupado. Acione a equipe Diex para concluir.
                    </StyledPendingNotice>
                  )}
                </div>

                <Button
                  title="Abrir CRM do cliente"
                  disabled={!isUsable}
                  onClick={() => openClientWorkspace(clientWorkspace)}
                />
              </StyledClientCard>
            );
          })}
        </StyledClientGrid>
      )}
    </StyledContainer>
  );
};
