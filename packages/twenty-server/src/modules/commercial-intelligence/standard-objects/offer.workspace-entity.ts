import {
  type CurrencyMetadata,
  type RichTextMetadata,
} from 'twenty-shared/types';

import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';

export class OfferWorkspaceEntity extends BaseWorkspaceEntity {
  name: string;
  status: string;
  category: string | null;
  pricingModel: string | null;
  basePrice: CurrencyMetadata | null;
  valueProposition: RichTextMetadata | null;
  idealCustomerProfile: RichTextMetadata | null;
  differentiators: RichTextMetadata | null;
  objectionPlaybook: RichTextMetadata | null;
  qualificationCriteria: RichTextMetadata | null;
  legacyDiexId: string | null;
}
