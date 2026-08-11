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
import { type OnboardingOfferSummary } from '@/diex-onboarding/types/diexOnboardingTypes';
import { useCreateOneRecord } from '@/object-record/hooks/useCreateOneRecord';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { TextInput } from '@/ui/input/components/TextInput';

const StyledForm = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: minmax(180px, 0.8fr) minmax(220px, 1.2fr);
`;

const StyledOfferList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledOfferReview = styled.div`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledError = styled.div`
  color: ${themeCssVariables.font.color.danger};
  font-size: ${themeCssVariables.font.size.xs};
`;

const readMarkdown = (offer: OnboardingOfferSummary) =>
  offer.valueProposition?.markdown?.trim() ?? '';

const DiexOnboardingDraftOffer = ({
  offer,
  onApproved,
}: {
  offer: OnboardingOfferSummary;
  onApproved: () => void;
}) => {
  const [name, setName] = useState(offer.name ?? '');
  const [valueProposition, setValueProposition] = useState(
    readMarkdown(offer),
  );
  const [isApproving, setIsApproving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { updateOneRecord } = useUpdateOneRecord();

  const approveOffer = async () => {
    if (!name.trim() || !valueProposition.trim()) {
      return;
    }

    setIsApproving(true);
    setErrorMessage(null);

    try {
      await updateOneRecord({
        objectNameSingular: 'offer',
        idToUpdate: offer.id,
        updateOneRecordInput: {
          name: name.trim(),
          status: 'ACTIVE',
          valueProposition: { markdown: valueProposition.trim() },
        },
        recordGqlFields: {
          id: true,
          name: true,
          status: true,
          valueProposition: { markdown: true },
        },
      });
      onApproved();
    } catch {
      setErrorMessage('Não foi possível ativar esta oferta.');
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <StyledOfferReview>
      <StyledForm>
        <TextInput
          value={name}
          placeholder="Nome da oferta"
          onChange={setName}
          disabled={isApproving}
          fullWidth
        />
        <TextInput
          value={valueProposition}
          placeholder="Resultado entregue ao cliente"
          onChange={setValueProposition}
          disabled={isApproving}
          fullWidth
        />
      </StyledForm>
      {errorMessage ? <StyledError>{errorMessage}</StyledError> : null}
      <StyledActions>
        <Button
          title={isApproving ? 'Ativando...' : 'Aprovar e ativar oferta'}
          variant="primary"
          disabled={
            isApproving || !name.trim() || !valueProposition.trim()
          }
          onClick={() => void approveOffer()}
        />
      </StyledActions>
    </StyledOfferReview>
  );
};

type DiexOnboardingOfferStepProps = {
  offers: OnboardingOfferSummary[];
  activeOfferCount: number;
  isReady?: boolean;
  onChanged: () => void;
};

export const DiexOnboardingOfferStep = ({
  offers,
  activeOfferCount,
  isReady,
  onChanged,
}: DiexOnboardingOfferStepProps) => {
  const [name, setName] = useState('');
  const [valueProposition, setValueProposition] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { createOneRecord, loading } = useCreateOneRecord({
    objectNameSingular: 'offer',
    recordGqlFields: { id: true, name: true, status: true },
  });
  const isDone = isReady ?? activeOfferCount > 0;
  const draftOffers = offers.filter(({ status }) => status === 'DRAFT');

  const createOffer = async () => {
    if (!name.trim() || !valueProposition.trim()) {
      return;
    }

    setErrorMessage(null);

    try {
      await createOneRecord({
        name: name.trim(),
        status: 'ACTIVE',
        valueProposition: { markdown: valueProposition.trim() },
      });
      setName('');
      setValueProposition('');
      onChanged();
    } catch {
      setErrorMessage('Não foi possível cadastrar esta oferta.');
    }
  };

  return (
    <DiexOnboardingStepCard
      index={3}
      isDone={isDone}
      title="Revisar o que será vendido"
      badges={
        <DiexOnboardingBadge tone={isDone ? 'green' : 'orange'}>
          {isDone ? `${activeOfferCount} oferta(s) ativa(s)` : 'Obrigatório'}
        </DiexOnboardingBadge>
      }
    >
      <StyledText>
        A IA sugeriu ofertas a partir da entrevista. Revise nome e resultado
        entregue antes de ativar; rascunhos não alimentam respostas nem deixam o
        CRM pronto para vender.
      </StyledText>
      {draftOffers.length > 0 ? (
        <StyledOfferList>
          {draftOffers.map((offer) => (
            <DiexOnboardingDraftOffer
              key={offer.id}
              offer={offer}
              onApproved={onChanged}
            />
          ))}
        </StyledOfferList>
      ) : null}
      {isDone ? (
        <StyledText>
          {activeOfferCount} oferta(s) aprovada(s). Você ainda pode cadastrar
          outra oferta manualmente.
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
      {errorMessage ? <StyledError>{errorMessage}</StyledError> : null}
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
