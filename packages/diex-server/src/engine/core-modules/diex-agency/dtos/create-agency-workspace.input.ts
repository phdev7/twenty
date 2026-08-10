import { Field, InputType } from '@nestjs/graphql';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

@InputType('CreateAgencyWorkspaceInput')
export class CreateAgencyWorkspaceInput {
  // Required only for server admins, who have no agency of their own to infer.
  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  agencyId?: string;

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
