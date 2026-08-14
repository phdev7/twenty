import { useEffect, useMemo, useState } from 'react';
import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import { styled } from '@linaria/react';
import { themeCssVariables } from 'diex-ui/theme-constants';

type FormStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
type FormTargetObject = 'PERSON' | 'COMPANY' | 'OPPORTUNITY';
type FormLayout = 'STEP_BY_STEP' | 'SINGLE_PAGE';

type FormQuestion = {
  id: string;
  label: string;
  name: string;
  type: string;
  targetFieldName: string | null;
  placeholder: string | null;
  helpText: string | null;
  options: Array<{ label: string; value: string }>;
  validation: Record<string, unknown>;
  isRequired: boolean;
  position: number;
};

type DiexForm = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  targetObject: FormTargetObject;
  status: FormStatus;
  layout: FormLayout;
  submitButtonLabel: string;
  successTitle: string;
  successMessage: string;
  showLogo: boolean;
  logoUrl: string | null;
  accentColor: string;
  privacyPolicyUrl: string | null;
  consentText: string | null;
  consentRequired: boolean;
  createOpportunity: boolean;
  opportunityStage: string;
  ownerId: string | null;
  draftVersion: number;
  publishedVersion: number;
  publishedAt: string | null;
  publicUrl: string | null;
  createdAt: string;
  updatedAt: string;
  fields: FormQuestion[];
};

type Submission = {
  id: string;
  status: 'RECEIVED' | 'PROCESSED' | 'FAILED';
  submittedData: Record<string, unknown>;
  source: string;
  mappedRecordId: string | null;
  personId: string | null;
  companyId: string | null;
  opportunityId: string | null;
  processingError: string | null;
  createdAt: string;
};

type EditorTab = 'CONTENT' | 'APPEARANCE' | 'CONVERSION' | 'RESPONSES';

type FormDraft = {
  title: string;
  slug: string;
  description: string;
  targetObject: FormTargetObject;
  layout: FormLayout;
  submitButtonLabel: string;
  successTitle: string;
  successMessage: string;
  showLogo: boolean;
  logoUrl: string;
  accentColor: string;
  privacyPolicyUrl: string;
  consentText: string;
  consentRequired: boolean;
  createOpportunity: boolean;
  opportunityStage: string;
  ownerId: string;
};

type WorkspaceMember = {
  id: string;
  name: {
    firstName: string;
    lastName: string;
  };
};

type QuestionDraft = {
  label: string;
  type: string;
  targetFieldName: string;
  placeholder: string;
  helpText: string;
  optionsText: string;
  isRequired: boolean;
};

const GET_DIEX_FORMS = gql`
  query GetDiexForms {
    diexForms {
      id
      title
      slug
      description
      targetObject
      status
      layout
      submitButtonLabel
      successTitle
      successMessage
      showLogo
      logoUrl
      accentColor
      privacyPolicyUrl
      consentText
      consentRequired
      createOpportunity
      opportunityStage
      ownerId
      draftVersion
      publishedVersion
      publishedAt
      publicUrl
      createdAt
      updatedAt
      fields {
        id
        label
        name
        type
        targetFieldName
        placeholder
        helpText
        options
        validation
        isRequired
        position
      }
    }
  }
`;

const GET_FORM_WORKSPACE_MEMBERS = gql`
  query GetDiexFormWorkspaceMembers {
    workspaceMembers(first: 200) {
      edges {
        node {
          id
          name {
            firstName
            lastName
          }
        }
      }
    }
  }
`;

const GET_FORM_SUBMISSIONS = gql`
  query GetDiexFormSubmissions($formId: String!) {
    diexFormSubmissions(formId: $formId) {
      id
      status
      submittedData
      source
      mappedRecordId
      personId
      companyId
      opportunityId
      processingError
      createdAt
    }
  }
`;

const CREATE_FORM = gql`
  mutation CreateDiexForm(
    $title: String!
    $targetObject: FormTargetObject!
    $template: FormTemplate!
  ) {
    createDiexForm(
      title: $title
      targetObject: $targetObject
      template: $template
    ) {
      id
    }
  }
`;

const UPDATE_FORM = gql`
  mutation UpdateDiexForm($id: String!, $input: JSON!) {
    updateDiexForm(id: $id, input: $input) {
      id
      updatedAt
    }
  }
`;

const PUBLISH_FORM = gql`
  mutation PublishDiexForm($id: String!) {
    publishDiexForm(id: $id) {
      id
      status
    }
  }
`;

const UNPUBLISH_FORM = gql`
  mutation UnpublishDiexForm($id: String!) {
    unpublishDiexForm(id: $id) {
      id
      status
    }
  }
`;

const DELETE_FORM = gql`
  mutation DeleteDiexForm($id: String!, $confirmationTitle: String!) {
    deleteDiexForm(id: $id, confirmationTitle: $confirmationTitle)
  }
`;

const ADD_FIELD = gql`
  mutation AddDiexFormField($formId: String!, $input: JSON!) {
    addDiexFormField(formId: $formId, input: $input) {
      id
    }
  }
`;

const UPDATE_FIELD = gql`
  mutation UpdateDiexFormField($fieldId: String!, $input: JSON!) {
    updateDiexFormField(fieldId: $fieldId, input: $input) {
      id
    }
  }
`;

const DELETE_FIELD = gql`
  mutation DeleteDiexFormField($fieldId: String!) {
    deleteDiexFormField(fieldId: $fieldId)
  }
`;

const Page = styled.div`
  min-height: 100%;
  padding: ${themeCssVariables.spacing[6]};
  background: ${themeCssVariables.background.primary};
  color: ${themeCssVariables.font.color.primary};

  @media (max-width: 720px) {
    padding: ${themeCssVariables.spacing[3]};
  }
`;

