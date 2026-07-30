// Whisper is reached directly because the platform has no transcription service
// to reuse: the only transcript it knows about comes from the call recording
// provider. The key is a server variable, so no workspace admin handles it.
const OPENAI_TRANSCRIPTION_URL =
  'https://api.openai.com/v1/audio/transcriptions';

const TRANSCRIPTION_MODEL = 'whisper-1';

// Whisper's own request ceiling is 25 MB. Anything near it is not a voice note
// and is not worth the wait inside a reconciliation cycle.
const MAX_AUDIO_BYTES = 8_000_000;

export type TranscriptionOutcome =
  | { status: 'DONE'; text: string }
  | { status: 'UNAVAILABLE'; reason: string }
  | { status: 'FAILED'; reason: string };

// The dedicated variable wins so transcription can be pointed at its own key
// or budget, but a workspace that already gave the CRM an OpenAI key should not
// have to paste it twice to get audio turned into text.
export const readOpenAiApiKey = (): string | null => {
  for (const name of ['DIEX_OPENAI_API_KEY', 'OPENAI_API_KEY']) {
    const key = process.env[name]?.trim();

    if (key !== undefined && key.length > 0) {
      return key;
    }
  }

  return null;
};

const base64ToBlobPart = (base64: string): ArrayBuffer => {
  const binary = Buffer.from(base64, 'base64');
  const bytes = new ArrayBuffer(binary.byteLength);

  new Uint8Array(bytes).set(binary);

  return bytes;
};

const readFileExtension = (mimeType: string): string => {
  const normalized = mimeType.toLowerCase();

  if (normalized.includes('ogg')) {
    return 'ogg';
  }

  if (normalized.includes('mpeg') || normalized.includes('mp3')) {
    return 'mp3';
  }

  if (normalized.includes('mp4') || normalized.includes('m4a')) {
    return 'm4a';
  }

  if (normalized.includes('wav')) {
    return 'wav';
  }

  return 'ogg';
};

// A missing key is not a failure to retry: it is a capability the operator has
// not turned on. Saying so separately keeps the inbox from calling out every
// six seconds for an audio that can never be transcribed.
export const transcribeAudio = async ({
  base64,
  mimeType,
}: {
  base64: string;
  mimeType: string;
}): Promise<TranscriptionOutcome> => {
  const apiKey = readOpenAiApiKey();

  if (!apiKey) {
    return {
      status: 'UNAVAILABLE',
      reason:
        'Nenhuma chave da OpenAI configurada no servidor (DIEX_OPENAI_API_KEY ou OPENAI_API_KEY), então áudios não podem ser transcritos.',
    };
  }

  const audio = base64ToBlobPart(base64);

  // Failed rather than unavailable: the size belongs to this audio and will not
  // change, so the queue must not keep coming back to it.
  if (audio.byteLength > MAX_AUDIO_BYTES) {
    return {
      status: 'FAILED',
      reason: 'Áudio maior do que o limite de transcrição.',
    };
  }

  const form = new FormData();

  form.append('model', TRANSCRIPTION_MODEL);
  form.append('response_format', 'text');
  // Portuguese is the operating language of this inbox; stating it keeps Whisper
  // from guessing a language on short, noisy voice notes.
  form.append('language', 'pt');
  form.append(
    'file',
    new Blob([audio], { type: mimeType }),
    `audio.${readFileExtension(mimeType)}`,
  );

  let response: Response;

  try {
    response = await fetch(OPENAI_TRANSCRIPTION_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
      redirect: 'error',
    });
  } catch (error) {
    return {
      status: 'FAILED',
      reason: `A OpenAI não pôde ser alcançada: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => '');

    return {
      // An invalid key or an exhausted quota will not fix itself on the next
      // cycle, so it is reported as unavailable rather than retried forever.
      status:
        response.status === 401 || response.status === 429
          ? 'UNAVAILABLE'
          : 'FAILED',
      reason:
        `A OpenAI recusou a transcrição (HTTP ${response.status}) ${detail.slice(0, 160)}`.trim(),
    };
  }

  const text = (await response.text()).trim();

  return text.length > 0
    ? { status: 'DONE', text }
    : {
        status: 'UNAVAILABLE',
        reason: 'A OpenAI devolveu uma transcrição vazia.',
      };
};
