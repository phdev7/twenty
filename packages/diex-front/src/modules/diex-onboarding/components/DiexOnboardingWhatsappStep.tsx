import { styled } from '@linaria/react';
import { Button } from 'diex-ui/input';
import { themeCssVariables } from 'diex-ui/theme-constants';

import {
  DiexOnboardingBadge,
  type DiexOnboardingBadgeTone,
} from '@/diex-onboarding/components/DiexOnboardingBadge';
import {
  DiexOnboardingStepCard,
  StyledActions,
  StyledText,
} from '@/diex-onboarding/components/DiexOnboardingStepCard';
import { type WhatsappConnection } from '@/settings/accounts/hooks/useWhatsappConnection';

const CONNECTION_TONE: Record<
  WhatsappConnection['state'],
  { label: string; tone: DiexOnboardingBadgeTone }
> = {
  CONNECTED: { label: 'Conectado', tone: 'green' },
  AWAITING_SCAN: { label: 'Aguardando leitura', tone: 'blue' },
  CONNECTING: { label: 'Conectando', tone: 'blue' },
  NOT_PROVISIONED: { label: 'Não configurado', tone: 'gray' },
  UNAVAILABLE: { label: 'Indisponível', tone: 'red' },
};

const StyledQrPanel = styled.div`
  align-items: center;
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  padding: ${themeCssVariables.spacing[4]};
  width: fit-content;
`;

// The QR is rendered on a fixed white plate: WhatsApp fails to read it when
// the dark theme tints the quiet zone around the code.
const StyledQrImage = styled.img`
  background: ${themeCssVariables.background.invertedPrimary};
  border-radius: ${themeCssVariables.border.radius.sm};
  display: block;
  height: 212px;
  padding: ${themeCssVariables.spacing[2]};
  width: 212px;
`;

const StyledQrCaption = styled.p`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
  margin: 0;
  max-width: 30ch;
  text-align: center;
`;

type DiexOnboardingWhatsappStepProps = {
  index?: number;
  connection: WhatsappConnection | null;
  isConnecting: boolean;
  isDone: boolean;
  errorMessage?: string | null;
  onRequestConnection: () => void;
};

export const DiexOnboardingWhatsappStep = ({
  index = 5,
  connection,
  isConnecting,
  isDone,
  errorMessage,
  onRequestConnection,
}: DiexOnboardingWhatsappStepProps) => (
  <DiexOnboardingStepCard
    index={index}
    isDone={isDone}
    title="Conectar o WhatsApp"
    badges={
      connection ? (
        <DiexOnboardingBadge tone={CONNECTION_TONE[connection.state].tone}>
          {CONNECTION_TONE[connection.state].label}
        </DiexOnboardingBadge>
      ) : null
    }
  >
    <StyledText>
      {connection?.message ?? 'Preparando a instância deste workspace.'}
    </StyledText>

    {errorMessage ? <StyledText>{errorMessage}</StyledText> : null}

    {connection?.qrCodeDataUri ? (
      <StyledQrPanel>
        <StyledQrImage
          src={connection.qrCodeDataUri}
          alt="QR Code para conectar o WhatsApp"
        />
        <StyledQrCaption>
          WhatsApp → Aparelhos conectados → Conectar aparelho
        </StyledQrCaption>
      </StyledQrPanel>
    ) : null}

    {isDone && connection?.phone ? (
      <StyledText>Número conectado: {connection.phone}</StyledText>
    ) : null}

    <StyledActions>
      <Button
        variant="secondary"
        title={
          isConnecting
            ? 'Falando com a Evolution...'
            : isDone
              ? 'Verificar de novo'
              : 'Gerar QR Code'
        }
        disabled={isConnecting}
        onClick={onRequestConnection}
      />
    </StyledActions>
  </DiexOnboardingStepCard>
);
