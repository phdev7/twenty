import { useCallback } from 'react';

import {
  type InboxConversation,
  type InboxSavedReply,
} from '@/inbox/types/inboxEntityTypes';
import { type SavedReplyRenderResult } from '@/inbox/types/inboxMacroTypes';
import { renderSavedReplyTemplate } from '@/inbox/utils/renderSavedReplyTemplate';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';

export const useInboxSavedReplyActions = ({
  selectedConversation,
}: {
  selectedConversation: InboxConversation | null;
}) => {
  const { updateOneRecord: updateSavedReply } = useUpdateOneRecord();
  const { enqueueWarningSnackBar } = useSnackBar();

  const applySavedReply = useCallback(
    async (
      savedReply: InboxSavedReply,
    ): Promise<SavedReplyRenderResult | null> => {
      if (selectedConversation === null) {
        return null;
      }

      const renderResult = renderSavedReplyTemplate(
        savedReply.body,
        selectedConversation,
      );
      const usedAt = new Date().toISOString();

      try {
        await updateSavedReply({
          objectNameSingular: 'inboxSavedReply',
          idToUpdate: savedReply.id,
          updateOneRecordInput: {
            usageCount: (savedReply.usageCount ?? 0) + 1,
            lastUsedAt: usedAt,
          },
        });
      } catch {
        enqueueWarningSnackBar({
          message: 'Resposta inserida, mas o uso não pôde ser contabilizado.',
        });
      }

      if (renderResult.unresolvedVariables.length > 0) {
        enqueueWarningSnackBar({
          message: `Complete antes de enviar: ${renderResult.unresolvedVariables
            .map((variable) => `{{${variable}}}`)
            .join(', ')}.`,
        });
      }

      return renderResult;
    },
    [enqueueWarningSnackBar, selectedConversation, updateSavedReply],
  );

  return { applySavedReply };
};
