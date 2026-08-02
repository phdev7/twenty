import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { type EntityRelation } from 'src/engine/workspace-manager/workspace-migration/types/entity-relation.interface';
import { type CustomerRenewalWorkspaceEntity } from 'src/modules/renewal/standard-objects/customer-renewal.workspace-entity';
import { type WorkspaceMemberWorkspaceEntity } from 'src/modules/workspace-member/standard-objects/workspace-member.workspace-entity';

export class CustomerRenewalEventWorkspaceEntity extends BaseWorkspaceEntity {
  name: string | null;
  eventType: string | null;
  summary: string | null;
  occurredAt: Date | null;
  customerRenewal: EntityRelation<CustomerRenewalWorkspaceEntity> | null;
  customerRenewalId: string | null;
  actor: EntityRelation<WorkspaceMemberWorkspaceEntity> | null;
  actorId: string | null;
}
