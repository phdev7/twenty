import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';

import { DiexAgencyStatus } from 'src/engine/core-modules/diex-agency/diex-agency.entity';

@InputType('UpdateAgencyStatusInput')
export class UpdateAgencyStatusInput {
  @Field()
  @IsNotEmpty()
  @IsUUID()
  agencyId: string;

  @Field(() => DiexAgencyStatus)
  @IsEnum(DiexAgencyStatus)
  status: DiexAgencyStatus;
}
