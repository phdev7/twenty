import {
  type CurrencyMetadata,
  type RichTextMetadata,
} from 'twenty-shared/types';

import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { type EntityRelation } from 'src/engine/workspace-manager/workspace-migration/types/entity-relation.interface';
import { type OpportunityWorkspaceEntity } from 'src/modules/opportunity/standard-objects/opportunity.workspace-entity';

export class OfferWorkspaceEntity extends BaseWorkspaceEntity {
  name: string | null;
  status: string | null;
  category: string | null;
  pricingModel: string | null;
  basePrice: CurrencyMetadata | null;
  valueProposition: RichTextMetadata | null;
  idealCustomerProfile: RichTextMetadata | null;
  differentiators: RichTextMetadata | null;
  objectionPlaybook: RichTextMetadata | null;
  qualificationCriteria: RichTextMetadata | null;
  legacyDiexId: string | null;
  opportunities: EntityRelation<OpportunityWorkspaceEntity[]>;
}
