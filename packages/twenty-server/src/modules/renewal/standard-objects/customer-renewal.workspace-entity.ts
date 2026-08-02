import {
  type CurrencyMetadata,
  type RichTextMetadata,
} from 'twenty-shared/types';

import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { type EntityRelation } from 'src/engine/workspace-manager/workspace-migration/types/entity-relation.interface';
import { type AiActionWorkspaceEntity } from 'src/modules/ai-governance/standard-objects/ai-action.workspace-entity';
import { type CompanyWorkspaceEntity } from 'src/modules/company/standard-objects/company.workspace-entity';
import { type CustomerRenewalEventWorkspaceEntity } from 'src/modules/renewal/standard-objects/customer-renewal-event.workspace-entity';

import { type SuccessPlanWorkspaceEntity } from 'src/modules/customer-success/standard-objects/success-plan.workspace-entity';
import { type WorkspaceMemberWorkspaceEntity } from 'src/modules/workspace-member/standard-objects/workspace-member.workspace-entity';

export class CustomerRenewalWorkspaceEntity extends BaseWorkspaceEntity {
  name: string | null;
  stage: string | null;
  risk: string | null;
  forecast: string | null;
  renewalValue: CurrencyMetadata | null;
  probability: number | null;
  targetDate: Date | null;
  nextAction: string | null;
  nextActionAt: Date | null;
  lastTouchAt: Date | null;
  riskReason: RichTextMetadata | null;
  valueEvidence: RichTextMetadata | null;
  commercialTerms: RichTextMetadata | null;
  outcome: RichTextMetadata | null;
  closedAt: Date | null;
  legacyDiexId: string | null;
  renewalEvents: EntityRelation<CustomerRenewalEventWorkspaceEntity[]>;
  aiActions: EntityRelation<AiActionWorkspaceEntity[]>;
  successPlan: EntityRelation<SuccessPlanWorkspaceEntity> | null;
  successPlanId: string | null;
  company: EntityRelation<CompanyWorkspaceEntity> | null;
  companyId: string | null;
  owner: EntityRelation<WorkspaceMemberWorkspaceEntity> | null;
  ownerId: string | null;
}
