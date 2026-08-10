import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from 'typeorm';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';
import { DiexAgencyMetricDefinitionEntity } from 'src/engine/core-modules/diex-agency/entities/diex-agency-metric-definition.entity';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';

export enum MetricSourceType {
  MANUAL = 'MANUAL',
  META_ADS_SYNC = 'META_ADS_SYNC',
  API_IMPORT = 'API_IMPORT',
}

registerEnumType(MetricSourceType, { name: 'MetricSourceType' });

@ObjectType('DiexAgencyMetricEntry')
@Entity({ name: 'diexAgencyMetricEntry', schema: 'core' })
export class DiexAgencyMetricEntryEntity {
  @Field(() => UUIDScalarType)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => UUIDScalarType)
  @Column({ type: 'uuid' })
  @Index('IDX_DIEX_METRIC_ENTRY_DEF_ID')
  metricDefinitionId: string;

  // Exposed because a client report is unreadable without the name and unit of
  // the metric each entry belongs to. listMetricEntriesForClient already joins
  // it; without the field the value arrived as a bare number.
  @Field(() => DiexAgencyMetricDefinitionEntity, { nullable: true })
  @ManyToOne(() => DiexAgencyMetricDefinitionEntity, (def) => def.entries, {
    onDelete: 'CASCADE',
  })
  metricDefinition: Relation<DiexAgencyMetricDefinitionEntity>;

  @Field(() => UUIDScalarType)
  @Column({ type: 'uuid' })
  @Index('IDX_DIEX_METRIC_ENTRY_WORKSPACE_ID')
  clientWorkspaceId: string;

  @ManyToOne(() => WorkspaceEntity, { onDelete: 'CASCADE' })
  clientWorkspace: Relation<WorkspaceEntity>;

  @Field()
  @Column({ type: 'timestamptz' })
  periodStart: Date;

  @Field()
  @Column({ type: 'timestamptz' })
  periodEnd: Date;

  @Field()
  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  value: number;

  @Field(() => MetricSourceType)
  @Column({
    type: 'enum',
    enumName: 'diex_metric_source_type_enum',
    enum: MetricSourceType,
    default: MetricSourceType.MANUAL,
  })
  source: MetricSourceType;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Field()
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
