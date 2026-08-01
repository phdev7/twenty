import {
  type CurrencyMetadata,
  type RichTextMetadata,
} from 'twenty-shared/types';

import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { type EntityRelation } from 'src/engine/workspace-manager/workspace-migration/types/entity-relation.interface';
import { type AiActionWorkspaceEntity } from 'src/modules/ai-governance/standard-objects/ai-action.workspace-entity';
import { type SuccessMilestoneWorkspaceEntity } from 'src/modules/customer-success/standard-objects/success-milestone.workspace-entity';

import { type CustomerRenewalWorkspaceEntity } from 'src/modules/renewal/standard-objects/customer-renewal.workspace-entity';

export class SuccessPlanWorkspaceEntity extends BaseWorkspaceEntity {
  name: string;
  lifecycle: string;
  health: string;
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
}
