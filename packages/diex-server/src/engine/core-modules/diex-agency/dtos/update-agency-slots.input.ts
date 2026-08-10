import { Field, InputType } from '@nestjs/graphql';
import { IsInt, IsNotEmpty, IsUUID, Min } from 'class-validator';

@InputType('UpdateAgencySlotsInput')
export class UpdateAgencySlotsInput {
  @Field()
  @IsNotEmpty()
  @IsUUID()
  agencyId: string;

  @Field()
  @IsNotEmpty()
  @IsInt()
  @Min(0)
  workspaceSlotsLimit: number;
}
