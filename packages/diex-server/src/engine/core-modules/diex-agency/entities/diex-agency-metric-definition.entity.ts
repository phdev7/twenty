import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from 'typeorm';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';
import { DiexAgencyEntity } from 'src/engine/core-modules/diex-agency/diex-agency.entity';
import { DiexAgencyMetricEntryEntity } from 'src/engine/core-modules/diex-agency/entities/diex-agency-metric-entry.entity';

export enum MetricUnitType {
  NUMBER = 'NUMBER',
  CURRENCY = 'CURRENCY',
  PERCENTAGE = 'PERCENTAGE',
  RATIO = 'RATIO',
}

export enum TargetComparisonType {
  HIGHER_IS_BETTER = 'HIGHER_IS_BETTER',
  LOWER_IS_BETTER = 'LOWER_IS_BETTER',
}

registerEnumType(MetricUnitType, { name: 'MetricUnitType' });
registerEnumType(TargetComparisonType, { name: 'TargetComparisonType' });

@ObjectType('DiexAgencyMetricDefinition')
@Entity({ name: 'diexAgencyMetricDefinition', schema: 'core' })
export class DiexAgencyMetricDefinitionEntity {
  @Field(() => UUIDScalarType)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => UUIDScalarType)
  @Column({ type: 'uuid' })
  @Index('IDX_DIEX_METRIC_DEF_AGENCY_ID')
  agencyId: string;

  @ManyToOne(() => DiexAgencyEntity, { onDelete: 'CASCADE' })
  agency: Relation<DiexAgencyEntity>;

  @Field()
  @Column({ type: 'text' })
  name: string;

  @Field()
  @Column({ type: 'text' })
  code: string;

  @Field(() => MetricUnitType)
  @Column({
    type: 'enum',
    enumName: 'diex_metric_unit_type_enum',
    enum: MetricUnitType,
    default: MetricUnitType.NUMBER,
  })
  unitType: MetricUnitType;

  @Field({ nullable: true })
  @Column({ type: 'varchar', default: 'BRL', nullable: true })
  currencyCode?: string;

  @Field(() => TargetComparisonType)
  @Column({
    type: 'enum',
    enumName: 'diex_target_comparison_type_enum',
    enum: TargetComparisonType,
    default: TargetComparisonType.HIGHER_IS_BETTER,
  })
  targetComparison: TargetComparisonType;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @Field()
  @Column({ type: 'boolean', default: true })
  isVisibleToClient: boolean;

  @OneToMany(
    () => DiexAgencyMetricEntryEntity,
    (entry) => entry.metricDefinition,
  )
  entries: Relation<DiexAgencyMetricEntryEntity[]>;

  @Field()
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
