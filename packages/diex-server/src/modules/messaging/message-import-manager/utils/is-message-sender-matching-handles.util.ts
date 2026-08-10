import { MessageParticipantRole } from 'diex-shared/types';
import { isDefined } from 'diex-shared/utils';

import { type MessageWithParticipants } from 'src/modules/messaging/message-import-manager/types/message';

export const isMessageSenderMatchingHandles = (
  message: MessageWithParticipants,
  userHandles: string[],
): boolean => {
  const fromParticipant = message.participants?.find(
    (participant) => participant.role === MessageParticipantRole.FROM,
  );

  if (!isDefined(fromParticipant?.handle)) {
    return false;
  }

  const normalizedUserHandles = userHandles.map((handle) =>
    handle.toLowerCase(),
  );

  return normalizedUserHandles.includes(fromParticipant.handle.toLowerCase());
};
