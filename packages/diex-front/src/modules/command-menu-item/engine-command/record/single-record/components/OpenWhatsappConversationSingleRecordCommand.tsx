import { isDefined } from 'diex-shared/utils';

import { HeadlessEngineCommandWrapperEffect } from '@/command-menu-item/engine-command/components/HeadlessEngineCommandWrapperEffect';
import { useHeadlessCommandContextApi } from '@/command-menu-item/engine-command/hooks/useHeadlessCommandContextApi';
import { useOpenPersonWhatsappConversation } from '@/inbox/hooks/useOpenPersonWhatsappConversation';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';

export const OpenWhatsappConversationSingleRecordCommand = () => {
  const { selectedRecords } = useHeadlessCommandContextApi();
  const { openPersonWhatsappConversation } =
    useOpenPersonWhatsappConversation();
  const { enqueueErrorSnackBar } = useSnackBar();

  const personId = selectedRecords[0]?.id ?? null;

  const handleExecute = async () => {
    if (!isDefined(personId)) {
      enqueueErrorSnackBar({
        message: 'Selecione um contato para abrir a conversa de WhatsApp.',
      });

      return;
    }

    await openPersonWhatsappConversation(personId);
  };

  return <HeadlessEngineCommandWrapperEffect execute={handleExecute} />;
};
