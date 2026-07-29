import { defineLogicFunction } from 'twenty-sdk/define';

import { PROCESS_EVOLUTION_WEBHOOK_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/modules/inbox/constants/evolution.constants';
import { processEvolutionWebhookHandler } from 'src/modules/inbox/logic-functions/process-evolution-webhook';

export default defineLogicFunction({
  universalIdentifier:
    PROCESS_EVOLUTION_WEBHOOK_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'process-diex-evolution-webhook',
  description:
    'Creates idempotent inbox conversations and messages, links CRM context and updates delivery status inside the resolved workspace.',
  timeoutSeconds: 60,
  handler: processEvolutionWebhookHandler,
});
