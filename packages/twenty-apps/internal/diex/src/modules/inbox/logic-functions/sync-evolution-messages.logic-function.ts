import { defineLogicFunction } from 'twenty-sdk/define';

import {
  EVOLUTION_SYNC_CRON_PATTERN,
  EVOLUTION_SYNC_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
} from 'src/modules/inbox/constants/evolution-sync.constants';
import { markBreachedResponseSlas } from 'src/modules/inbox/logic-functions/mark-breached-response-slas';
import { syncEvolutionMessages } from 'src/modules/inbox/logic-functions/sync-evolution-messages';

export default defineLogicFunction({
  universalIdentifier: EVOLUTION_SYNC_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'sync-diex-evolution-messages',
  description:
    'Reconcilia a inbox com o histórico da Evolution, recupera mensagens que o webhook não entregou e marca os SLAs de primeira resposta que venceram.',
  timeoutSeconds: 120,
  // The breach marking rides this cycle because it is the one that already runs
  // every minute, and a failure to mark must not lose the messages it recovered.
  handler: async () => {
    const sync = await syncEvolutionMessages({ transcribeAudios: true });
    const sla = await markBreachedResponseSlas().catch(() => ({ marked: 0 }));

    return { ...sync, slaBreachesMarked: sla.marked };
  },
  cronTriggerSettings: {
    pattern: EVOLUTION_SYNC_CRON_PATTERN,
  },
});
