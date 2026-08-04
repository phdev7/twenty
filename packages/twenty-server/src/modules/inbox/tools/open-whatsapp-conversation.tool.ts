import { z } from 'zod';

import { type InboxPersonConversationService } from 'src/modules/inbox/services/inbox-person-conversation.service';

const schema = z.object({ personId: z.string().uuid() });

export const createOpenWhatsappConversationTool = (
  inboxPersonConversationService: InboxPersonConversationService,
  workspaceId: string,
) => ({
  name: 'open_diex_whatsapp_conversation' as const,
  description:
    'Abre (ou reaproveita) a conversa de WhatsApp de uma pessoa e devolve o id da conversa no inbox comercial. Não envia mensagem nenhuma: apenas garante que a thread existe para alguém escrever nela.',
  inputSchema: schema,
  execute: async (parameters: z.infer<typeof schema>) => {
    const result =
      await inboxPersonConversationService.resolveConversationForPerson({
        workspaceId,
        personId: parameters.personId,
      });

    if (result.status === 'person_not_found') {
      return { opened: false, reason: 'Pessoa não encontrada.' };
    }

    if (result.status === 'no_phone') {
      return {
        opened: false,
        reason:
          'A pessoa não tem telefone utilizável. Um número precisa ser preenchido antes de abrir a conversa.',
      };
    }

    return {
      opened: true,
      conversationId: result.conversationId,
      created: result.created,
      inboxUrl: `/inbox?conversationId=${result.conversationId}`,
    };
  },
});
