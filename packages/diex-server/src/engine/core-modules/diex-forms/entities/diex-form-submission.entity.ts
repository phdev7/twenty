import GraphQLJSON from 'graphql-type-json';
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
import { ADD_DIEX_FORMS_PLATFORM_UPGRADE_COMMAND_NAME } from 'src/database/commands/upgrade-version-command/2-28/add-diex-forms-platform-upgrade-command-name.constant';
import { DiexFormEntity } from 'src/engine/core-modules/diex-forms/entities/diex-form.entity';
import { WasIntroducedInUpgrade } from 'src/engine/core-modules/upgrade/decorators/was-introduced-in-upgrade.decorator';

export enum FormSubmissionSource {
  INTERNAL_FORM = 'INTERNAL_FORM',
  WEBHOOK_API = 'WEBHOOK_API',
  WORDPRESS = 'WORDPRESS',
  FRAMER = 'FRAMER',
  YAYFORMS = 'YAYFORMS',
  CAL_COM = 'CAL_COM',
  TYPEFORM = 'TYPEFORM',
  TALLY = 'TALLY',
}

export enum FormSubmissionStatus {
  RECEIVED = 'RECEIVED',
  PROCESSED = 'PROCESSED',
  FAILED = 'FAILED',
}

registerEnumType(FormSubmissionSource, { name: 'FormSubmissionSource' });
registerEnumType(FormSubmissionStatus, { name: 'FormSubmissionStatus' });

@ObjectType('DiexFormSubmission')
@Entity({ name: 'diexFormSubmission', schema: 'core' })
export class DiexFormSubmissionEntity {
  @Field(() => UUIDScalarType)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => UUIDScalarType)
  @Column({ type: 'uuid' })
  @Index('IDX_DIEX_FORM_SUBMISSION_FORM_ID')
  formId: string;

  @ManyToOne(() => DiexFormEntity, (form) => form.submissions, {
    onDelete: 'CASCADE',
  })
  form: Relation<DiexFormEntity>;

  @Field(() => UUIDScalarType)
  @Column({ type: 'uuid' })
  @Index('IDX_DIEX_FORM_SUBMISSION_WORKSPACE_ID')
  workspaceId: string;

  @Field(() => GraphQLJSON)
  @Column({ type: 'jsonb' })
  submittedData: Record<string, unknown>;

  @Field(() => FormSubmissionSource)
  @Column({
    type: 'enum',
    enumName: 'diex_form_submission_source_enum',
    enum: FormSubmissionSource,
    default: FormSubmissionSource.INTERNAL_FORM,
  })
  source: FormSubmissionSource;

  @Field(() => FormSubmissionStatus)
  @WasIntroducedInUpgrade({
    upgradeCommandName: ADD_DIEX_FORMS_PLATFORM_UPGRADE_COMMAND_NAME,
  })
  @Column({
    type: 'enum',
    enumName: 'diex_form_submission_status_enum',
    enum: FormSubmissionStatus,
    default: FormSubmissionStatus.RECEIVED,
  })
  status: FormSubmissionStatus;

  @Field(() => String, { nullable: true })
  @WasIntroducedInUpgrade({
    upgradeCommandName: ADD_DIEX_FORMS_PLATFORM_UPGRADE_COMMAND_NAME,
  })
  @Column({ type: 'varchar', length: 120, nullable: true })
  idempotencyKey: string | null;

  @WasIntroducedInUpgrade({
    upgradeCommandName: ADD_DIEX_FORMS_PLATFORM_UPGRADE_COMMAND_NAME,
  })
  @Column({ type: 'varchar', length: 64, nullable: true })
  ipHash: string | null;

  @WasIntroducedInUpgrade({
    upgradeCommandName: ADD_DIEX_FORMS_PLATFORM_UPGRADE_COMMAND_NAME,
  })
  @Column({ type: 'varchar', length: 64, nullable: true })
  userAgentHash: string | null;

  @Field(() => GraphQLJSON)
  @WasIntroducedInUpgrade({
    upgradeCommandName: ADD_DIEX_FORMS_PLATFORM_UPGRADE_COMMAND_NAME,
  })
  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  attribution: Record<string, unknown>;

  @Field(() => Date, { nullable: true })
  @WasIntroducedInUpgrade({
    upgradeCommandName: ADD_DIEX_FORMS_PLATFORM_UPGRADE_COMMAND_NAME,
  })
  @Column({ type: 'timestamptz', nullable: true })
  consentAt: Date | null;

  @Field(() => Date, { nullable: true })
  @WasIntroducedInUpgrade({
    upgradeCommandName: ADD_DIEX_FORMS_PLATFORM_UPGRADE_COMMAND_NAME,
  })
  @Column({ type: 'timestamptz', nullable: true })
  processedAt: Date | null;

  @Field(() => String, { nullable: true })
  @WasIntroducedInUpgrade({
    upgradeCommandName: ADD_DIEX_FORMS_PLATFORM_UPGRADE_COMMAND_NAME,
  })
  @Column({ type: 'text', nullable: true })
  processingError: string | null;

  @Field(() => String, { nullable: true })
  @Column({ type: 'text', nullable: true })
  mappedRecordId: string | null;

  @Field(() => UUIDScalarType, { nullable: true })
  @WasIntroducedInUpgrade({
    upgradeCommandName: ADD_DIEX_FORMS_PLATFORM_UPGRADE_COMMAND_NAME,
  })
  @Column({ type: 'uuid', nullable: true })
  personId: string | null;

  @Field(() => UUIDScalarType, { nullable: true })
  @WasIntroducedInUpgrade({
    upgradeCommandName: ADD_DIEX_FORMS_PLATFORM_UPGRADE_COMMAND_NAME,
  })
  @Column({ type: 'uuid', nullable: true })
  companyId: string | null;

  @Field(() => UUIDScalarType, { nullable: true })
  @WasIntroducedInUpgrade({
    upgradeCommandName: ADD_DIEX_FORMS_PLATFORM_UPGRADE_COMMAND_NAME,
  })
  @Column({ type: 'uuid', nullable: true })
  opportunityId: string | null;

  @Field()
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
