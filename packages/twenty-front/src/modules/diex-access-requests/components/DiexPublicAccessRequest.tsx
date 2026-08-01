import { useState } from 'react';
import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { useDiexPublicAccessRequest } from '@/diex-access-requests/hooks/useDiexPublicAccessRequest';
import { type DiexPublicAccessRequestInput } from '@/diex-access-requests/types/diexPublicAccessRequestTypes';

const EMPTY_INPUT: DiexPublicAccessRequestInput = {
  companyName: '',
  contactName: '',
  email: '',
  whatsapp: '',
  teamSize: '',
  desiredSubdomain: '',
  goal: '',
  website: '',
};

const StyledPage = styled.main`
  align-items: center;
  background: ${themeCssVariables.background.secondary};
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  min-height: 100vh;
  padding: ${themeCssVariables.spacing[6]};
`;

const StyledCard = styled.section`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.lg};
  box-shadow: ${themeCssVariables.boxShadow.strong};
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  max-width: 680px;
  padding: ${themeCssVariables.spacing[6]};
  width: 100%;
`;

const StyledTitle = styled.h1`
  font-size: ${themeCssVariables.font.size.xxl};
  margin: 0;
`;

const StyledText = styled.p`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.5;
  margin: 0;
`;

const StyledForm = styled.form`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
`;

const StyledField = styled.label<{ isWide?: boolean }>`
  display: flex;
  flex-direction: column;
  font-size: ${themeCssVariables.font.size.xs};
  gap: ${themeCssVariables.spacing[1]};
  grid-column: ${({ isWide }) => (isWide ? '1 / -1' : 'auto')};
`;

const fieldStyles = `
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  box-sizing: border-box;
  color: ${themeCssVariables.font.color.primary};
  font: inherit;
  min-height: 36px;
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
  width: 100%;
`;

const StyledInput = styled.input`
  ${fieldStyles}
`;

const StyledSelect = styled.select`
  ${fieldStyles}
`;

const StyledTextarea = styled.textarea`
  ${fieldStyles}
  min-height: 96px;
  resize: vertical;
`;

const StyledHoneypot = styled.div`
  display: none;
`;

const StyledButton = styled.button`
  background: ${themeCssVariables.color.blue};
  border: 0;
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.inverted};
  cursor: pointer;
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  grid-column: 1 / -1;
  min-height: 40px;
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[4]};

  &:disabled {
    cursor: default;
    opacity: 0.55;
  }
`;

const StyledResult = styled.div<{ isSuccess: boolean }>`
  background: ${({ isSuccess }) =>
    isSuccess
      ? themeCssVariables.tag.background.green
      : themeCssVariables.background.transparent.danger};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${({ isSuccess }) =>
    isSuccess
      ? themeCssVariables.tag.text.green
      : themeCssVariables.font.color.danger};
  font-size: ${themeCssVariables.font.size.sm};
  padding: ${themeCssVariables.spacing[3]};
`;

const Field = ({
  label,
  name,
  value,
  required,
  isWide,
  onChange,
}: {
  label: string;
  name: keyof DiexPublicAccessRequestInput;
  value: string;
  required?: boolean;
  isWide?: boolean;
  onChange: (name: keyof DiexPublicAccessRequestInput, value: string) => void;
}) => (
  <StyledField isWide={isWide}>
    {label}
    <StyledInput
      name={name}
      value={value}
      required={required}
      maxLength={200}
      onChange={(event) => onChange(name, event.target.value)}
    />
  </StyledField>
);

export const DiexPublicAccessRequest = () => {
  const { availability, isSubmitting, result, checkAvailability, submit } =
    useDiexPublicAccessRequest();
  const [input, setInput] = useState(EMPTY_INPUT);

  if (availability === 'LOADING') {
    return <StyledPage />;
  }

  if (availability === 'NOT_FOUND') {
    return (
      <StyledPage>
        <StyledCard>
          <StyledTitle>Página não encontrada</StyledTitle>
        </StyledCard>
      </StyledPage>
    );
  }

  if (availability === 'ERROR') {
    return (
      <StyledPage>
        <StyledCard>
          <StyledTitle>Não foi possível abrir o formulário</StyledTitle>
          <StyledButton type="button" onClick={() => void checkAvailability()}>
            Tentar novamente
          </StyledButton>
        </StyledCard>
      </StyledPage>
    );
  }

  const updateInput = (
    name: keyof DiexPublicAccessRequestInput,
    value: string,
  ) => setInput((current) => ({ ...current, [name]: value }));

  return (
    <StyledPage>
      <StyledCard>
        <div>
          <StyledTitle>Solicite acesso à Diex</StyledTitle>
          <StyledText>
            Conte o básico da operação comercial. A equipe analisa o pedido e
            entra em contato pelo WhatsApp antes de criar qualquer workspace.
          </StyledText>
        </div>

        <StyledForm
          onSubmit={(event) => {
            event.preventDefault();
            void submit(input);
          }}
        >
          <Field
            label="Empresa *"
            name="companyName"
            value={input.companyName}
            required
            onChange={updateInput}
          />
          <Field
            label="Seu nome"
            name="contactName"
            value={input.contactName}
            onChange={updateInput}
          />
          <Field
            label="E-mail *"
            name="email"
            value={input.email}
            required
            onChange={updateInput}
          />
          <Field
            label="WhatsApp com DDD *"
            name="whatsapp"
            value={input.whatsapp}
            required
            onChange={updateInput}
          />
          <StyledField>
            Tamanho do time comercial
            <StyledSelect
              value={input.teamSize}
              onChange={(event) => updateInput('teamSize', event.target.value)}
            >
              <option value="">Selecione</option>
              <option value="1">1 pessoa</option>
              <option value="2-5">2 a 5 pessoas</option>
              <option value="6-15">6 a 15 pessoas</option>
              <option value="16+">16 ou mais</option>
            </StyledSelect>
          </StyledField>
          <Field
            label="Endereço desejado"
            name="desiredSubdomain"
            value={input.desiredSubdomain}
            onChange={updateInput}
          />
          <StyledField isWide>
            O que você quer resolver?
            <StyledTextarea
              value={input.goal}
              maxLength={1000}
              onChange={(event) => updateInput('goal', event.target.value)}
            />
          </StyledField>
          <StyledHoneypot aria-hidden="true">
            <input
              tabIndex={-1}
              autoComplete="off"
              value={input.website}
              onChange={(event) => updateInput('website', event.target.value)}
            />
          </StyledHoneypot>
          <StyledButton type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Enviando...' : 'Solicitar acesso'}
          </StyledButton>
        </StyledForm>

        {result ? (
          <StyledResult isSuccess={result.accepted}>
            {result.message}
          </StyledResult>
        ) : null}
      </StyledCard>
    </StyledPage>
  );
};
