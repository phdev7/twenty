import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';

import { type EntityRelation } from 'src/engine/workspace-manager/workspace-migration/types/entity-relation.interface';
import { type InboxTeamWorkspaceEntity } from 'src/modules/inbox/standard-objects/inbox-team.workspace-entity';

export class InboxTeamMemberWorkspaceEntity extends BaseWorkspaceEntity {
  name: string | null;
  memberRole: string | null;
  isActive: boolean | null;
  joinedAt: string | null;
  inboxTeam: EntityRelation<InboxTeamWorkspaceEntity> | null;
  inboxTeamId: string | null;
}
