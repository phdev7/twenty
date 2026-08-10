import { useState } from 'react';
import { styled } from '@linaria/react';
import { Button } from 'diex-ui/input';
import { themeCssVariables } from 'diex-ui/theme-constants';

import { DiexOnboardingBadge } from '@/diex-onboarding/components/DiexOnboardingBadge';
import {
  DiexOnboardingStepCard,
  StyledActions,
  StyledText,
} from '@/diex-onboarding/components/DiexOnboardingStepCard';
import { useCreateOneRecord } from '@/object-record/hooks/useCreateOneRecord';
import { TextInput } from '@/ui/input/components/TextInput';

const StyledForm = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: minmax(180px, 0.8fr) minmax(220px, 1.2fr);
`;

type DiexOnboardingOfferStepProps = {
  offerCount: number;
  isReady?: boolean;
  onCreated: () => void;
};

export const DiexOnboardingOfferStep = ({
  offerCount,
  isReady,
  onCreated,
}: DiexOnboardingOfferStepProps) => {
  const [name, setName] = useState('');
  const [valueProposition, setValueProposition] = useState('');
  const { createOneRecord, loading } = useCreateOneRecord({
    objectNameSingular: 'offer',
    recordGqlFields: { id: true, name: true, status: true },
  });
  const isDone = isReady ?? offerCount > 0;

  const createOffer = async () => {
    if (!name.trim() || !valueProposition.trim()) {
      return;
    }

    await createOneRecord({
      name: name.trim(),
      status: 'ACTIVE',
      valueProposition: { markdown: valueProposition.trim() },
    });
    setName('');
    setValueProposition('');
    onCreated();
  };

  return (
    <DiexOnboardingStepCard
      index={4}
      isDone={isDone}
      title="Cadastrar a oferta que será vendida"
      badges={
        <DiexOnboardingBadge tone={isDone ? 'green' : 'orange'}>
          {isDone ? `${offerCount} oferta ativa` : 'Obrigatório'}
        </DiexOnboardingBadge>
      }
    >
      <StyledText>
        A IA só pode qualificar e responder com precisão quando sabe o que a
        empresa vende. Cadastre pelo menos uma oferta ativa.
      </StyledText>
      {isDone ? (
        <StyledText>
          {offerCount} oferta(s) ativa(s). Adicione outras abaixo para alimentar
          a qualificação e as respostas da IA.
        </StyledText>
      ) : null}
      <StyledForm>
        <TextInput
          value={name}
          placeholder="Nome da oferta"
          onChange={setName}
          disabled={loading}
          fullWidth
        />
        <TextInput
          value={valueProposition}
          placeholder="Promessa e resultado entregue"
          onChange={setValueProposition}
          disabled={loading}
          fullWidth
        />
      </StyledForm>
      <StyledActions>
        <Button
          title={
            loading
              ? 'Salvando oferta...'
              : isDone
                ? 'Adicionar outra oferta'
                : 'Salvar oferta ativa'
          }
          variant={isDone ? 'secondary' : 'primary'}
          disabled={loading || !name.trim() || !valueProposition.trim()}
          onClick={() => void createOffer()}
        />
      </StyledActions>
    </DiexOnboardingStepCard>
  );
};
