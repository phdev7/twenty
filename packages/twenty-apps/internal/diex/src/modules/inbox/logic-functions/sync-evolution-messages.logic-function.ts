import { defineLogicFunction } from 'twenty-sdk/define';

import {
  EVOLUTION_SYNC_CRON_PATTERN,
  EVOLUTION_SYNC_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
} from 'src/modules/inbox/constants/evolution-sync.constants';
import { syncEvolutionMessages } from 'src/modules/inbox/logic-functions/sync-evolution-messages';

export default defineLogicFunction({
  universalIdentifier: EVOLUTION_SYNC_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'sync-diex-evolution-messages',
  description:
    'Reconcilia a inbox com o histórico da Evolution e recupera mensagens que o webhook não entregou.',
  timeoutSeconds: 120,
  handler: () => syncEvolutionMessages({ transcribeAudios: true }),
  cronTriggerSettings: {
    pattern: EVOLUTION_SYNC_CRON_PATTERN,
  },
});
