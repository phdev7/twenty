import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';

export class InboxLabelWorkspaceEntity extends BaseWorkspaceEntity {
  name: string | null;
  slug: string | null;
  color: string | null;
  description: string | null;
  status: string | null;
  usageCount: number | null;
}
