import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class RetryDiexAccessRequestInvitationDTO {
  @Field(() => Boolean)
  invitationReady: boolean;

  @Field(() => String)
  message: string;
}
