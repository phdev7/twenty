import { styled } from '@linaria/react';
import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useState,
} from 'react';
import { IconArrowRight, IconSparkles } from 'diex-ui/icon';
import { Button } from 'diex-ui/input';
import { themeCssVariables } from 'diex-ui/theme-constants';

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

const StyledGrid = styled.div`
  align-items: start;
  display: grid;
  gap: ${themeCssVariables.spacing[5]};
  grid-template-columns: minmax(0, 680px) minmax(300px, 380px);
  max-width: 1100px;
  width: 100%;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
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
  initialDescription = '',
  supplementaryContent,
  onSubmit,
}: {
  isSubmitting: boolean;
  initialDescription?: string;
  supplementaryContent?: ReactNode;
  onSubmit: (operationDescription: string) => void;
}) => {
  const [operationDescription, setOperationDescription] =
    useState(initialDescription);
  const [hasEditedDescription, setHasEditedDescription] = useState(false);

  useEffect(() => {
    if (!hasEditedDescription && initialDescription) {
      setOperationDescription(initialDescription);
    }
  }, [hasEditedDescription, initialDescription]);

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
      <StyledGrid>
        <StyledCard onSubmit={handleSubmit}>
          <StyledIcon>
            <IconSparkles size={20} />
          </StyledIcon>
          <StyledTitle>
            {initialDescription
              ? 'Confirme a descrição da sua operação:'
              : 'Descreva sua operação atualmente:'}
          </StyledTitle>
          <StyledDescription>
            {initialDescription
              ? 'Reunimos o que você respondeu no cadastro. Ajuste o que quiser e a IA organizará o contexto do CRM.'
              : 'Responda como em uma entrevista curta: empresa e segmento, ofertas, cliente ideal, canais de aquisição, vendas, objeções, provas, tom de voz, regras comerciais e responsáveis. A IA organizará tudo para sua revisão antes de publicar a estrutura.'}
          </StyledDescription>
          <TextArea
            textAreaId="diex-operation-description"
            minRows={8}
            maxRows={14}
            value={operationDescription}
            disabled={isSubmitting}
            placeholder="Ex.: Somos uma fábrica de móveis planejados para arquitetos e consumidores de alto padrão. Vendemos cozinhas e projetos completos; os leads chegam pelo WhatsApp e indicação. O ciclo dura cerca de 30 dias, a principal objeção é preço e descontos precisam de aprovação..."
            onChange={(value) => {
              setHasEditedDescription(true);
              setOperationDescription(value);
            }}
          />
          <StyledFooter>
            <StyledHint>Quanto mais fatos, melhor a recomendação. Mínimo de 20 caracteres.</StyledHint>
            <Button
              type="submit"
              title={isSubmitting ? 'Preparando seu CRM...' : 'Preparar meu CRM'}
              Icon={IconArrowRight}
              disabled={!canSubmit}
              isLoading={isSubmitting}
            />
          </StyledFooter>
        </StyledCard>
        {supplementaryContent}
      </StyledGrid>
    </StyledRoot>
  );
};
