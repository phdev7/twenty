import { Field, InputType } from '@nestjs/graphql';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import {
  MetricUnitType,
  TargetComparisonType,
} from 'src/engine/core-modules/diex-agency/entities/diex-agency-metric-definition.entity';

@InputType('CreateMetricDefinitionInput')
export class CreateMetricDefinitionInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  name: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  code: string;

  @Field(() => MetricUnitType)
  @IsEnum(MetricUnitType)
  unitType: MetricUnitType;

  @Field({ nullable: true, defaultValue: 'BRL' })
  @IsOptional()
  @IsString()
  currencyCode?: string;

  @Field(() => TargetComparisonType, { defaultValue: TargetComparisonType.HIGHER_IS_BETTER })
  @IsOptional()
  @IsEnum(TargetComparisonType)
  targetComparison?: TargetComparisonType;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ defaultValue: true })
  @IsOptional()
  @IsBoolean()
  isVisibleToClient?: boolean;
}
