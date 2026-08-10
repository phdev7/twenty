import { useCallback } from 'react';

import { EVOLUTION_SYNC_ROUTE } from '@/inbox/constants/EVOLUTION_SYNC_ROUTE';
import { postInboxAppRoute } from '@/inbox/utils/postInboxAppRoute';

// Provider reconciliation runs before the read so a message that arrived
// since the last tick is already stored by the time this tick queries. A
// failure here must not stop the refresh: the scheduled job is the fallback,
// and stale data beats no data.
export const usePullInboxProviderMessages = () =>
  useCallback(async (): Promise<void> => {
    try {
      await postInboxAppRoute(EVOLUTION_SYNC_ROUTE, {});
    } catch {
      // Intentionally silent: this is opportunistic, and the cron job covers it.
    }
  }, []);
