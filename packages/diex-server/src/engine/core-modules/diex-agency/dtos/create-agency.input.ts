import { Field, InputType } from '@nestjs/graphql';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

@InputType('CreateAgencyInput')
export class CreateAgencyInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  name: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  slug: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  ownerUserEmail: string;

  @Field({ nullable: true, defaultValue: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  workspaceSlotsLimit?: number;
}
