import {
  type CurrencyMetadata,
  type RichTextMetadata,
} from 'twenty-shared/types';

import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { type EntityRelation } from 'src/engine/workspace-manager/workspace-migration/types/entity-relation.interface';
import { type AiActionWorkspaceEntity } from 'src/modules/ai-governance/standard-objects/ai-action.workspace-entity';
import { type CompanyWorkspaceEntity } from 'src/modules/company/standard-objects/company.workspace-entity';
import { type SuccessMilestoneWorkspaceEntity } from 'src/modules/customer-success/standard-objects/success-milestone.workspace-entity';
import { type OpportunityWorkspaceEntity } from 'src/modules/opportunity/standard-objects/opportunity.workspace-entity';
import { type PersonWorkspaceEntity } from 'src/modules/person/standard-objects/person.workspace-entity';
import { type TaskWorkspaceEntity } from 'src/modules/task/standard-objects/task.workspace-entity';
import { type WorkspaceMemberWorkspaceEntity } from 'src/modules/workspace-member/standard-objects/workspace-member.workspace-entity';

import { type CustomerRenewalWorkspaceEntity } from 'src/modules/renewal/standard-objects/customer-renewal.workspace-entity';

export class SuccessPlanWorkspaceEntity extends BaseWorkspaceEntity {
  name: string | null;
  lifecycle: string | null;
  health: string | null;
  healthScore: number | null;
  activeUseRating: string | null;
  valueEvidenceRating: string | null;
  expansionSignal: boolean | null;
  recurringRevenue: CurrencyMetadata | null;
  startDate: Date | null;
  renewalDate: Date | null;
  nextReviewAt: Date | null;
  objectives: RichTextMetadata | null;
  successCriteria: RichTextMetadata | null;
  risks: RichTextMetadata | null;
  executiveSummary: RichTextMetadata | null;
  legacyDiexId: string | null;
  milestones: EntityRelation<SuccessMilestoneWorkspaceEntity[]>;
  aiActions: EntityRelation<AiActionWorkspaceEntity[]>;
  customerRenewals: EntityRelation<CustomerRenewalWorkspaceEntity[]>;
  company: EntityRelation<CompanyWorkspaceEntity> | null;
  companyId: string | null;
  operationalTasks: EntityRelation<TaskWorkspaceEntity[]>;
  opportunity: EntityRelation<OpportunityWorkspaceEntity> | null;
  opportunityId: string | null;
  owner: EntityRelation<WorkspaceMemberWorkspaceEntity> | null;
  ownerId: string | null;
  primaryContact: EntityRelation<PersonWorkspaceEntity> | null;
  primaryContactId: string | null;
}
