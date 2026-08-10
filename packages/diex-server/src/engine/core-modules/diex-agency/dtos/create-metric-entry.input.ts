import { Field, InputType } from '@nestjs/graphql';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

import { MetricSourceType } from 'src/engine/core-modules/diex-agency/entities/diex-agency-metric-entry.entity';

@InputType('CreateMetricEntryInput')
export class CreateMetricEntryInput {
  @Field()
  @IsNotEmpty()
  @IsUUID()
  metricDefinitionId: string;

  @Field()
  @IsNotEmpty()
  @IsUUID()
  clientWorkspaceId: string;

  @Field()
  @IsNotEmpty()
  periodStart: Date;

  @Field()
  @IsNotEmpty()
  periodEnd: Date;

  @Field()
  @IsNotEmpty()
  @IsNumber()
  value: number;

  @Field(() => MetricSourceType, { defaultValue: MetricSourceType.MANUAL })
  @IsOptional()
  @IsEnum(MetricSourceType)
  source?: MetricSourceType;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;
}
