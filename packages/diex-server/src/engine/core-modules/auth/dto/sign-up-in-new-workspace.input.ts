import { Field, InputType } from '@nestjs/graphql';

import {
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

@InputType()
export class SignUpInNewWorkspaceInput {
  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  displayName?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  subdomain?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  @ValidateIf(
    (_, value: unknown) => typeof value === 'string' && value.trim().length > 0,
  )
  @Matches(/^\+?[0-9 ()-]{10,25}$/)
  @MaxLength(40)
  whatsapp?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  @IsIn(['WHATSAPP', 'EMAIL', 'IMPORT', 'MANUAL', 'LATER'])
  primaryChannel?: string;

  @Field(() => String)
  @IsString()
  @MinLength(10)
  @MaxLength(2_000)
  companyDescription: string;

  @Field(() => String)
  @IsString()
  @MinLength(5)
  @MaxLength(2_000)
  idealCustomerProfile: string;

  @Field(() => String)
  @IsString()
  @MinLength(3)
  @MaxLength(1_000)
  toneOfVoice: string;

  @Field(() => String)
  @IsString()
  @IsIn([
    'SELL_MORE',
    'RESPOND_FASTER',
    'ORGANIZE_WHATSAPP',
    'CONTROL_FOLLOWUPS',
    'CUSTOMER_SUCCESS_RENEWALS',
  ])
  @MinLength(5)
  @MaxLength(2_000)
  primaryGoal: string;

  @Field(() => String)
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  companySize: string;

  @Field(() => String)
  @IsString()
  @MinLength(5)
  @MaxLength(2_000)
  currentProcess: string;
}
