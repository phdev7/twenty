import { defineLogicFunction } from 'twenty-sdk/define';
import { jsonSchemaToInputSchema } from 'twenty-sdk/logic-function';

import { INBOX_TRIAGE_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/modules/inbox/constants/inbox-ai.constants';
import { triageInboxConversation } from 'src/modules/inbox/logic-functions/triage-inbox-conversation';

const inputSchema = {
  type: 'object' as const,
  properties: {
    conversationId: {
      type: 'string' as const,
      description: 'ID da conversa que será analisada.',
    },
    registerSignal: {
      type: 'boolean' as const,
      description:
        'Registra de forma idempotente o sinal encontrado quando verdadeiro.',
    },
    proposeReply: {
      type: 'boolean' as const,
      description:
        'Coloca o rascunho na fila de aprovação quando verdadeiro; nunca envia.',
    },
  },
  required: ['conversationId'],
};

export default defineLogicFunction({
  universalIdentifier: INBOX_TRIAGE_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'triage-diex-inbox-conversation',
  description:
    'Analisa uma conversa real, registra sinais comerciais idempotentes e opcionalmente propõe uma resposta aguardando aprovação.',
  timeoutSeconds: 60,
  handler: triageInboxConversation,
  toolTriggerSettings: { inputSchema },
  workflowActionTriggerSettings: {
    label: 'Analisar conversa da Inbox Diex',
    inputSchema: jsonSchemaToInputSchema(inputSchema),
    outputSchema: [
      {
        type: 'object',
        properties: {
          conversationId: { type: 'string' },
          summary: { type: 'string' },
          intent: { type: 'string' },
          sentiment: { type: 'string' },
          urgency: { type: 'number' },
          signalType: { type: 'string' },
          signalStrength: { type: 'number' },
          confidence: { type: 'number' },
          evidence: { type: 'string' },
          recommendedAction: { type: 'string' },
          suggestedReply: { type: 'string' },
          commercialSignalId: { type: 'string' },
          aiActionId: { type: 'string' },
          message: { type: 'string' },
        },
      },
    ],
  },
});
