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
import { type DiexPrimaryChannel } from '@/diex-onboarding/types/diexOnboardingTypes';
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

const StyledChannelGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
`;

type DiexOnboardingWhatsappStepProps = {
  index?: number;
  connection: WhatsappConnection | null;
  isConnecting: boolean;
  isDone: boolean;
  primaryChannel?: string | null;
  isSavingPreference?: boolean;
  errorMessage?: string | null;
  onSelectChannel?: (primaryChannel: DiexPrimaryChannel) => void;
  onOpenEmail?: () => void;
  onOpenRecords?: () => void;
  onRequestConnection: () => void;
};

export const DiexOnboardingWhatsappStep = ({
  index = 5,
  connection,
  isConnecting,
  isDone,
  primaryChannel = null,
  isSavingPreference = false,
  errorMessage,
  onSelectChannel,
  onOpenEmail,
  onOpenRecords,
  onRequestConnection,
}: DiexOnboardingWhatsappStepProps) => {
  const isWhatsappTechnicallyConnected = connection?.state === 'CONNECTED';

  return (
    <DiexOnboardingStepCard
      index={index}
      isDone={isDone}
      title="Definir a forma principal de entrada"
      badges={
        primaryChannel === 'WHATSAPP' && connection ? (
          <DiexOnboardingBadge
            tone={
              isDone
                ? 'green'
                : isWhatsappTechnicallyConnected
                  ? 'blue'
                  : CONNECTION_TONE[connection.state].tone
            }
          >
            {isDone
              ? 'Validado por mensagem'
              : isWhatsappTechnicallyConnected
                ? 'Conectado; falta validar'
                : CONNECTION_TONE[connection.state].label}
          </DiexOnboardingBadge>
        ) : primaryChannel ? (
          <DiexOnboardingBadge tone={isDone ? 'green' : 'blue'}>
            {isDone ? 'Configurado' : 'Selecionado'}
          </DiexOnboardingBadge>
        ) : null
      }
    >
      <StyledText>
        WhatsApp é opcional. Escolha como a operação receberá os primeiros dados
        e você poderá trocar essa configuração depois.
      </StyledText>

      {onSelectChannel ? (
        <StyledChannelGrid>
          {(
            [
              ['WHATSAPP', 'WhatsApp'],
              ['EMAIL', 'E-mail'],
              ['IMPORT', 'Importar base'],
              ['MANUAL', 'Sem integração'],
            ] as const
          ).map(([key, label]) => (
            <Button
              key={key}
              variant={primaryChannel === key ? 'primary' : 'secondary'}
              title={label}
              disabled={isSavingPreference || isConnecting}
              onClick={() => onSelectChannel(key)}
            />
          ))}
        </StyledChannelGrid>
      ) : null}

      {primaryChannel === 'WHATSAPP' ? (
        <StyledText>
          {isWhatsappTechnicallyConnected && !isDone
            ? 'A conexão técnica foi concluída. Envie uma mensagem real de outro número para validar a entrada antes de avançar.'
            : (connection?.message ??
              'Gere o QR Code somente quando estiver com o celular responsável em mãos.')}
        </StyledText>
      ) : null}

      {primaryChannel === 'WHATSAPP' && errorMessage ? (
        <StyledText>{errorMessage}</StyledText>
      ) : null}

      {primaryChannel === 'WHATSAPP' && connection?.qrCodeDataUri ? (
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

      {primaryChannel === 'WHATSAPP' && isDone && connection?.phone ? (
        <StyledText>Número conectado: {connection.phone}</StyledText>
      ) : null}

      {primaryChannel === 'WHATSAPP' ? (
        <StyledActions>
          <Button
            variant="secondary"
            title={
              isConnecting
                ? 'Preparando conexão...'
                : isDone
                  ? 'Verificar conexão'
                  : isWhatsappTechnicallyConnected
                    ? 'Verificar mensagem real'
                    : 'Gerar QR Code'
            }
            disabled={isConnecting}
            onClick={onRequestConnection}
          />
        </StyledActions>
      ) : primaryChannel === 'EMAIL' ? (
        <>
          <StyledText>
            Conecte uma conta e envie uma mensagem real para validar a entrada.
          </StyledText>
          {onOpenEmail ? (
            <StyledActions>
              <Button
                variant="secondary"
                title="Configurar e-mail"
                onClick={onOpenEmail}
              />
            </StyledActions>
          ) : null}
        </>
      ) : primaryChannel === 'IMPORT' || primaryChannel === 'MANUAL' ? (
        <>
          <StyledText>
            {primaryChannel === 'IMPORT'
              ? 'A primeira prova virá de uma base real importada, sem exigir conexão de mensageria.'
              : 'A operação começará por cadastros manuais, sem exigir WhatsApp ou outro canal conectado.'}
          </StyledText>
          {onOpenRecords ? (
            <StyledActions>
              <Button
                variant="secondary"
                title="Abrir contatos"
                onClick={onOpenRecords}
              />
            </StyledActions>
          ) : null}
        </>
      ) : null}
    </DiexOnboardingStepCard>
  );
};
