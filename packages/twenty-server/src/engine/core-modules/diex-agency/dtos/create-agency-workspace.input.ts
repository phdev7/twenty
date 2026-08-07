import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

@InputType('CreateAgencyWorkspaceInput')
export class CreateAgencyWorkspaceInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  clientCompanyName: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  subdomain: string;

  @Field()
  @IsNotEmpty()
  @IsEmail()
  clientAdminEmail: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  operationDescription?: string;
}
