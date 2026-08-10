import { type ActorMetadata, type CurrencyMetadata } from 'diex-shared/types';

import { BaseWorkspaceEntity } from 'src/engine/diex-orm/base.workspace-entity';
import { type EntityRelation } from 'src/engine/workspace-manager/workspace-migration/types/entity-relation.interface';
import { type AttachmentWorkspaceEntity } from 'src/modules/attachment/standard-objects/attachment.workspace-entity';
import { type AiActionWorkspaceEntity } from 'src/modules/ai-governance/standard-objects/ai-action.workspace-entity';
import { type CompanyWorkspaceEntity } from 'src/modules/company/standard-objects/company.workspace-entity';
import { type CommercialSignalWorkspaceEntity } from 'src/modules/commercial-intelligence/standard-objects/commercial-signal.workspace-entity';
import { type OfferWorkspaceEntity } from 'src/modules/commercial-intelligence/standard-objects/offer.workspace-entity';
import { type SuccessPlanWorkspaceEntity } from 'src/modules/customer-success/standard-objects/success-plan.workspace-entity';
import { type InboxConversationWorkspaceEntity } from 'src/modules/inbox/standard-objects/inbox-conversation.workspace-entity';
import { type NoteTargetWorkspaceEntity } from 'src/modules/note/standard-objects/note-target.workspace-entity';
import { type PersonWorkspaceEntity } from 'src/modules/person/standard-objects/person.workspace-entity';
import { type TaskTargetWorkspaceEntity } from 'src/modules/task/standard-objects/task-target.workspace-entity';
import { type TimelineActivityWorkspaceEntity } from 'src/modules/timeline/standard-objects/timeline-activity.workspace-entity';
import { type WorkspaceMemberWorkspaceEntity } from 'src/modules/workspace-member/standard-objects/workspace-member.workspace-entity';

export class OpportunityWorkspaceEntity extends BaseWorkspaceEntity {
  name: string;
  amount: CurrencyMetadata | null;
  closeDate: Date | null;
  stage: string;
  position: number;
  createdBy: ActorMetadata;
  updatedBy: ActorMetadata;
  pointOfContact: EntityRelation<PersonWorkspaceEntity> | null;
  pointOfContactId: string | null;
  company: EntityRelation<CompanyWorkspaceEntity> | null;
  companyId: string | null;
  taskTargets: EntityRelation<TaskTargetWorkspaceEntity[]>;
  noteTargets: EntityRelation<NoteTargetWorkspaceEntity[]>;
  attachments: EntityRelation<AttachmentWorkspaceEntity[]>;
  timelineActivities: EntityRelation<TimelineActivityWorkspaceEntity[]>;
  owner: EntityRelation<WorkspaceMemberWorkspaceEntity> | null;
  ownerId: string | null;
  /** @deprecated */
  probability: string;
  searchVector: string;
  budgetConfirmed: boolean | null;
  commercialScore: number | null;
  dealRisk: string | null;
  decisionAccessConfirmed: boolean | null;
  legacyDiexId: string | null;
  needConfirmed: boolean | null;
  nextCommercialAction: string | null;
  nextCommercialActionAt: Date | null;
  timingConfirmed: boolean | null;
  diexAiActions: EntityRelation<AiActionWorkspaceEntity[]>;
  diexCommercialSignals: EntityRelation<CommercialSignalWorkspaceEntity[]>;
  diexInboxConversations: EntityRelation<InboxConversationWorkspaceEntity[]>;
  diexOffer: EntityRelation<OfferWorkspaceEntity> | null;
  diexOfferId: string | null;
  diexSuccessPlans: EntityRelation<SuccessPlanWorkspaceEntity[]>;
}
