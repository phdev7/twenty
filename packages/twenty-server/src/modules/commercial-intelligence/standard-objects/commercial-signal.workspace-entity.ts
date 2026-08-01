import { type RichTextMetadata } from 'twenty-shared/types';

import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { type EntityRelation } from 'src/engine/workspace-manager/workspace-migration/types/entity-relation.interface';
import { type AiActionWorkspaceEntity } from 'src/modules/ai-governance/standard-objects/ai-action.workspace-entity';

export class CommercialSignalWorkspaceEntity extends BaseWorkspaceEntity {
  name: string;
  signalType: string;
  source: string;
  status: string;
  strength: string | null;
  evidence: RichTextMetadata | null;
  recommendedAction: RichTextMetadata | null;
  capturedAt: Date | null;
  validUntil: Date | null;
  confidence: number | null;
  sourceReference: string | null;
  legacyDiexId: string | null;
  aiActions: EntityRelation<AiActionWorkspaceEntity[]>;
}
