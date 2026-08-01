import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';

export class InboxTeamWorkspaceEntity extends BaseWorkspaceEntity {
  name: string | null;
  key: string | null;
  description: string | null;
  status: string | null;
  routingStrategy: string | null;
  defaultResponseSlaMinutes: number | null;
  isDefault: boolean | null;
}
