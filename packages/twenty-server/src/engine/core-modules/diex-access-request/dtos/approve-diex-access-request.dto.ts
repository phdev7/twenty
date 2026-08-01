import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ApproveDiexAccessRequestDTO {
  @Field(() => String)
  workspaceUrl: string;

  @Field(() => String)
  subdomain: string;

  @Field(() => Boolean)
  wasInvitationSent: boolean;

  @Field(() => String)
  invitationMessage: string;
}
