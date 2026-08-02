import { type RichTextMetadata } from 'twenty-shared/types';

import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';

export class DiexWorkspaceContextWorkspaceEntity extends BaseWorkspaceEntity {
  name: string | null;
  status: string | null;
  businessDescription: RichTextMetadata | null;
  idealCustomerProfile: RichTextMetadata | null;
  toneOfVoice: RichTextMetadata | null;
  commercialRules: RichTextMetadata | null;
  objectionPlaybook: RichTextMetadata | null;
  competitiveLandscape: RichTextMetadata | null;
  forbiddenClaims: RichTextMetadata | null;
  reviewedAt: Date | null;
}
