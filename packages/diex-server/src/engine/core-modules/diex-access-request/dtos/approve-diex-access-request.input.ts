import { Field, InputType } from '@nestjs/graphql';

import {
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

@InputType()
export class ApproveDiexAccessRequestInput {
  @Field(() => String)
  @IsUUID()
  requestId: string;

  @Field(() => String)
  @IsString()
  @MinLength(3)
  @MaxLength(63)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  subdomain: string;
}
