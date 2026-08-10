import { Injectable, Logger } from '@nestjs/common';

import { isDefined } from 'diex-shared/utils';

import { GlobalWorkspaceOrmManager } from 'src/engine/diex-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/diex-orm/utils/build-system-auth-context.util';
import { EvolutionProvisioningService } from 'src/modules/inbox/services/evolution-provisioning.service';
import { InboxConversationWorkspaceEntity } from 'src/modules/inbox/standard-objects/inbox-conversation.workspace-entity';
import { PersonWorkspaceEntity } from 'src/modules/person/standard-objects/person.workspace-entity';
import { normalizePhone } from 'src/modules/inbox/utils/evolution-payload.util';

// Inbound ingestion keys threads as `${instanceName}:${remoteJid}`. Opening a
// conversation from a person record has to derive the exact same key, or the
// first reply from the contact would land on a second, parallel thread.
const PERSON_JID_SUFFIX = '@s.whatsapp.net';

export type ResolvedPersonConversation =
  | { status: 'resolved'; conversationId: string; created: boolean }
  | { status: 'no_phone' }
  | { status: 'person_not_found' };

@Injectable()
export class InboxPersonConversationService {
  private readonly logger = new Logger(InboxPersonConversationService.name);

  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    private readonly evolutionProvisioningService: EvolutionProvisioningService,
  ) {}

  async resolveConversationForPerson({
    workspaceId,
    personId,
  }: {
    workspaceId: string;
    personId: string;
  }): Promise<ResolvedPersonConversation> {
    const authContext = buildSystemAuthContext(workspaceId);

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const personRepository =
          await this.globalWorkspaceOrmManager.getRepository<PersonWorkspaceEntity>(
            workspaceId,
            PersonWorkspaceEntity,
            { shouldBypassPermissionChecks: true },
          );
        const person = await personRepository.findOne({
          where: { id: personId },
        });

        if (!isDefined(person)) {
          return { status: 'person_not_found' as const };
        }

        const normalizedPhone = this.readNormalizedPhone(person);

        if (normalizedPhone === null) {
          return { status: 'no_phone' as const };
        }

        const { instanceName } =
          await this.evolutionProvisioningService.resolveProvisioning(
            workspaceId,
          );
        const remoteJid = `${normalizedPhone}${PERSON_JID_SUFFIX}`;
        const providerThreadKey = `${instanceName}:${remoteJid}`;

        const conversationRepository =
          await this.globalWorkspaceOrmManager.getRepository<InboxConversationWorkspaceEntity>(
            workspaceId,
            InboxConversationWorkspaceEntity,
            { shouldBypassPermissionChecks: true },
          );
        const existing = await conversationRepository.findOne({
          where: { providerThreadKey },
        });

        if (isDefined(existing)) {
          // An inbound thread may predate the contact record, so link it now
          // rather than leaving the conversation orphaned from the person.
          if (existing.personId !== person.id) {
            await conversationRepository.update(existing.id, {
              personId: person.id,
              companyId: existing.companyId ?? person.companyId,
            });
          }

          return {
            status: 'resolved' as const,
            conversationId: existing.id,
            created: false,
          };
        }

        const created = await conversationRepository.save({
          name: this.buildConversationName(person, normalizedPhone),
          providerThreadKey,
          channel: 'WHATSAPP',
          provider: 'EVOLUTION',
          status: 'OPEN',
          contactHandle: normalizedPhone,
          unreadCount: 0,
          personId: person.id,
          companyId: person.companyId,
        });

        this.logger.log(
          `Opened WhatsApp conversation ${created.id} for person ${person.id}`,
        );

        return {
          status: 'resolved' as const,
          conversationId: created.id,
          created: true,
        };
      },
      authContext,
    );
  }

  private readNormalizedPhone(person: PersonWorkspaceEntity): string | null {
    const candidates = [
      person.whatsappNormalizedPhone,
      person.phones?.primaryPhoneCallingCode !== undefined
        ? `${person.phones.primaryPhoneCallingCode ?? ''}${person.phones.primaryPhoneNumber ?? ''}`
        : null,
      person.phones?.primaryPhoneNumber ?? null,
    ];

    for (const candidate of candidates) {
      const normalized = normalizePhone(candidate ?? undefined);

      if (normalized !== null) {
        return normalized;
      }
    }

    return null;
  }

  private buildConversationName(
    person: PersonWorkspaceEntity,
    normalizedPhone: string,
  ): string {
    const firstName = person.name?.firstName?.trim() ?? '';
    const lastName = person.name?.lastName?.trim() ?? '';
    const fullName = `${firstName} ${lastName}`.trim();

    return fullName.length > 0 ? fullName : normalizedPhone;
  }
}
