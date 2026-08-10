import { Field, InputType } from '@nestjs/graphql';

import { IsUUID } from 'class-validator';

@InputType()
export class RetryDiexAccessRequestInvitationInput {
  @Field(() => String)
  @IsUUID()
  requestId: string;
}
