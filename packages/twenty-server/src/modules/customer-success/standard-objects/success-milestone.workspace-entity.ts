import { type RichTextMetadata } from 'twenty-shared/types';

import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { type EntityRelation } from 'src/engine/workspace-manager/workspace-migration/types/entity-relation.interface';
import { type SuccessPlanWorkspaceEntity } from 'src/modules/customer-success/standard-objects/success-plan.workspace-entity';

export class SuccessMilestoneWorkspaceEntity extends BaseWorkspaceEntity {
  name: string | null;
  category: string | null;
  status: string | null;
  dueAt: Date | null;
  completedAt: Date | null;
  outcome: RichTextMetadata | null;
  evidence: RichTextMetadata | null;
  impact: string | null;
  legacyDiexId: string | null;
  successPlan: EntityRelation<SuccessPlanWorkspaceEntity> | null;
  successPlanId: string | null;
}