const PageHeader = styled.header`
  max-width: 1440px;
  margin: 0 auto ${themeCssVariables.spacing[5]};
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${themeCssVariables.spacing[4]};

  @media (max-width: 720px) {
    flex-direction: column;
  }
`;

const Title = styled.h1`
  margin: 0;
  font-size: 28px;
  line-height: 1.15;
  letter-spacing: -0.025em;
`;

const Subtitle = styled.p`
  max-width: 720px;
  margin: 8px 0 0;
  color: ${themeCssVariables.font.color.tertiary};
  font-size: 14px;
  line-height: 1.55;
`;

const PrimaryButton = styled.button`
  min-height: 38px;
  border: 0;
  border-radius: 8px;
  padding: 0 16px;
  background: ${themeCssVariables.color.blue};
  color: white;
  cursor: pointer;
  font-weight: 650;
  white-space: nowrap;

  &:disabled {
    cursor: wait;
    opacity: 0.6;
  }
`;

const SecondaryButton = styled.button`
  min-height: 36px;
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: 8px;
  padding: 0 13px;
  background: ${themeCssVariables.background.secondary};
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  font-weight: 600;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const DangerButton = styled(SecondaryButton)`
  color: ${themeCssVariables.color.red};
`;

const Workspace = styled.div`
  max-width: 1440px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(260px, 330px) minmax(0, 1fr);
  gap: ${themeCssVariables.spacing[4]};
  align-items: start;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const Panel = styled.section`
  overflow: hidden;
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  background: ${themeCssVariables.background.secondary};
`;

const PanelHeader = styled.div`
  padding: ${themeCssVariables.spacing[4]};
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
`;

const PanelTitle = styled.h2`
  margin: 0;
  font-size: 16px;
`;

const FormList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px;
`;

const FormListButton = styled.button`
  width: 100%;
  border: 1px solid transparent;
  border-radius: 9px;
  padding: 12px;
  background: transparent;
  color: inherit;
  cursor: pointer;
  text-align: left;

  &:hover,
  &[data-selected='true'] {
    border-color: ${themeCssVariables.border.color.light};
    background: ${themeCssVariables.background.tertiary};
  }
`;

const FormName = styled.div`
  overflow: hidden;
  font-size: 14px;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Muted = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: 12px;
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  border-radius: 999px;
  padding: 0 8px;
  background: ${themeCssVariables.background.tertiary};
  color: ${themeCssVariables.font.color.secondary};
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
`;

const CreateCard = styled.div`
  max-width: 1440px;
  margin: 0 auto ${themeCssVariables.spacing[4]};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  padding: ${themeCssVariables.spacing[4]};
  background: ${themeCssVariables.background.secondary};
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${themeCssVariables.spacing[3]};

  @media (max-width: 680px) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: 7px;
  color: ${themeCssVariables.font.color.secondary};
  font-size: 12px;
  font-weight: 650;
