import GraphQLJSON from 'graphql-type-json';
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
import { ADD_DIEX_FORMS_PLATFORM_UPGRADE_COMMAND_NAME } from 'src/database/commands/upgrade-version-command/2-27/add-diex-forms-platform-upgrade-command-name.constant';
import { DiexFormFieldEntity } from 'src/engine/core-modules/diex-forms/entities/diex-form-field.entity';
import { DiexFormSubmissionEntity } from 'src/engine/core-modules/diex-forms/entities/diex-form-submission.entity';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { WasIntroducedInUpgrade } from 'src/engine/core-modules/upgrade/decorators/was-introduced-in-upgrade.decorator';

export enum FormTargetObject {
  PERSON = 'PERSON',
  COMPANY = 'COMPANY',
  OPPORTUNITY = 'OPPORTUNITY',
}

export enum FormStatus {
  PUBLISHED = 'PUBLISHED',
  DRAFT = 'DRAFT',
  ARCHIVED = 'ARCHIVED',
}

export enum FormLayout {
  STEP_BY_STEP = 'STEP_BY_STEP',
  SINGLE_PAGE = 'SINGLE_PAGE',
}

export enum FormTemplate {
  CONTACT = 'CONTACT',
  COMMERCIAL_QUALIFICATION = 'COMMERCIAL_QUALIFICATION',
  QUOTE_REQUEST = 'QUOTE_REQUEST',
  EVENT_REGISTRATION = 'EVENT_REGISTRATION',
  BLANK = 'BLANK',
}

registerEnumType(FormTargetObject, { name: 'FormTargetObject' });
registerEnumType(FormStatus, { name: 'FormStatus' });
registerEnumType(FormLayout, { name: 'FormLayout' });
registerEnumType(FormTemplate, { name: 'FormTemplate' });

