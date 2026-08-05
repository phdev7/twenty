import { Field, ObjectType } from '@nestjs/graphql';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

@ObjectType('PendingWorkspaceApproval')
export class PendingWorkspaceApprovalDTO {
  @Field(() => UUIDScalarType)
  workspaceId: string;

  @Field(() => String, { nullable: true })
  displayName: string | null;

  @Field(() => String)
  subdomain: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => String, { nullable: true })
  requesterEmail: string | null;

  @Field(() => String, { nullable: true })
  requesterName: string | null;

  @Field(() => Number)
  memberCount: number;
}
