import { styled } from '@linaria/react';
import { IconPaperclip } from 'diex-ui/icon';
import { themeCssVariables } from 'diex-ui/theme-constants';

import { type EvolutionMediaPayload } from '@/inbox/types/inboxExternalMessageTypes';

const mediaButtonStyle = `
  align-items: center;
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.secondary};
  cursor: pointer;
  display: inline-flex;
  font-family: ${themeCssVariables.font.family};
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.medium};
  gap: ${themeCssVariables.spacing[1]};
  margin-top: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[1]} ${themeCssVariables.spacing[2]};
  text-decoration: none;
`;

const StyledMediaButton = styled.button`
  ${mediaButtonStyle}
`;

const StyledMediaDownloadLink = styled.a`
  ${mediaButtonStyle}
`;

const StyledMediaLoading = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
  margin-top: ${themeCssVariables.spacing[2]};
`;

const mediaImageStyle = `
  border-radius: ${themeCssVariables.border.radius.sm};
  display: block;
  margin-top: ${themeCssVariables.spacing[2]};
  max-height: 320px;
  max-width: 100%;
  object-fit: contain;
`;

const StyledMediaImage = styled.img`
  ${mediaImageStyle}
`;

const StyledMediaVideo = styled.video`
  ${mediaImageStyle}
`;

const StyledMediaPlayer = styled.audio`
  display: block;
  margin-top: ${themeCssVariables.spacing[2]};
  max-width: 100%;
  width: 260px;
`;

const StyledTranscription = styled.p`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.xs};
  font-style: italic;
  line-height: 1.45;
  margin: ${themeCssVariables.spacing[2]} 0 0;
`;

const StyledTranscriptionPending = styled.p`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xxs};
  margin: ${themeCssVariables.spacing[2]} 0 0;
`;

const MEDIA_ACTION_LABELS: Record<string, string> = {
  IMAGE: 'Ver imagem',
  AUDIO: 'Ouvir áudio',
  VIDEO: 'Ver vídeo',
  DOCUMENT: 'Abrir documento',
};

export const InboxMessageTranscription = ({
  transcription,
  status,
}: {
  transcription?: string | null;
  status?: string | null;
}) => {
  if (transcription) {
    return <StyledTranscription>{transcription}</StyledTranscription>;
  }

  if (status === 'UNAVAILABLE') {
    return (
      <StyledTranscriptionPending>
        Transcrição de áudio não está ativada neste servidor.
      </StyledTranscriptionPending>
    );
  }

  if (status === 'FAILED') {
    return (
      <StyledTranscriptionPending>
        Não foi possível transcrever este áudio.
      </StyledTranscriptionPending>
    );
  }

  return (
    <StyledTranscriptionPending>
      Transcrevendo áudio...
    </StyledTranscriptionPending>
  );
};

// Audio and images render in place once loaded, because asking an operator to
// leave the conversation to hear a voice note is what made media unusable here.
export const InboxMessageMedia = ({
  media,
  messageType,
  onLoad,
}: {
  media: EvolutionMediaPayload | 'loading' | undefined;
  messageType: string;
  onLoad: () => void;
}) => {
  if (media === undefined) {
    return (
      <StyledMediaButton type="button" onClick={onLoad}>
        <IconPaperclip
          size={themeCssVariables.icon.size.sm}
          stroke={themeCssVariables.icon.stroke.md}
        />
        {MEDIA_ACTION_LABELS[messageType] ?? 'Carregar mídia'}
      </StyledMediaButton>
    );
  }

  if (media === 'loading') {
    return <StyledMediaLoading>Carregando mídia...</StyledMediaLoading>;
  }

  if (messageType === 'IMAGE') {
    return <StyledMediaImage src={media.dataUri} alt="" />;
  }

  if (messageType === 'AUDIO') {
    return <StyledMediaPlayer controls src={media.dataUri} />;
  }

  if (messageType === 'VIDEO') {
    return <StyledMediaVideo controls src={media.dataUri} />;
  }

  return (
    <StyledMediaDownloadLink
      href={media.dataUri}
      download={media.fileName ?? 'documento'}
    >
      <IconPaperclip
        size={themeCssVariables.icon.size.sm}
        stroke={themeCssVariables.icon.stroke.md}
      />
      Baixar {media.fileName ?? 'documento'}
    </StyledMediaDownloadLink>
  );
};