@ObjectType('DiexForm')
@Entity({ name: 'diexForm', schema: 'core' })
@Index('IDX_DIEX_FORM_WORKSPACE_SLUG', ['workspaceId', 'slug'], {
  unique: true,
})
export class DiexFormEntity {
  @Field(() => UUIDScalarType)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => UUIDScalarType)
  @Column({ type: 'uuid' })
  @Index('IDX_DIEX_FORM_WORKSPACE_ID')
  workspaceId: string;

  @ManyToOne(() => WorkspaceEntity, { onDelete: 'CASCADE' })
  workspace: Relation<WorkspaceEntity>;

  @Field()
  @Column({ type: 'text' })
  title: string;

  @Field()
  @Column({ type: 'text' })
  @Index('IDX_DIEX_FORM_SLUG')
  slug: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Field(() => FormTargetObject)
  @Column({
    type: 'enum',
    enumName: 'diex_form_target_object_enum',
    enum: FormTargetObject,
    default: FormTargetObject.PERSON,
  })
  targetObject: FormTargetObject;

  @Field(() => FormStatus)
  @Column({
    type: 'enum',
    enumName: 'diex_form_status_enum',
    enum: FormStatus,
    default: FormStatus.DRAFT,
  })
  status: FormStatus;

  @Field(() => FormLayout)
  @WasIntroducedInUpgrade({
    upgradeCommandName: ADD_DIEX_FORMS_PLATFORM_UPGRADE_COMMAND_NAME,
  })
  @Column({
    type: 'enum',
    enumName: 'diex_form_layout_enum',
    enum: FormLayout,
    default: FormLayout.STEP_BY_STEP,
  })
  layout: FormLayout;

  @Field()
  @WasIntroducedInUpgrade({
    upgradeCommandName: ADD_DIEX_FORMS_PLATFORM_UPGRADE_COMMAND_NAME,
  })
  @Column({ type: 'text', default: 'Enviar' })
  submitButtonLabel: string;

  @Field()
  @WasIntroducedInUpgrade({
    upgradeCommandName: ADD_DIEX_FORMS_PLATFORM_UPGRADE_COMMAND_NAME,
  })
  @Column({ type: 'text', default: 'Obrigado!' })
  successTitle: string;

  @Field()
  @WasIntroducedInUpgrade({
    upgradeCommandName: ADD_DIEX_FORMS_PLATFORM_UPGRADE_COMMAND_NAME,
  })
  @Column({
    type: 'text',
    default: 'Recebemos suas informações e entraremos em contato em breve.',
  })
  successMessage: string;

  @Field()
  @WasIntroducedInUpgrade({
    upgradeCommandName: ADD_DIEX_FORMS_PLATFORM_UPGRADE_COMMAND_NAME,
  })
  @Column({ type: 'boolean', default: true })
  showLogo: boolean;

  @Field({ nullable: true })
  @WasIntroducedInUpgrade({
    upgradeCommandName: ADD_DIEX_FORMS_PLATFORM_UPGRADE_COMMAND_NAME,
  })
  @Column({ type: 'text', nullable: true })
  logoUrl: string | null;

  @Field()
  @WasIntroducedInUpgrade({
    upgradeCommandName: ADD_DIEX_FORMS_PLATFORM_UPGRADE_COMMAND_NAME,
  })
  @Column({ type: 'varchar', length: 7, default: '#6C5CE7' })
  accentColor: string;

  @Field({ nullable: true })
  @WasIntroducedInUpgrade({
    upgradeCommandName: ADD_DIEX_FORMS_PLATFORM_UPGRADE_COMMAND_NAME,
  })
  @Column({ type: 'text', nullable: true })
  privacyPolicyUrl: string | null;

  @Field({ nullable: true })
  @WasIntroducedInUpgrade({
    upgradeCommandName: ADD_DIEX_FORMS_PLATFORM_UPGRADE_COMMAND_NAME,
  })
  @Column({ type: 'text', nullable: true })
  consentText: string | null;

  @Field()
  @WasIntroducedInUpgrade({
    upgradeCommandName: ADD_DIEX_FORMS_PLATFORM_UPGRADE_COMMAND_NAME,
  })
  @Column({ type: 'boolean', default: false })
  consentRequired: boolean;

  @Field()
  @WasIntroducedInUpgrade({
    upgradeCommandName: ADD_DIEX_FORMS_PLATFORM_UPGRADE_COMMAND_NAME,
  })
  @Column({ type: 'boolean', default: false })
  createOpportunity: boolean;

  @Field()
  @WasIntroducedInUpgrade({
    upgradeCommandName: ADD_DIEX_FORMS_PLATFORM_UPGRADE_COMMAND_NAME,
  })
  @Column({ type: 'text', default: 'NEW' })
  opportunityStage: string;

  @Field(() => UUIDScalarType, { nullable: true })
  @WasIntroducedInUpgrade({
    upgradeCommandName: ADD_DIEX_FORMS_PLATFORM_UPGRADE_COMMAND_NAME,
  })
  @Column({ type: 'uuid', nullable: true })
  ownerId: string | null;

  @Field()
  @WasIntroducedInUpgrade({
    upgradeCommandName: ADD_DIEX_FORMS_PLATFORM_UPGRADE_COMMAND_NAME,
  })
  @Column({ type: 'integer', default: 1 })
  draftVersion: number;

  @Field()
  @WasIntroducedInUpgrade({
    upgradeCommandName: ADD_DIEX_FORMS_PLATFORM_UPGRADE_COMMAND_NAME,
  })
  @Column({ type: 'integer', default: 0 })
  publishedVersion: number;

  @Field({ nullable: true })
  @WasIntroducedInUpgrade({
    upgradeCommandName: ADD_DIEX_FORMS_PLATFORM_UPGRADE_COMMAND_NAME,
  })
  @Column({ type: 'timestamptz', nullable: true })
  publishedAt: Date | null;

  @WasIntroducedInUpgrade({
    upgradeCommandName: ADD_DIEX_FORMS_PLATFORM_UPGRADE_COMMAND_NAME,
  })
  @Column({ type: 'jsonb', nullable: true })
  publishedSnapshot: Record<string, unknown> | null;

  @Field(() => GraphQLJSON)
  @WasIntroducedInUpgrade({
    upgradeCommandName: ADD_DIEX_FORMS_PLATFORM_UPGRADE_COMMAND_NAME,
  })
  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  settings: Record<string, unknown>;

  @Field({ nullable: true })
  publicUrl?: string;

  @Field(() => [DiexFormFieldEntity])
  @OneToMany(() => DiexFormFieldEntity, (field) => field.form, {
    cascade: true,
  })
  fields: Relation<DiexFormFieldEntity[]>;

  @OneToMany(() => DiexFormSubmissionEntity, (submission) => submission.form)
  submissions: Relation<DiexFormSubmissionEntity[]>;

  @Field()
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