`;

const Input = styled.input`
  width: 100%;
  min-height: 40px;
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: 8px;
  outline: none;
  padding: 9px 11px;
  background: ${themeCssVariables.background.primary};
  color: ${themeCssVariables.font.color.primary};

  &:focus {
    border-color: ${themeCssVariables.color.blue};
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  min-height: 92px;
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: 8px;
  outline: none;
  padding: 10px 11px;
  resize: vertical;
  background: ${themeCssVariables.background.primary};
  color: ${themeCssVariables.font.color.primary};

  &:focus {
    border-color: ${themeCssVariables.color.blue};
  }
`;

const Select = styled.select`
  width: 100%;
  min-height: 40px;
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: 8px;
  padding: 8px 10px;
  background: ${themeCssVariables.background.primary};
  color: ${themeCssVariables.font.color.primary};
`;

const EditorHeader = styled.div`
  padding: ${themeCssVariables.spacing[4]};
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${themeCssVariables.spacing[3]};
  border-bottom: 1px solid ${themeCssVariables.border.color.light};

  @media (max-width: 680px) {
    flex-direction: column;
  }
`;

const ButtonRow = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
`;

const Tabs = styled.div`
  display: flex;
  gap: 4px;
  overflow-x: auto;
  padding: 8px ${themeCssVariables.spacing[4]} 0;
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
`;

const TabButton = styled.button`
  border: 0;
  border-bottom: 2px solid transparent;
  padding: 10px 12px;
  background: transparent;
  color: ${themeCssVariables.font.color.tertiary};
  cursor: pointer;
  font-weight: 650;
  white-space: nowrap;

  &[data-active='true'] {
    border-bottom-color: ${themeCssVariables.color.blue};
    color: ${themeCssVariables.font.color.primary};
  }
`;

const EditorBody = styled.div`
  padding: ${themeCssVariables.spacing[4]};
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};

  & + & {
    margin-top: ${themeCssVariables.spacing[6]};
    padding-top: ${themeCssVariables.spacing[5]};
    border-top: 1px solid ${themeCssVariables.border.color.light};
  }
`;

const SectionTitle = styled.h3`
  margin: 0;
  font-size: 15px;
`;

const QuestionCard = styled.div`
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: 10px;
  padding: 12px;
  background: ${themeCssVariables.background.primary};
`;

const Toggle = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  cursor: pointer;
  color: ${themeCssVariables.font.color.secondary};
  font-size: 13px;
  line-height: 1.45;

  input {
    width: 17px;
    height: 17px;
    margin: 1px 0 0;
    accent-color: ${themeCssVariables.color.blue};
  }
`;

const EmptyState = styled.div`
  padding: 48px 22px;
  color: ${themeCssVariables.font.color.tertiary};
  text-align: center;
`;

const ResponseCard = styled.div`
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: 10px;
  padding: 13px;
  background: ${themeCssVariables.background.primary};
`;

const FIELD_TYPE_LABELS: Record<string, string> = {
  TEXT: 'Texto curto',
  EMAIL: 'E-mail',
  PHONE: 'Telefone / WhatsApp',
  TEXTAREA: 'Texto longo',
  SELECT: 'Lista de opções',
  RADIO: 'Escolha única',
  MULTI_SELECT: 'Múltipla escolha',
  CHECKBOX: 'Sim ou não',
  NUMBER: 'Número',
  CURRENCY: 'Valor em dinheiro',
  DATE: 'Data',
  URL: 'Link',
  RATING: 'Avaliação de 1 a 5',
};

const CHOICE_TYPES = new Set(['SELECT', 'RADIO', 'MULTI_SELECT']);

const FORM_STATUS_LABELS: Record<FormStatus, string> = {
  DRAFT: 'Rascunho',
  PUBLISHED: 'Publicado',
  ARCHIVED: 'Arquivado',
};

const SUBMISSION_STATUS_LABELS: Record<Submission['status'], string> = {
  RECEIVED: 'Recebida',
  PROCESSED: 'Processada',
  FAILED: 'Revisar',
};

const emptyQuestionDraft = (): QuestionDraft => ({
  label: '',
  type: 'TEXT',
  targetFieldName: '',
  placeholder: '',
  helpText: '',
  optionsText: '',
  isRequired: false,
});

const toFormDraft = (form: DiexForm): FormDraft => ({
  title: form.title,
  slug: form.slug,
  description: form.description ?? '',
  targetObject: form.targetObject,
  layout: form.layout,
  submitButtonLabel: form.submitButtonLabel,
  successTitle: form.successTitle,
  successMessage: form.successMessage,
  showLogo: form.showLogo,
  logoUrl: form.logoUrl ?? '',
  accentColor: form.accentColor,
  privacyPolicyUrl: form.privacyPolicyUrl ?? '',
  consentText: form.consentText ?? '',
  consentRequired: form.consentRequired,
  createOpportunity: form.createOpportunity,
  opportunityStage: form.opportunityStage,
  ownerId: form.ownerId ?? '',
});

const toQuestionDraft = (field: FormQuestion): QuestionDraft => ({
  label: field.label,
  type: field.type,
  targetFieldName: field.targetFieldName ?? '',
  placeholder: field.placeholder ?? '',
  helpText: field.helpText ?? '',
  optionsText: field.options
    .map(({ label, value }) => `${label} | ${value}`)
    .join('\n'),
  isRequired: field.isRequired,
});

const parseOptions = (value: string) =>
  value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [labelPart, valuePart] = line.split('|');
      const label = labelPart.trim();
      const optionValue = (valuePart ?? label)
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');

      return { label, value: optionValue };
    });

const formatErrorMessage = (error: unknown) => {
  if (!(error instanceof Error)) {
    return 'Não foi possível concluir.';
  }

  const graphqlError = error as Error & {
    graphQLErrors?: Array<{ message?: string }>;
  };

  return graphqlError.graphQLErrors?.[0]?.message ?? error.message;
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));

export const DiexFormBuilderPage = () => {
  // Compatibility restoration: a secondary member selector must never hide
  // forms already created by an existing workspace.
  const { data, loading, error, refetch } = useQuery<{
    diexForms: DiexForm[];
  }>(GET_DIEX_FORMS, { errorPolicy: 'all' });
  const { data: workspaceMembersData, error: workspaceMembersError } =
    useQuery<{
      workspaceMembers: { edges: Array<{ node: WorkspaceMember }> };
    }>(GET_FORM_WORKSPACE_MEMBERS, { errorPolicy: 'all' });
  const [createForm] = useMutation(CREATE_FORM);
  const [updateForm] = useMutation(UPDATE_FORM);
  const [publishForm] = useMutation(PUBLISH_FORM);
  const [unpublishForm] = useMutation(UNPUBLISH_FORM);
  const [deleteForm] = useMutation(DELETE_FORM);
  const [addField] = useMutation(ADD_FIELD);
  const [updateField] = useMutation(UPDATE_FIELD);
  const [deleteField] = useMutation(DELETE_FIELD);
  const forms = data?.diexForms ?? [];
  const isFormsReadUnavailable =
    Boolean(error) && !Array.isArray(data?.diexForms);
  const workspaceMembers =
    workspaceMembersData?.workspaceMembers?.edges?.map(({ node }) => node) ??
    [];
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [tab, setTab] = useState<EditorTab>('CONTENT');
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTemplate, setNewTemplate] = useState('COMMERCIAL_QUALIFICATION');
  const [newTarget, setNewTarget] = useState<FormTargetObject>('OPPORTUNITY');
  const selectedForm =
    forms.find(({ id }) => id === selectedFormId) ?? forms[0] ?? null;
  const [formDraft, setFormDraft] = useState<FormDraft | null>(null);
  const [questionDraft, setQuestionDraft] =
    useState<QuestionDraft>(emptyQuestionDraft);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(
    null,
  );
  const { data: submissionsData, loading: submissionsLoading } = useQuery<{
    diexFormSubmissions: Submission[];
  }>(GET_FORM_SUBMISSIONS, {
    variables: { formId: selectedForm?.id ?? '' },
    skip: !selectedForm || tab !== 'RESPONSES',
    fetchPolicy: 'network-only',
  });

  useEffect(() => {
    if (
      forms[0] &&
      (!selectedFormId || !forms.some(({ id }) => id === selectedFormId))
    ) {
      setSelectedFormId(forms[0].id);
    }
  }, [forms, selectedFormId]);

  useEffect(() => {
    setFormDraft(selectedForm ? toFormDraft(selectedForm) : null);
    setEditingQuestionId(null);
    setQuestionDraft(emptyQuestionDraft());
  }, [selectedForm?.id, selectedForm?.updatedAt]);

  const hasUnpublishedChanges =
    selectedForm && selectedForm.draftVersion > selectedForm.publishedVersion;
  const sortedFields = useMemo(
    () =>
      [...(selectedForm?.fields ?? [])].sort(
        (left, right) => left.position - right.position,
      ),
    [selectedForm?.fields],
  );

  const runAction = async (action: () => Promise<unknown>) => {
    setIsSaving(true);
    try {
      await action();
      await refetch();
    } catch (error) {
      window.alert(formatErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreate = () =>
    runAction(async () => {
      if (!newTitle.trim()) {
        throw new Error('Informe o nome do formulário.');
      }
      const result = await createForm({
        variables: {
          title: newTitle,
          targetObject: newTarget,
          template: newTemplate,
        },
      });
      const createdId = (result.data as { createDiexForm?: { id: string } })
        ?.createDiexForm?.id;

      setNewTitle('');
      setIsCreating(false);
      if (createdId) setSelectedFormId(createdId);
    });

  const handleSaveForm = () => {
    if (!selectedForm || !formDraft) return;

    return runAction(() =>
      updateForm({
        variables: {
          id: selectedForm.id,
          input: {
            ...formDraft,
            description: formDraft.description || null,
            logoUrl: formDraft.logoUrl || null,
            privacyPolicyUrl: formDraft.privacyPolicyUrl || null,
            consentText: formDraft.consentText || null,
            ownerId: formDraft.ownerId || null,
          },
        },
      }),
    );
  };

  const handleSaveQuestion = () => {
    if (!selectedForm) return;

    return runAction(async () => {
      const input = {
        label: questionDraft.label,
        type: questionDraft.type,
        targetFieldName: questionDraft.targetFieldName || null,
        placeholder: questionDraft.placeholder || null,
        helpText: questionDraft.helpText || null,
        options: CHOICE_TYPES.has(questionDraft.type)
          ? parseOptions(questionDraft.optionsText)
          : [],
        isRequired: questionDraft.isRequired,
      };

      if (editingQuestionId) {
        await updateField({
          variables: { fieldId: editingQuestionId, input },
        });
      } else {
        await addField({ variables: { formId: selectedForm.id, input } });
      }
      setEditingQuestionId(null);
      setQuestionDraft(emptyQuestionDraft());
    });
  };

  const handleMoveQuestion = (field: FormQuestion, direction: -1 | 1) => {
    const index = sortedFields.findIndex(({ id }) => id === field.id);
    const target = sortedFields[index + direction];

    if (!target) return;

    return runAction(async () => {
      await updateField({
        variables: {
          fieldId: field.id,
          input: { position: target.position },
        },
      });
      await updateField({
        variables: {
          fieldId: target.id,
          input: { position: field.position },
        },
      });
    });
  };

  const copyPublicLink = async () => {
    if (!selectedForm?.publicUrl) return;
    await navigator.clipboard.writeText(selectedForm.publicUrl);
  };

  if (loading && !data) {
    return <Page>Carregando formulários…</Page>;
  }

  return (
    <Page>
      <PageHeader>
        <div>
          <Title>Diex Forms</Title>
          <Subtitle>
            Crie páginas de captação ligadas ao CRM. Cada formulário publicado
            recebe um link no domínio do cliente e transforma respostas em
            contatos, empresas e oportunidades.
          </Subtitle>
        </div>
        <PrimaryButton onClick={() => setIsCreating((value) => !value)}>
          {isCreating ? 'Cancelar' : 'Novo formulário'}
        </PrimaryButton>
      </PageHeader>

      {isCreating && (
        <CreateCard>
          <SectionTitle>Criar formulário</SectionTitle>
          <FormGrid style={{ marginTop: 14 }}>
            <Field>
              Nome do formulário
              <Input
                value={newTitle}
                onChange={(event) => setNewTitle(event.target.value)}
                placeholder="Ex.: Diagnóstico comercial"
                autoFocus
              />
            </Field>
            <Field>
              Modelo inicial
              <Select
                value={newTemplate}
                onChange={(event) => setNewTemplate(event.target.value)}
              >
                <option value="COMMERCIAL_QUALIFICATION">
                  Qualificação comercial
                </option>
                <option value="QUOTE_REQUEST">Pedido de orçamento</option>
                <option value="CONTACT">Contato rápido</option>
                <option value="EVENT_REGISTRATION">Inscrição em evento</option>
                <option value="BLANK">Começar em branco</option>
              </Select>
            </Field>
            <Field>
              Resultado principal no CRM
              <Select
                value={newTarget}
                onChange={(event) =>
                  setNewTarget(event.target.value as FormTargetObject)
                }
              >
                <option value="OPPORTUNITY">Criar oportunidade</option>
                <option value="PERSON">Criar ou atualizar contato</option>
                <option value="COMPANY">Criar ou atualizar empresa</option>
              </Select>
            </Field>
          </FormGrid>
          <ButtonRow style={{ marginTop: 16 }}>
            <PrimaryButton disabled={isSaving} onClick={handleCreate}>
              Criar como rascunho
            </PrimaryButton>
          </ButtonRow>
        </CreateCard>
      )}

      {error && !isFormsReadUnavailable ? (
        <CreateCard role="alert">
          <SectionTitle>Falha ao atualizar</SectionTitle>
          <Subtitle>
            Os formulários já carregados foram preservados. Atualize antes de
            concluir que houve alguma alteração.
          </Subtitle>
          <SecondaryButton
            style={{ marginTop: 14 }}
            onClick={() => void refetch()}
          >
            Tentar novamente
          </SecondaryButton>
        </CreateCard>
      ) : null}

      <Workspace>
        <Panel>
          <PanelHeader>
            <PanelTitle>Seus formulários</PanelTitle>
            <Muted>
              {isFormsReadUnavailable
                ? 'Contagem não confirmada'
                : `${forms.length} no total`}
            </Muted>
          </PanelHeader>
          {isFormsReadUnavailable ? (
            <EmptyState>
              <div>Não foi possível confirmar seus formulários.</div>
              <SecondaryButton
                style={{ marginTop: 14 }}
                onClick={() => void refetch()}
              >
                Tentar novamente
              </SecondaryButton>
            </EmptyState>
          ) : forms.length === 0 ? (
            <EmptyState>
              <div>Crie seu primeiro formulário para captar leads.</div>
              <PrimaryButton
                style={{ marginTop: 14 }}
                onClick={() => setIsCreating(true)}
              >
                Criar primeiro formulário
              </PrimaryButton>
            </EmptyState>
          ) : (
            <FormList>
              {forms.map((form) => (
                <FormListButton
                  key={form.id}
                  data-selected={form.id === selectedForm?.id}
                  onClick={() => {
                    setSelectedFormId(form.id);
                    setTab('CONTENT');
                  }}
                >
                  <FormName>{form.title}</FormName>
                  <div
                    style={{
                      display: 'flex',
                      gap: 8,
                      alignItems: 'center',
                      marginTop: 8,
                    }}
                  >
                    <StatusBadge>{FORM_STATUS_LABELS[form.status]}</StatusBadge>
                    <Muted>{form.fields.length} perguntas</Muted>
                  </div>
                </FormListButton>
              ))}
            </FormList>
          )}
        </Panel>

        <Panel>
          {isFormsReadUnavailable ? (
            <EmptyState>
              A lista não foi substituída por um falso estado vazio. Atualize
              para recuperar os formulários já existentes.
            </EmptyState>
          ) : !selectedForm || !formDraft ? (
            <EmptyState>
              Dê um nome, escolha o resultado no CRM e publique quando estiver
              pronto. As respostas entram na operação sem configuração técnica.
            </EmptyState>
          ) : (
            <>
              <EditorHeader>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      gap: 8,
                      alignItems: 'center',
                      flexWrap: 'wrap',
                    }}
                  >
                    <PanelTitle>{selectedForm.title}</PanelTitle>
                    <StatusBadge>
                      {FORM_STATUS_LABELS[selectedForm.status]}
                    </StatusBadge>
                    {hasUnpublishedChanges && (
                      <Muted>Alterações ainda não publicadas</Muted>
                    )}
                  </div>
                  {selectedForm.publicUrl && (
                    <Muted>{selectedForm.publicUrl}</Muted>
                  )}
                </div>
                <ButtonRow>
                  {selectedForm.status === 'PUBLISHED' && (
                    <>
                      <SecondaryButton onClick={copyPublicLink}>
                        Copiar link
                      </SecondaryButton>
                      <SecondaryButton
                        onClick={() =>
                          window.open(
                            selectedForm.publicUrl ?? undefined,
                            '_blank',
                            'noopener,noreferrer',
                          )
                        }
                      >
                        Abrir
                      </SecondaryButton>
                      <SecondaryButton
                        disabled={isSaving}
                        onClick={() =>
                          runAction(() =>
                            unpublishForm({
                              variables: { id: selectedForm.id },
                            }),
                          )
                        }
                      >
                        Retirar do ar
                      </SecondaryButton>
                    </>
                  )}
                  {(selectedForm.status !== 'PUBLISHED' ||
                    hasUnpublishedChanges) && (
                    <PrimaryButton
                      disabled={isSaving}
                      onClick={() =>
                        runAction(() =>
                          publishForm({ variables: { id: selectedForm.id } }),
                        )
                      }
                    >
                      {selectedForm.status === 'PUBLISHED'
                        ? 'Publicar alterações'
                        : 'Publicar'}
                    </PrimaryButton>
                  )}
                </ButtonRow>
              </EditorHeader>

              <Tabs>
                {(
                  [
                    ['CONTENT', 'Conteúdo'],
                    ['APPEARANCE', 'Aparência e LGPD'],
                    ['CONVERSION', 'Conversão no CRM'],
                    ['RESPONSES', 'Respostas'],
                  ] as Array<[EditorTab, string]>
                ).map(([value, label]) => (
                  <TabButton
                    key={value}
                    data-active={tab === value}
                    onClick={() => setTab(value)}
                  >
                    {label}
                  </TabButton>
                ))}
              </Tabs>

              <EditorBody>
                {tab === 'CONTENT' && (
                  <>
                    <Section>
                      <SectionTitle>Informações básicas</SectionTitle>
                      <FormGrid>
                        <Field>
                          Título
                          <Input
                            value={formDraft.title}
                            onChange={(event) =>
                              setFormDraft({
                                ...formDraft,
                                title: event.target.value,
                              })
                            }
                          />
                        </Field>
                        <Field>
                          Final do link
                          <Input
                            value={formDraft.slug}
                            onChange={(event) =>
                              setFormDraft({
                                ...formDraft,
                                slug: event.target.value,
                              })
                            }
                          />
                        </Field>
                      </FormGrid>
                      <Field>
                        Texto de introdução
                        <Textarea
                          value={formDraft.description}
                          onChange={(event) =>
                            setFormDraft({
                              ...formDraft,
                              description: event.target.value,
                            })
                          }
                          placeholder="Explique por que vale a pena responder."
                        />
                      </Field>
                      <Field>
                        Forma de apresentação
                        <Select
                          value={formDraft.layout}
                          onChange={(event) =>
                            setFormDraft({
                              ...formDraft,
                              layout: event.target.value as FormLayout,
                            })
                          }
                        >
                          <option value="STEP_BY_STEP">
                            Uma pergunta por vez — recomendado
                          </option>
                          <option value="SINGLE_PAGE">
                            Todas as perguntas na mesma página
                          </option>
                        </Select>
                      </Field>
                      <ButtonRow>
                        <PrimaryButton
                          disabled={isSaving}
                          onClick={handleSaveForm}
                        >
                          Salvar informações
                        </PrimaryButton>
                      </ButtonRow>
                    </Section>

                    <Section>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: 12,
                          alignItems: 'center',
                        }}
                      >
                        <SectionTitle>
                          Perguntas ({sortedFields.length})
                        </SectionTitle>
                        <SecondaryButton
                          onClick={() => {
                            setEditingQuestionId(null);
                            setQuestionDraft(emptyQuestionDraft());
                          }}
                        >
                          Nova pergunta
                        </SecondaryButton>
                      </div>

                      {sortedFields.map((field, index) => (
                        <QuestionCard key={field.id}>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              gap: 12,
                              alignItems: 'flex-start',
                            }}
                          >
                            <div>
                              <FormName>
                                {index + 1}. {field.label}
                                {field.isRequired ? ' *' : ''}
                              </FormName>
                              <Muted>
                                {FIELD_TYPE_LABELS[field.type] ?? field.type}
                              </Muted>
                            </div>
                            <ButtonRow>
                              <SecondaryButton
                                disabled={index === 0 || isSaving}
                                onClick={() => handleMoveQuestion(field, -1)}
                                title="Mover para cima"
                              >
                                ↑
                              </SecondaryButton>
                              <SecondaryButton
                                disabled={
                                  index === sortedFields.length - 1 || isSaving
                                }
                                onClick={() => handleMoveQuestion(field, 1)}
                                title="Mover para baixo"
                              >
                                ↓
                              </SecondaryButton>
                              <SecondaryButton
                                onClick={() => {
                                  setEditingQuestionId(field.id);
                                  setQuestionDraft(toQuestionDraft(field));
                                }}
                              >
                                Editar
                              </SecondaryButton>
                              <DangerButton
                                disabled={isSaving}
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      `Excluir a pergunta “${field.label}”?`,
                                    )
                                  ) {
                                    void runAction(() =>
                                      deleteField({
                                        variables: { fieldId: field.id },
                                      }),
                                    );
                                  }
                                }}
                              >
                                Excluir
                              </DangerButton>
                            </ButtonRow>
                          </div>
                        </QuestionCard>
                      ))}

                      <QuestionCard>
                        <SectionTitle>
                          {editingQuestionId
                            ? 'Editar pergunta'
                            : 'Adicionar pergunta'}
                        </SectionTitle>
                        <FormGrid style={{ marginTop: 13 }}>
                          <Field>
                            Pergunta
                            <Input
                              value={questionDraft.label}
                              onChange={(event) =>
                                setQuestionDraft({
                                  ...questionDraft,
                                  label: event.target.value,
                                })
                              }
                              placeholder="Ex.: Qual é o principal desafio?"
                            />
                          </Field>
                          <Field>
                            Tipo de resposta
                            <Select
                              value={questionDraft.type}
                              onChange={(event) =>
                                setQuestionDraft({
                                  ...questionDraft,
                                  type: event.target.value,
                                })
                              }
                            >
                              {Object.entries(FIELD_TYPE_LABELS).map(
                                ([value, label]) => (
                                  <option key={value} value={value}>
                                    {label}
                                  </option>
                                ),
                              )}
                            </Select>
                          </Field>
                          <Field>
                            Texto de exemplo
                            <Input
                              value={questionDraft.placeholder}
                              onChange={(event) =>
                                setQuestionDraft({
                                  ...questionDraft,
                                  placeholder: event.target.value,
                                })
                              }
                              placeholder="Opcional"
                            />
                          </Field>
                          <Field>
                            Uso no CRM
                            <Select
                              value={questionDraft.targetFieldName}
                              onChange={(event) =>
                                setQuestionDraft({
                                  ...questionDraft,
                                  targetFieldName: event.target.value,
                                })
                              }
                            >
                              <option value="">Somente guardar resposta</option>
                              <option value="name">Nome do contato</option>
                              <option value="email">E-mail</option>
                              <option value="phone">Telefone / WhatsApp</option>
                              <option value="companyName">Empresa</option>
                              <option value="jobTitle">Cargo</option>
                              <option value="budget">
                                Valor da oportunidade
                              </option>
                              <option value="need">
                                Necessidade comercial
                              </option>
                              <option value="timing">Prazo de decisão</option>
                            </Select>
                          </Field>
                        </FormGrid>
                        <Field style={{ marginTop: 12 }}>
                          Ajuda abaixo da pergunta
                          <Input
                            value={questionDraft.helpText}
                            onChange={(event) =>
                              setQuestionDraft({
                                ...questionDraft,
                                helpText: event.target.value,
                              })
                            }
                            placeholder="Opcional"
                          />
                        </Field>
                        {CHOICE_TYPES.has(questionDraft.type) && (
                          <Field style={{ marginTop: 12 }}>
                            Opções — uma por linha
                            <Textarea
                              value={questionDraft.optionsText}
                              onChange={(event) =>
                                setQuestionDraft({
                                  ...questionDraft,
                                  optionsText: event.target.value,
                                })
                              }
                              placeholder={
                                'Até R$ 5 mil | 5000\nR$ 5 mil a R$ 15 mil | 15000'
                              }
                            />
                            <Muted>
                              O texto antes de | aparece para o visitante; o
                              valor depois de | é usado no CRM.
                            </Muted>
                          </Field>
                        )}
                        <Toggle style={{ marginTop: 14 }}>
                          <input
                            type="checkbox"
                            checked={questionDraft.isRequired}
                            onChange={(event) =>
                              setQuestionDraft({
                                ...questionDraft,
                                isRequired: event.target.checked,
                              })
                            }
                          />
                          Resposta obrigatória
                        </Toggle>
                        <ButtonRow style={{ marginTop: 14 }}>
                          <PrimaryButton
                            disabled={isSaving || !questionDraft.label.trim()}
                            onClick={handleSaveQuestion}
                          >
                            {editingQuestionId
                              ? 'Salvar pergunta'
                              : 'Adicionar pergunta'}
                          </PrimaryButton>
                          {editingQuestionId && (
                            <SecondaryButton
                              onClick={() => {
                                setEditingQuestionId(null);
                                setQuestionDraft(emptyQuestionDraft());
                              }}
                            >
                              Cancelar edição
                            </SecondaryButton>
                          )}
                        </ButtonRow>
                      </QuestionCard>
                    </Section>
                  </>
                )}

                {tab === 'APPEARANCE' && (
                  <>
                    <Section>
                      <SectionTitle>Identidade visual</SectionTitle>
                      <Toggle>
                        <input
                          type="checkbox"
                          checked={formDraft.showLogo}
                          onChange={(event) =>
                            setFormDraft({
                              ...formDraft,
                              showLogo: event.target.checked,
                            })
                          }
                        />
                        Mostrar logotipo no formulário. Sem uma URL própria, o
                        sistema tenta usar o logotipo do workspace.
                      </Toggle>
                      {formDraft.showLogo && (
                        <Field>
                          URL HTTPS do logotipo — opcional
                          <Input
                            value={formDraft.logoUrl}
                            onChange={(event) =>
                              setFormDraft({
                                ...formDraft,
                                logoUrl: event.target.value,
                              })
                            }
                            placeholder="https://.../logo.png"
                          />
                        </Field>
                      )}
                      <Field>
                        Cor principal
                        <div style={{ display: 'flex', gap: 10 }}>
                          <Input
                            type="color"
                            value={formDraft.accentColor}
                            onChange={(event) =>
                              setFormDraft({
                                ...formDraft,
                                accentColor: event.target.value,
                              })
                            }
                            style={{ width: 54, padding: 5 }}
                          />
                          <Input
                            value={formDraft.accentColor}
                            onChange={(event) =>
                              setFormDraft({
                                ...formDraft,
                                accentColor: event.target.value,
                              })
                            }
                          />
                        </div>
                      </Field>
                    </Section>

                    <Section>
                      <SectionTitle>Confirmação após o envio</SectionTitle>
                      <FormGrid>
                        <Field>
                          Título
                          <Input
                            value={formDraft.successTitle}
                            onChange={(event) =>
                              setFormDraft({
                                ...formDraft,
                                successTitle: event.target.value,
                              })
                            }
                          />
                        </Field>
                        <Field>
                          Texto do botão
                          <Input
                            value={formDraft.submitButtonLabel}
                            onChange={(event) =>
                              setFormDraft({
                                ...formDraft,
                                submitButtonLabel: event.target.value,
                              })
                            }
                          />
                        </Field>
                      </FormGrid>
                      <Field>
                        Mensagem
                        <Textarea
                          value={formDraft.successMessage}
                          onChange={(event) =>
                            setFormDraft({
                              ...formDraft,
                              successMessage: event.target.value,
                            })
                          }
                        />
                      </Field>
                    </Section>

                    <Section>
                      <SectionTitle>Privacidade e consentimento</SectionTitle>
                      <Toggle>
                        <input
                          type="checkbox"
                          checked={formDraft.consentRequired}
                          onChange={(event) =>
                            setFormDraft({
                              ...formDraft,
                              consentRequired: event.target.checked,
                            })
                          }
                        />
                        Exigir consentimento antes do envio
                      </Toggle>
                      <Field>
                        Texto do consentimento
                        <Textarea
                          value={formDraft.consentText}
                          onChange={(event) =>
                            setFormDraft({
                              ...formDraft,
                              consentText: event.target.value,
                            })
                          }
                          placeholder="Autorizo o uso dos dados para atendimento e contato comercial."
                        />
                      </Field>
                      <Field>
                        Link HTTPS da política de privacidade
                        <Input
                          value={formDraft.privacyPolicyUrl}
                          onChange={(event) =>
                            setFormDraft({
                              ...formDraft,
                              privacyPolicyUrl: event.target.value,
                            })
                          }
                          placeholder="https://suaempresa.com.br/privacidade"
                        />
                      </Field>
                      <ButtonRow>
                        <PrimaryButton
                          disabled={isSaving}
                          onClick={handleSaveForm}
                        >
                          Salvar aparência e privacidade
                        </PrimaryButton>
                      </ButtonRow>
                    </Section>
                  </>
                )}

                {tab === 'CONVERSION' && (
                  <>
                    <Section>
                      <SectionTitle>Destino das respostas</SectionTitle>
                      <Field>
                        Resultado principal
                        <Select
                          value={formDraft.targetObject}
                          onChange={(event) =>
                            setFormDraft({
                              ...formDraft,
                              targetObject: event.target
                                .value as FormTargetObject,
                            })
                          }
                        >
                          <option value="PERSON">Contato</option>
                          <option value="COMPANY">Empresa</option>
                          <option value="OPPORTUNITY">Oportunidade</option>
                        </Select>
                      </Field>
                      <Toggle>
                        <input
                          type="checkbox"
                          checked={formDraft.createOpportunity}
                          onChange={(event) =>
                            setFormDraft({
                              ...formDraft,
                              createOpportunity: event.target.checked,
                            })
                          }
                        />
                        Criar uma oportunidade comercial a cada nova resposta
                        válida. Contatos existentes são reaproveitados por
                        e-mail ou WhatsApp.
                      </Toggle>
                      {formDraft.createOpportunity && (
                        <FormGrid>
                          <Field>
                            Etapa inicial do funil
                            <Select
                              value={formDraft.opportunityStage}
                              onChange={(event) =>
                                setFormDraft({
                                  ...formDraft,
                                  opportunityStage: event.target.value,
                                })
                              }
                            >
                              <option value="NEW">Novo lead</option>
                              <option value="SCREENING">Qualificação</option>
                              <option value="MEETING">
                                Diagnóstico marcado
                              </option>
                              <option value="DIAGNOSIS_COMPLETE">
                                Diagnóstico realizado
                              </option>
                              <option value="PROPOSAL">Proposta enviada</option>
                              <option value="NEGOTIATION">Negociação</option>
                              <option value="CUSTOMER">Fechado ganho</option>
                              <option value="LOST">Fechado perdido</option>
                            </Select>
                          </Field>
                          <Field>
                            Responsável pelo lead
                            {workspaceMembersError ? (
                              <Muted>
                                Responsáveis indisponíveis nesta leitura. O
                                formulário continua acessível.
                              </Muted>
                            ) : null}
                            <Select
                              value={formDraft.ownerId}
                              onChange={(event) =>
                                setFormDraft({
                                  ...formDraft,
                                  ownerId: event.target.value,
                                })
                              }
                            >
                              <option value="">Sem responsável fixo</option>
                              {workspaceMembers.map((member) => {
                                const memberName = [
                                  member.name.firstName,
                                  member.name.lastName,
                                ]
                                  .filter(Boolean)
                                  .join(' ');

                                return (
                                  <option key={member.id} value={member.id}>
                                    {memberName || 'Membro sem nome'}
                                  </option>
                                );
                              })}
                            </Select>
                          </Field>
                        </FormGrid>
                      )}
                      <Muted>
                        Para melhorar a qualidade do cadastro, mapeie perguntas
                        de nome, e-mail, WhatsApp, empresa e orçamento na aba
                        Conteúdo.
                      </Muted>
                      <ButtonRow>
                        <PrimaryButton
                          disabled={isSaving}
                          onClick={handleSaveForm}
                        >
                          Salvar conversão
                        </PrimaryButton>
                      </ButtonRow>
                    </Section>

                    <Section>
                      <SectionTitle>Zona de risco</SectionTitle>
                      <Muted>
                        A exclusão remove também as respostas guardadas. Para
                        interromper a captação sem perder histórico, use
                        “Retirar do ar”.
                      </Muted>
                      <ButtonRow>
                        <DangerButton
                          disabled={isSaving}
                          onClick={() => {
                            const confirmation = window.prompt(
                              `Digite exatamente “${selectedForm.title}” para excluir permanentemente:`,
                            );

                            if (confirmation === null) return;
                            void runAction(async () => {
                              await deleteForm({
                                variables: {
                                  id: selectedForm.id,
                                  confirmationTitle: confirmation,
                                },
                              });
                              setSelectedFormId(null);
                            });
                          }}
                        >
                          Excluir formulário
                        </DangerButton>
                      </ButtonRow>
                    </Section>
                  </>
                )}

                {tab === 'RESPONSES' && (
                  <Section>
                    <SectionTitle>100 respostas mais recentes</SectionTitle>
                    {submissionsLoading ? (
                      <Muted>Carregando respostas…</Muted>
                    ) : (submissionsData?.diexFormSubmissions.length ?? 0) ===
                      0 ? (
                      <EmptyState>
                        Nenhuma resposta recebida neste formulário.
                      </EmptyState>
                    ) : (
                      submissionsData?.diexFormSubmissions.map((submission) => (
                        <ResponseCard key={submission.id}>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              gap: 12,
                              alignItems: 'center',
                            }}
                          >
                            <StatusBadge>
                              {SUBMISSION_STATUS_LABELS[submission.status]}
                            </StatusBadge>
                            <Muted>{formatDate(submission.createdAt)}</Muted>
                          </div>
                          <div
                            style={{
                              display: 'grid',
                              gap: 6,
                              marginTop: 12,
                            }}
                          >
                            {Object.entries(submission.submittedData)
                              .slice(0, 8)
                              .map(([key, value]) => (
                                <div key={key} style={{ fontSize: 13 }}>
                                  <Muted>
                                    {selectedForm.fields.find(
                                      ({ name }) => name === key,
                                    )?.label ?? key}
                                    :{' '}
                                  </Muted>
                                  {Array.isArray(value)
                                    ? value.join(', ')
                                    : String(value ?? '')}
                                </div>
                              ))}
                          </div>
                          {submission.processingError && (
                            <div
                              style={{
                                marginTop: 10,
                                color: themeCssVariables.color.red,
                                fontSize: 12,
                              }}
                            >
                              {submission.processingError}
                            </div>
                          )}
                        </ResponseCard>
                      ))
                    )}
                  </Section>
                )}
              </EditorBody>
            </>
          )}
        </Panel>
      </Workspace>
    </Page>
  );
};
