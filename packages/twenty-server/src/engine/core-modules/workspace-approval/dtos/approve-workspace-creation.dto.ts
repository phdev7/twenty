import { Field, ObjectType } from '@nestjs/graphql';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

@ObjectType('ApproveWorkspaceCreation')
export class ApproveWorkspaceCreationDTO {
  @Field(() => UUIDScalarType)
  workspaceId: string;

  @Field(() => String)
  subdomain: string;

  @Field(() => String, { nullable: true })
  displayName: string | null;

  @Field(() => String)
  activationStatus: string;
}
