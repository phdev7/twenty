import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType('DiexAdvancedTrafficMetrics')
export class DiexAdvancedTrafficMetricsDTO {
  @Field()
  currentCac: number;

  @Field()
  cacChangePercentage: number;

  @Field()
  currentLtv: number;

  @Field()
  ltvChangePercentage: number;
}

@ObjectType('DiexTrafficSummaryMetrics')
export class DiexTrafficSummaryMetricsDTO {
  @Field()
  totalSpend: number;

  @Field()
  spendChangePercentage: number;

  @Field()
  totalLeads: number;

  @Field()
  leadsChangePercentage: number;

  @Field()
  averageCpl: number;

  @Field()
  cplChangePercentage: number;

  @Field()
  averageRoas: number;

  @Field()
  roasChangePercentage: number;

  @Field()
  activeMetaAdsAccounts: number;

  @Field()
  anomaliesCount: number;

  @Field(() => DiexAdvancedTrafficMetricsDTO, { nullable: true })
  advancedMetrics?: DiexAdvancedTrafficMetricsDTO;
}
