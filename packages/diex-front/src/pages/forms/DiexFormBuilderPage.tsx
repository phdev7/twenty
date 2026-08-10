import { useState } from 'react';
import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import { styled } from '@linaria/react';
import { Button } from 'diex-ui/input';
import { TextInput } from '@/ui/input/components/TextInput';
import { themeCssVariables } from 'diex-ui/theme-constants';
import { DiexFormIntegrationDocModal } from '@/forms/components/DiexFormIntegrationDocModal';

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
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  padding: ${themeCssVariables.spacing[5]};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
`;

const StyledFieldRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #181818;
  padding: 8px 14px;
  border-radius: 6px;
  border: 1px solid #2a2a2a;
`;

const GET_DIEX_FORMS = gql`
  query GetDiexForms {
    diexForms {
      id
      title
      slug
      targetObject
      status
      createdAt
      fields {
        id
        label
        name
        type
        isRequired
      }
    }
  }
`;

const CREATE_DIEX_FORM = gql`
  mutation CreateDiexForm($title: String!, $targetObject: FormTargetObject!) {
    createDiexForm(title: $title, targetObject: $targetObject) {
      id
      title
      slug
    }
  }
`;

const ADD_DIEX_FORM_FIELD = gql`
  mutation AddDiexFormField($formId: String!, $label: String!, $type: FormFieldType!, $isRequired: Boolean) {
    addDiexFormField(formId: $formId, label: $label, type: $type, isRequired: $isRequired) {
      id
      label
      type
    }
  }
`;

export const DiexFormBuilderPage = () => {
  const { data, loading, refetch } = useQuery<{ diexForms: any[] }>(GET_DIEX_FORMS);
  const [createForm] = useMutation(CREATE_DIEX_FORM);
  const [addField] = useMutation(ADD_DIEX_FORM_FIELD);

  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [targetObject, setTargetObject] = useState('PERSON');
  const [selectedFormForDoc, setSelectedFormForDoc] = useState<{ id: string; slug: string } | null>(null);

  const [activeFormIdForField, setActiveFormIdForField] = useState<string | null>(null);
  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldType, setFieldType] = useState('TEXT');

  const forms = data?.diexForms ?? [];

  const handleCreate = async () => {
    if (!title) return;
    try {
      await createForm({
        variables: { title, targetObject },
      });
      setTitle('');
      setIsCreating(false);
      refetch();
    } catch (err: any) {
      alert(err?.message || 'Erro ao criar formulário');
    }
  };

  const handleAddField = async (formId: string) => {
    if (!fieldLabel) return;
    try {
      await addField({
        variables: {
          formId,
          label: fieldLabel,
          type: fieldType,
          isRequired: false,
        },
      });
      setFieldLabel('');
      setActiveFormIdForField(null);
      refetch();
    } catch (err: any) {
      alert(err?.message || 'Erro ao adicionar campo');
    }
  };

  if (loading) return <StyledContainer>Carregando Formulários Modeláveis...</StyledContainer>;

  return (
    <StyledContainer>
      <StyledHeader>
        <StyledTitleGroup>
          <StyledTitle>Formulários & Ingestão Modelável de Leads</StyledTitle>
          <StyledSubtitle>
            Crie formulários internos ou integre sites externos (WordPress, Elementor, Framer, Yayforms, Cal.com) com mapeamento no CRM
          </StyledSubtitle>
        </StyledTitleGroup>
        <Button
          title={isCreating ? 'Cancelar' : 'Novo Formulário Modelável'}
          onClick={() => setIsCreating(!isCreating)}
        />
      </StyledHeader>

      {isCreating && (
        <StyledFormCard>
          <h3 style={{ margin: 0 }}>Criar Novo Formulário de Ingestão</h3>
          <TextInput
            placeholder="Título do Formulário (ex: Qualificação de Vendas - Site)"
            value={title}
            onChange={setTitle}
          />
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <label style={{ fontSize: '14px', fontWeight: 500 }}>Objeto de Destino no CRM:</label>
            <select
              value={targetObject}
              onChange={(e) => setTargetObject(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', background: '#1c1c1c', border: '1px solid #333', color: '#fff' }}
            >
              <option value="PERSON">Pessoa (Contato)</option>
              <option value="COMPANY">Empresa</option>
              <option value="OPPORTUNITY">Oportunidade Comercial</option>
            </select>
          </div>
          <Button title="Salvar e Publicar Formulário" onClick={handleCreate} />
        </StyledFormCard>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ margin: 0 }}>Formulários Ativos ({forms.length})</h3>
        {forms.length === 0 ? (
          <p style={{ color: '#888' }}>Nenhum formulário criado ainda.</p>
        ) : (
          forms.map((form: any) => (
            <StyledFormCard key={form.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: '18px' }}>{form.title}</strong>{' '}
                  <span style={{ color: '#888', fontSize: '13px' }}>({form.slug})</span>
                  <div style={{ fontSize: '13px', color: '#aaa', marginTop: '4px' }}>
                    Destino no CRM: <strong>{form.targetObject}</strong> | Status: <strong>{form.status}</strong>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button
                    title="Adicionar Campo"
                    onClick={() => setActiveFormIdForField(activeFormIdForField === form.id ? null : form.id)}
                  />
                  <Button
                    title="Documentação & Webhooks"
                    onClick={() => setSelectedFormForDoc({ id: form.id, slug: form.slug })}
                  />
                </div>
              </div>

              {activeFormIdForField === form.id && (
                <div style={{ background: '#141414', padding: '12px', borderRadius: '6px', display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px' }}>
                  <TextInput
                    placeholder="Nome do Campo (ex: Orçamento Estimado, Cargo)"
                    value={fieldLabel}
                    onChange={setFieldLabel}
                  />
                  <select
                    value={fieldType}
                    onChange={(e) => setFieldType(e.target.value)}
                    style={{ padding: '8px', borderRadius: '4px', background: '#222', color: '#fff' }}
                  >
                    <option value="TEXT">Texto</option>
                    <option value="EMAIL">E-mail</option>
                    <option value="PHONE">Telefone</option>
                    <option value="NUMBER">Número</option>
                  </select>
                  <Button title="Salvar Campo" onClick={() => handleAddField(form.id)} />
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '12px' }}>
                <span style={{ fontSize: '12px', color: '#888', fontWeight: 600 }}>CAMPOS DO FORMULÁRIO ({form.fields?.length ?? 0}):</span>
                {form.fields?.map((f: any) => (
                  <StyledFieldRow key={f.id}>
                    <span><strong>{f.label}</strong> <span style={{ color: '#777', fontSize: '12px' }}>({f.name})</span></span>
                    <span style={{ fontSize: '11px', background: '#333', padding: '2px 8px', borderRadius: '4px' }}>{f.type}</span>
                  </StyledFieldRow>
                ))}
              </div>
            </StyledFormCard>
          ))
        )}
      </div>

      {selectedFormForDoc && (
        <DiexFormIntegrationDocModal
          formId={selectedFormForDoc.id}
          formSlug={selectedFormForDoc.slug}
          onClose={() => setSelectedFormForDoc(null)}
        />
      )}
    </StyledContainer>
  );
};
