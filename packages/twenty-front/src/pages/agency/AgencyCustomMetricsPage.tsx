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
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
`;

const StyledMetricItem = styled.div`
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

const StyledBadge = styled.span<{ variant?: 'purple' | 'green' | 'gray' }>`
  font-size: 11px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 12px;
  background: ${(props) =>
    props.variant === 'purple'
      ? 'rgba(156, 39, 176, 0.15)'
      : props.variant === 'green'
      ? 'rgba(76, 175, 80, 0.15)'
      : '#2a2a2a'};
  color: ${(props) =>
    props.variant === 'purple'
      ? '#ab47bc'
      : props.variant === 'green'
      ? '#66bb6a'
      : '#aaaaaa'};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const GET_METRIC_DEFINITIONS = gql`
  query GetDiexMetricDefinitions {
    diexMetricDefinitions {
      id
      name
      code
      unitType
      currencyCode
      targetComparison
      description
      isVisibleToClient
    }
  }
`;

const CREATE_METRIC_DEFINITION = gql`
  mutation CreateDiexMetricDefinition($input: CreateMetricDefinitionInput!) {
    createDiexMetricDefinition(input: $input) {
      id
      name
      code
      unitType
    }
  }
`;

export const AgencyCustomMetricsPage = () => {
  const { data, loading, refetch } = useQuery<{ diexMetricDefinitions: any[] }>(GET_METRIC_DEFINITIONS);
  const [createMetricDef] = useMutation(CREATE_METRIC_DEFINITION);

  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [unitType, setUnitType] = useState('NUMBER');
  const [currencyCode, setCurrencyCode] = useState('BRL');
  const [description, setDescription] = useState('');
  const [isVisibleToClient, setIsVisibleToClient] = useState(true);

  const definitions = data?.diexMetricDefinitions ?? [];

  const handleCreate = async () => {
    if (!name || !code) return;
    try {
      await createMetricDef({
        variables: {
          input: {
            name,
            code: code.toLowerCase(),
            unitType,
            currencyCode,
            description,
            isVisibleToClient,
          },
        },
      });
      setName('');
      setCode('');
      setDescription('');
      setIsCreating(false);
      refetch();
    } catch (err: any) {
      alert(err?.message || 'Erro ao criar métrica');
    }
  };

  if (loading) return <StyledContainer>Carregando Métricas Modeláveis...</StyledContainer>;

  return (
    <StyledContainer>
      <StyledHeader>
        <StyledTitleGroup>
          <StyledTitle>Métricas Modeláveis ("CRM Camaleão")</StyledTitle>
          <StyledSubtitle>
            Crie, personalize e molde qualquer indicador de resultado para a agência ou para exibição transparente em clientes
          </StyledSubtitle>
        </StyledTitleGroup>
        <Button
          title={isCreating ? 'Cancelar' : 'Nova Métrica Modelável'}
          onClick={() => setIsCreating(!isCreating)}
        />
      </StyledHeader>

      {isCreating && (
        <StyledFormCard>
          <h3 style={{ margin: 0 }}>Modelar Nova Métrica de Desempenho</h3>
          <TextInput
            placeholder="Nome da Métrica (ex: Custo Por Agendamento, ROI, LTV, Seguidores)"
            value={name}
            onChange={(val: string) => {
              setName(val);
              setCode(val.toLowerCase().replace(/[^a-z0-9]/g, '_'));
            }}
          />
          <TextInput
            placeholder="Identificador / Código de Integração (ex: cpa_agendamento)"
            value={code}
            onChange={setCode}
          />
          <TextInput
            placeholder="Descrição funcional ou objetivo da métrica (opcional)"
            value={description}
            onChange={setDescription}
          />
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <label style={{ fontSize: '14px', fontWeight: 500 }}>Formato da Unidade:</label>
            <select
              value={unitType}
              onChange={(e) => setUnitType(e.target.value)}
              style={{
                padding: '10px 14px',
                borderRadius: '6px',
                background: '#1a1a1a',
                border: '1px solid #333',
                color: '#fff',
                fontSize: '14px',
              }}
            >
              <option value="NUMBER">Número Puro (ex: 150)</option>
              <option value="CURRENCY">Monetário / Moeda (ex: R$ 45.00)</option>
              <option value="PERCENTAGE">Porcentagem (ex: 12.5%)</option>
              <option value="RATIO">Razão / Multiplicador (ex: 3.2x)</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '4px' }}>
            <input
              type="checkbox"
              id="visibleToClient"
              checked={isVisibleToClient}
              onChange={(e) => setIsVisibleToClient(e.target.checked)}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <label htmlFor="visibleToClient" style={{ fontSize: '14px', cursor: 'pointer' }}>
              Exibir esta métrica no Portal de Transparência do Cliente Final
            </label>
          </div>
          <Button title="Salvar e Publicar Métrica" onClick={handleCreate} />
        </StyledFormCard>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h3 style={{ margin: 0 }}>Métricas Modeladas ({definitions.length})</h3>
        {definitions.length === 0 ? (
          <p style={{ color: '#888' }}>Nenhuma métrica personalizada criada ainda.</p>
        ) : (
          definitions.map((def: any) => (
            <StyledMetricItem key={def.id}>
              <div>
                <strong style={{ fontSize: '16px' }}>{def.name}</strong>{' '}
                <span style={{ color: '#777', fontSize: '12px' }}>({def.code})</span>
                <div style={{ fontSize: '13px', color: '#aaa', marginTop: '4px' }}>
                  {def.description || 'Sem descrição cadastrada'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <StyledBadge variant="purple">{def.unitType}</StyledBadge>
                <StyledBadge variant={def.isVisibleToClient ? 'green' : 'gray'}>
                  {def.isVisibleToClient ? 'Visível ao Cliente' : 'Uso Interno'}
                </StyledBadge>
              </div>
            </StyledMetricItem>
          ))
        )}
      </div>
    </StyledContainer>
  );
};
