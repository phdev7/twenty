import { defineApplication, FieldType } from 'twenty-sdk/define';

export const APPLICATION_UNIVERSAL_IDENTIFIER =
  'd1e00000-0000-4000-8000-000000000001';

export default defineApplication({
  universalIdentifier: APPLICATION_UNIVERSAL_IDENTIFIER,
  displayName: 'Diex CRM',
  description:
    'Inbox comercial, inteligência de receita, IA governada e Customer Success conectados aos dados nativos do CRM.',
  logo: 'public/logomark.svg',
  author: 'Diex',
  category: 'Productivity',
  applicationVariables: {
    EVOLUTION_BASE_URL: {
      universalIdentifier: 'd1e09100-0000-4000-8000-000000000001',
      description:
        'URL HTTPS da Evolution API usada por este workspace. Configure somente pelo painel autenticado.',
      type: FieldType.TEXT,
      isSecret: false,
    },
    EVOLUTION_INSTANCE_NAME: {
      universalIdentifier: 'd1e09100-0000-4000-8000-000000000002',
      description: 'Nome da instância Evolution dedicada a este workspace.',
      type: FieldType.TEXT,
      isSecret: false,
    },
    EVOLUTION_PHONE: {
      universalIdentifier: 'd1e09100-0000-4000-8000-000000000003',
      description:
        'Número conectado em formato E.164 para identificação operacional.',
      type: FieldType.TEXT,
      isSecret: false,
    },
    EVOLUTION_API_KEY: {
      universalIdentifier: 'd1e09100-0000-4000-8000-000000000004',
      description:
        'Credencial da Evolution API. Nunca é disponibilizada aos componentes front-end.',
      type: FieldType.TEXT,
      isSecret: true,
    },
    EVOLUTION_WEBHOOK_SECRET: {
      universalIdentifier: 'd1e09100-0000-4000-8000-000000000005',
      description:
        'Segredo exclusivo para validar e rotear webhooks deste workspace.',
      type: FieldType.TEXT,
      isSecret: true,
    },
    DEFAULT_RESPONSE_SLA_MINUTES: {
      universalIdentifier: 'd1e09100-0000-4000-8000-000000000007',
      description:
        'Prazo padrão, em minutos, para a primeira resposta de uma conversa.',
      type: FieldType.NUMBER,
      value: 60,
      isSecret: false,
    },
  },
  serverVariables: {
    DIEX_EVOLUTION_ALLOWED_ORIGINS: {
      description:
        'Lista de origins Evolution autorizadas pelo operador da infraestrutura, separadas por vírgula. Exemplo: https://evolution.exemplo.com. Nenhum workspace pode acessar uma origin fora desta lista.',
      type: FieldType.TEXT,
      isSecret: false,
      isRequired: false,
    },
    DIEX_EVOLUTION_ALLOW_PRIVATE_NETWORK: {
      description:
        'Permite Evolution em IP privado apenas quando a origin também está na allowlist. Mantenha desativado quando a Evolution possuir endpoint HTTPS público.',
      type: FieldType.BOOLEAN,
      isSecret: false,
      isRequired: false,
    },
    DIEX_EVOLUTION_SERVER_BASE_URL: {
      description:
        'Origem HTTPS da Evolution operada pela infraestrutura. Quando definida junto com a chave e o segredo, cada workspace ganha a própria instância sem que ninguém manuseie credencial.',
      type: FieldType.TEXT,
      isSecret: false,
      isRequired: false,
    },
    DIEX_EVOLUTION_SERVER_API_KEY: {
      description:
        'Chave administrativa da Evolution usada apenas pelo servidor para provisionar instâncias. Nunca chega ao front-end nem ao MCP.',
      type: FieldType.TEXT,
      isSecret: true,
      isRequired: false,
    },
    DIEX_EVOLUTION_SERVER_WEBHOOK_SECRET: {
      description:
        'Segredo raiz do qual o segredo de webhook de cada workspace é derivado. Trocar este valor invalida todos os webhooks de uma vez.',
      type: FieldType.TEXT,
      isSecret: true,
      isRequired: false,
    },
    DIEX_OPENAI_API_KEY: {
      description:
        'Chave da OpenAI usada para transcrever áudios recebidos no WhatsApp. Se ficar vazia, a transcrição usa a OPENAI_API_KEY do servidor; sem nenhuma das duas, o áudio continua na conversa mas não vira texto para a IA.',
      type: FieldType.TEXT,
      isSecret: true,
      isRequired: false,
    },
    DIEX_MIGRATION_API_ENABLED: {
      description:
        'Habilita temporariamente importação autenticada por API key. Mantenha desativado fora da janela controlada de migração.',
      type: FieldType.BOOLEAN,
      isSecret: false,
      isRequired: false,
    },
  },
});
