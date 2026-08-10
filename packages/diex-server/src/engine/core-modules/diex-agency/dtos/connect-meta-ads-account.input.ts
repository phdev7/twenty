import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

@InputType('ConnectMetaAdsAccountInput')
export class ConnectMetaAdsAccountInput {
  // Required only for server admins, who have no agency of their own to infer.
  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  agencyId?: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  adAccountId: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  accountName: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  accessToken: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  clientWorkspaceId?: string;
}
