import { type RichTextMetadata } from 'twenty-shared/types';

import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { type EntityRelation } from 'src/engine/workspace-manager/workspace-migration/types/entity-relation.interface';
import { type CommercialSignalWorkspaceEntity } from 'src/modules/commercial-intelligence/standard-objects/commercial-signal.workspace-entity';
import { type SuccessPlanWorkspaceEntity } from 'src/modules/customer-success/standard-objects/success-plan.workspace-entity';
import { type InboxConversationWorkspaceEntity } from 'src/modules/inbox/standard-objects/inbox-conversation.workspace-entity';
import { type OpportunityWorkspaceEntity } from 'src/modules/opportunity/standard-objects/opportunity.workspace-entity';
import { type CustomerRenewalWorkspaceEntity } from 'src/modules/renewal/standard-objects/customer-renewal.workspace-entity';
import { type TaskWorkspaceEntity } from 'src/modules/task/standard-objects/task.workspace-entity';
import { type WorkspaceMemberWorkspaceEntity } from 'src/modules/workspace-member/standard-objects/workspace-member.workspace-entity';

export class AiActionWorkspaceEntity extends BaseWorkspaceEntity {
  name: string | null;
  actionType: string | null;
  status: string | null;
  confidence: number | null;
  rationale: RichTextMetadata | null;
  proposedAction: RichTextMetadata | null;
  approvalNotes: RichTextMetadata | null;
  requestedAt: Date | null;
  approvedAt: Date | null;
  executedAt: Date | null;
  executionReceipt: RichTextMetadata | null;
  requiresApproval: boolean | null;
  idempotencyKey: string | null;
  commercialSignal: EntityRelation<CommercialSignalWorkspaceEntity> | null;
  commercialSignalId: string | null;
  customerRenewal: EntityRelation<CustomerRenewalWorkspaceEntity> | null;
  customerRenewalId: string | null;
  successPlan: EntityRelation<SuccessPlanWorkspaceEntity> | null;
  successPlanId: string | null;
  inboxConversation: EntityRelation<InboxConversationWorkspaceEntity> | null;
  inboxConversationId: string | null;
  executionTask: EntityRelation<TaskWorkspaceEntity> | null;
  executionTaskId: string | null;
  executor: EntityRelation<WorkspaceMemberWorkspaceEntity> | null;
  executorId: string | null;
  opportunity: EntityRelation<OpportunityWorkspaceEntity> | null;
  opportunityId: string | null;
  reviewer: EntityRelation<WorkspaceMemberWorkspaceEntity> | null;
  reviewerId: string | null;
}
