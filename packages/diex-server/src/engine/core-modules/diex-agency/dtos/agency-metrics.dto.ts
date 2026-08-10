import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType('DiexAgencyMetrics')
export class DiexAgencyMetricsDTO {
  @Field()
  totalAgencies: number;

  @Field()
  activeAgencies: number;

  @Field()
  totalSlotsAllocated: number;

  @Field()
  totalSlotsUsed: number;

  @Field()
  totalManagedWorkspaces: number;
}
