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
import { DiexAgencyEntity } from 'src/engine/core-modules/diex-agency/diex-agency.entity';
import { type EncryptedString } from 'src/engine/core-modules/secret-encryption/branded-strings/encrypted-string.type';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';

export enum MetaAdsStatus {
  CONNECTED = 'CONNECTED',
  EXPIRED = 'EXPIRED',
  DISCONNECTED = 'DISCONNECTED',
}

registerEnumType(MetaAdsStatus, { name: 'MetaAdsStatus' });

@ObjectType('DiexMetaAdsAccount')
@Entity({ name: 'diexMetaAdsAccount', schema: 'core' })
export class DiexMetaAdsAccountEntity {
  @Field(() => UUIDScalarType)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => UUIDScalarType)
  @Column({ type: 'uuid' })
  @Index('IDX_DIEX_META_ADS_AGENCY_ID')
  agencyId: string;

  @ManyToOne(() => DiexAgencyEntity, { onDelete: 'CASCADE' })
  agency: Relation<DiexAgencyEntity>;

  @Field(() => UUIDScalarType, { nullable: true })
  @Column({ type: 'uuid', nullable: true })
  @Index('IDX_DIEX_META_ADS_WORKSPACE_ID')
  clientWorkspaceId?: string;

  @ManyToOne(() => WorkspaceEntity, { nullable: true, onDelete: 'SET NULL' })
  clientWorkspace?: Relation<WorkspaceEntity>;

  @Field()
  @Column({ type: 'text' })
  adAccountId: string;

  @Field()
  @Column({ type: 'text' })
  accountName: string;

  // Long-lived Meta token: never exposed over GraphQL and never stored in clear
  @Column({ type: 'text' })
  accessToken: EncryptedString;

  @Field(() => MetaAdsStatus)
  @Column({
    type: 'enum',
    enumName: 'diex_meta_ads_status_enum',
    enum: MetaAdsStatus,
    default: MetaAdsStatus.CONNECTED,
  })
  status: MetaAdsStatus;

  @Field({ nullable: true })
  @Column({ type: 'timestamptz', nullable: true })
  lastSyncedAt?: Date;

  @Field()
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
