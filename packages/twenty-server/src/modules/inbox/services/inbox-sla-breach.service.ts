import { Injectable } from '@nestjs/common';

import { In, IsNull, LessThanOrEqual } from 'typeorm';

import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { INBOX_SLA_MAX_CONVERSATIONS_PER_RUN } from 'src/modules/inbox/constants/inbox-evolution.constants';
import { InboxConversationWorkspaceEntity } from 'src/modules/inbox/standard-objects/inbox-conversation.workspace-entity';
import { type MarkBreachedResponseSlasResult } from 'src/modules/inbox/types/inbox-evolution.types';

// The deadline was set when the message arrived and the reply never came, but
// nothing ever wrote the breach down: the inbox filter for it matched nothing
// and the copilot read every overdue conversation as still inside its SLA.
@Injectable()
export class InboxSlaBreachService {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {}

  async markBreachedResponseSlas(
    workspaceId: string,
  ): Promise<MarkBreachedResponseSlasResult> {
    const authContext = buildSystemAuthContext(workspaceId);

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const conversationRepository =
          await this.globalWorkspaceOrmManager.getRepository<InboxConversationWorkspaceEntity>(
            workspaceId,
            InboxConversationWorkspaceEntity,
          );
        const breached = await conversationRepository.find({
          where: {
            status: In(['OPEN', 'PENDING']),
            firstRespondedAt: IsNull(),
            slaBreachedAt: IsNull(),
            firstResponseDueAt: LessThanOrEqual(new Date().toISOString()),
          },
          order: { firstResponseDueAt: 'ASC' },
          take: INBOX_SLA_MAX_CONVERSATIONS_PER_RUN,
        });

        await Promise.all(
          breached.map((conversation) =>
            conversationRepository.update(conversation.id, {
              // The moment the promise was broken, not the moment this cycle
              // noticed, so the record does not depend on cron timing.
              slaBreachedAt: conversation.firstResponseDueAt,
            }),
          ),
        );

        return { marked: breached.length };
      },
      authContext,
    );
  }
}
