import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from 'typeorm';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';

export enum DiexAgencyStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}

registerEnumType(DiexAgencyStatus, { name: 'DiexAgencyStatus' });

@ObjectType('DiexAgency')
@Entity({ name: 'diexAgency', schema: 'core' })
export class DiexAgencyEntity {
  @Field(() => UUIDScalarType)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ type: 'text' })
  name: string;

  @Field()
  @Column({ type: 'text', unique: true })
  @Index('IDX_DIEX_AGENCY_SLUG', { unique: true })
  slug: string;

  @Field(() => UUIDScalarType)
  @Column({ type: 'uuid' })
  ownerUserId: string;

  @Field()
  @Column({ type: 'integer', default: 5 })
  workspaceSlotsLimit: number;

  @Field(() => DiexAgencyStatus)
  @Column({ type: 'varchar', default: DiexAgencyStatus.ACTIVE })
  status: DiexAgencyStatus;

  @OneToMany(() => WorkspaceEntity, (workspace) => workspace.managedByAgency)
  managedWorkspaces: Relation<WorkspaceEntity[]>;

  @Field()
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
