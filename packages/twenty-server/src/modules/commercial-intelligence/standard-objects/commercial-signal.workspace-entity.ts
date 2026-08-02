import { type RichTextMetadata } from 'twenty-shared/types';

import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { type EntityRelation } from 'src/engine/workspace-manager/workspace-migration/types/entity-relation.interface';
import { type AiActionWorkspaceEntity } from 'src/modules/ai-governance/standard-objects/ai-action.workspace-entity';
import { type CompanyWorkspaceEntity } from 'src/modules/company/standard-objects/company.workspace-entity';
import { type OpportunityWorkspaceEntity } from 'src/modules/opportunity/standard-objects/opportunity.workspace-entity';
import { type PersonWorkspaceEntity } from 'src/modules/person/standard-objects/person.workspace-entity';

export class CommercialSignalWorkspaceEntity extends BaseWorkspaceEntity {
  name: string | null;
  signalType: string | null;
  source: string | null;
  status: string | null;
  strength: string | null;
  evidence: RichTextMetadata | null;
  recommendedAction: RichTextMetadata | null;
  capturedAt: Date | null;
  validUntil: Date | null;
  confidence: number | null;
  sourceReference: string | null;
  legacyDiexId: string | null;
  aiActions: EntityRelation<AiActionWorkspaceEntity[]>;
  company: EntityRelation<CompanyWorkspaceEntity> | null;
  companyId: string | null;
  opportunity: EntityRelation<OpportunityWorkspaceEntity> | null;
  opportunityId: string | null;
  person: EntityRelation<PersonWorkspaceEntity> | null;
  personId: string | null;
}
