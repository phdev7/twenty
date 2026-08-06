import { styled } from '@linaria/react';
import { type FormEvent, useState } from 'react';
import { IconArrowRight, IconSparkles } from 'twenty-ui/icon';
import { Button } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { TextArea } from '@/ui/input/components/TextArea';

const StyledRoot = styled.main`
  align-items: center;
  box-sizing: border-box;
  display: flex;
  flex: 1;
  justify-content: center;
  overflow-y: auto;
  padding: ${themeCssVariables.spacing[6]};
  width: 100%;
`;

const StyledCard = styled.form`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.lg};
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  max-width: 680px;
  padding: ${themeCssVariables.spacing[6]};
  width: 100%;
`;

const StyledIcon = styled.div`
  align-items: center;
  background: ${themeCssVariables.background.transparent.blue};
  border: 1px solid ${themeCssVariables.border.color.blue};
  border-radius: ${themeCssVariables.border.radius.md};
  color: ${themeCssVariables.color.blue};
  display: flex;
  height: 40px;
  justify-content: center;
  width: 40px;
`;

const StyledTitle = styled.h1`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.xl};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  margin: 0;
`;

const StyledDescription = styled.p`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.5;
  margin: -${themeCssVariables.spacing[2]} 0 0;
`;

const StyledFooter = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[3]};
  justify-content: space-between;
`;

const StyledHint = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
`;

export const DiexOnboarding = ({
  isSubmitting,
  onSubmit,
}: {
  isSubmitting: boolean;
  onSubmit: (operationDescription: string) => void;
}) => {
  const [operationDescription, setOperationDescription] = useState('');
  const normalizedDescription = operationDescription.trim();
  const canSubmit = normalizedDescription.length >= 20 && !isSubmitting;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (canSubmit) {
      onSubmit(normalizedDescription);
    }
  };

  return (
    <StyledRoot>
      <StyledCard onSubmit={handleSubmit}>
        <StyledIcon>
          <IconSparkles size={20} />
        </StyledIcon>
        <StyledTitle>Descreva sua operação atualmente:</StyledTitle>
        <StyledDescription>
          Conte o que sua empresa faz, quem atende, como vende e quais são os
          principais processos ou dificuldades. A IA organizará a resposta e
          deixará o contexto do CRM pronto para sua revisão.
        </StyledDescription>
        <TextArea
          textAreaId="diex-operation-description"
          minRows={8}
          maxRows={14}
          value={operationDescription}
          disabled={isSubmitting}
          placeholder="Ex.: Somos uma empresa de... Nosso cliente ideal é... Hoje os leads chegam por..."
          onChange={setOperationDescription}
        />
        <StyledFooter>
          <StyledHint>Mínimo de 20 caracteres.</StyledHint>
          <Button
            type="submit"
            title={isSubmitting ? 'Preparando seu CRM...' : 'Preparar meu CRM'}
            Icon={IconArrowRight}
            disabled={!canSubmit}
            isLoading={isSubmitting}
          />
        </StyledFooter>
      </StyledCard>
    </StyledRoot>
  );
};
