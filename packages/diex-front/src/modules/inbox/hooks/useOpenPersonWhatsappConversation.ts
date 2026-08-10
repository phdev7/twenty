import { useCallback } from 'react';

import { AppPath } from 'diex-shared/types';
import { isDefined } from 'diex-shared/utils';

import { getInboxPersonWhatsappConversationRoute } from '@/inbox/constants/INBOX_PERSON_WHATSAPP_CONVERSATION_ROUTE';
import { type ResolvedPersonConversation } from '@/inbox/types/inboxPersonConversationTypes';
import { postInboxAppRoute } from '@/inbox/utils/postInboxAppRoute';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { useNavigateApp } from '~/hooks/useNavigateApp';

// The conversation is resolved server-side because the thread key has to match
// what inbound ingestion builds; the CRM only carries the operator to it.
export const useOpenPersonWhatsappConversation = () => {
  const navigateApp = useNavigateApp();
  const { enqueueErrorSnackBar } = useSnackBar();

  const openPersonWhatsappConversation = useCallback(
    async (personId: string): Promise<void> => {
      let resolution: ResolvedPersonConversation | undefined;

      try {
        resolution = await postInboxAppRoute<ResolvedPersonConversation>(
          getInboxPersonWhatsappConversationRoute(personId),
          {},
        );
      } catch {
        enqueueErrorSnackBar({
          message:
            'Não foi possível abrir a conversa de WhatsApp deste contato.',
        });

        return;
      }

      if (!isDefined(resolution)) {
        enqueueErrorSnackBar({
          message: 'A Inbox não retornou uma conversa para este contato.',
        });

        return;
      }

      if (resolution.status === 'no_phone') {
        enqueueErrorSnackBar({
          message:
            'Este contato não tem telefone cadastrado. Adicione um número antes de enviar WhatsApp.',
        });

        return;
      }

      if (resolution.status === 'person_not_found') {
        enqueueErrorSnackBar({
          message: 'Este contato não foi encontrado nesta workspace.',
        });

        return;
      }

      navigateApp(AppPath.Inbox, undefined, {
        conversationId: resolution.conversationId,
      });
    },
    [enqueueErrorSnackBar, navigateApp],
  );

  return { openPersonWhatsappConversation };
};
