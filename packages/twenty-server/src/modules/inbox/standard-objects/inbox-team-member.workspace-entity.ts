import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';

export class InboxTeamMemberWorkspaceEntity extends BaseWorkspaceEntity {
  name: string | null;
  memberRole: string | null;
  isActive: boolean | null;
  joinedAt: string | null;
}
