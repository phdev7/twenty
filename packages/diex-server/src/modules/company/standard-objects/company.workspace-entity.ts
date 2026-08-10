import {
  type ActorMetadata,
  type AddressMetadata,
  type CurrencyMetadata,
  type LinksMetadata,
} from 'diex-shared/types';

import { type EntityRelation } from 'src/engine/workspace-manager/workspace-migration/types/entity-relation.interface';
import { type AttachmentWorkspaceEntity } from 'src/modules/attachment/standard-objects/attachment.workspace-entity';
import { type CommercialSignalWorkspaceEntity } from 'src/modules/commercial-intelligence/standard-objects/commercial-signal.workspace-entity';
import { type SuccessPlanWorkspaceEntity } from 'src/modules/customer-success/standard-objects/success-plan.workspace-entity';
import { type InboxConversationWorkspaceEntity } from 'src/modules/inbox/standard-objects/inbox-conversation.workspace-entity';
import { type NoteTargetWorkspaceEntity } from 'src/modules/note/standard-objects/note-target.workspace-entity';
import { type OpportunityWorkspaceEntity } from 'src/modules/opportunity/standard-objects/opportunity.workspace-entity';
import { type PersonWorkspaceEntity } from 'src/modules/person/standard-objects/person.workspace-entity';
import { type CustomerRenewalWorkspaceEntity } from 'src/modules/renewal/standard-objects/customer-renewal.workspace-entity';
import { type TaskTargetWorkspaceEntity } from 'src/modules/task/standard-objects/task-target.workspace-entity';
import { type TimelineActivityWorkspaceEntity } from 'src/modules/timeline/standard-objects/timeline-activity.workspace-entity';
import { type WorkspaceMemberWorkspaceEntity } from 'src/modules/workspace-member/standard-objects/workspace-member.workspace-entity';

export class CompanyWorkspaceEntity {
  // Base fields
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;

  // Company-specific fields
  name: string | null;
  domainName: LinksMetadata;
  linkedinLink: LinksMetadata | null;
  annualRevenue: CurrencyMetadata | null;
  address: AddressMetadata;
  position: number;
  createdBy: ActorMetadata;
  updatedBy: ActorMetadata;
  /** @deprecated Use `address` field instead */
  addressOld: string | null;
  searchVector: string;
  diexAnnualRevenueRange: string | null;
  diexBadges: string[] | null;
  diexEmployeeRange: string | null;
  diexLifecycle: string | null;
  diexNiche: string | null;
  diexSegment: string | null;
  icpFit: string | null;
  legacyDiexId: string | null;

  // Relations
  people: EntityRelation<PersonWorkspaceEntity[]>;
  accountOwner: EntityRelation<WorkspaceMemberWorkspaceEntity> | null;
  accountOwnerId: string | null;
  taskTargets: EntityRelation<TaskTargetWorkspaceEntity[]>;
  noteTargets: EntityRelation<NoteTargetWorkspaceEntity[]>;
  opportunities: EntityRelation<OpportunityWorkspaceEntity[]>;
  attachments: EntityRelation<AttachmentWorkspaceEntity[]>;
  timelineActivities: EntityRelation<TimelineActivityWorkspaceEntity[]>;
  diexCommercialSignals: EntityRelation<CommercialSignalWorkspaceEntity[]>;
  diexCustomerRenewals: EntityRelation<CustomerRenewalWorkspaceEntity[]>;
  diexInboxConversations: EntityRelation<InboxConversationWorkspaceEntity[]>;
  diexSuccessPlans: EntityRelation<SuccessPlanWorkspaceEntity[]>;
}
