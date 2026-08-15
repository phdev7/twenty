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

export enum FormFieldType {
  TEXT = 'TEXT',
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  SELECT = 'SELECT',
  NUMBER = 'NUMBER',
  TEXTAREA = 'TEXTAREA',
  MULTI_SELECT = 'MULTI_SELECT',
  RADIO = 'RADIO',
  CHECKBOX = 'CHECKBOX',
  CURRENCY = 'CURRENCY',
  DATE = 'DATE',
  URL = 'URL',
  RATING = 'RATING',
}

registerEnumType(FormFieldType, { name: 'FormFieldType' });

@ObjectType('DiexFormField')
@Entity({ name: 'diexFormField', schema: 'core' })
@Index('IDX_DIEX_FORM_FIELD_FORM_NAME', ['formId', 'name'], { unique: true })
export class DiexFormFieldEntity {
  @Field(() => UUIDScalarType)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => UUIDScalarType)
  @Column({ type: 'uuid' })
  @Index('IDX_DIEX_FORM_FIELD_FORM_ID')
  formId: string;

  @ManyToOne(() => DiexFormEntity, (form) => form.fields, {
    onDelete: 'CASCADE',
  })
  form: Relation<DiexFormEntity>;

  @Field()
  @Column({ type: 'text' })
  label: string;

  @Field()
  @Column({ type: 'text' })
  name: string;

  @Field(() => FormFieldType)
  @Column({
    type: 'enum',
    enumName: 'diex_form_field_type_enum',
    enum: FormFieldType,
    default: FormFieldType.TEXT,
  })
  type: FormFieldType;

  @Field(() => String, { nullable: true })
  @Column({ type: 'text', nullable: true })
  targetFieldName: string | null;

  @Field(() => String, { nullable: true })
  @WasIntroducedInUpgrade({
    upgradeCommandName: ADD_DIEX_FORMS_PLATFORM_UPGRADE_COMMAND_NAME,
  })
  @Column({ type: 'text', nullable: true })
  placeholder: string | null;

  @Field(() => String, { nullable: true })
  @WasIntroducedInUpgrade({
    upgradeCommandName: ADD_DIEX_FORMS_PLATFORM_UPGRADE_COMMAND_NAME,
  })
  @Column({ type: 'text', nullable: true })
  helpText: string | null;

  @Field(() => GraphQLJSON)
  @WasIntroducedInUpgrade({
    upgradeCommandName: ADD_DIEX_FORMS_PLATFORM_UPGRADE_COMMAND_NAME,
  })
  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  options: Array<{ label: string; value: string }>;

  @Field(() => GraphQLJSON)
  @WasIntroducedInUpgrade({
    upgradeCommandName: ADD_DIEX_FORMS_PLATFORM_UPGRADE_COMMAND_NAME,
  })
  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  validation: Record<string, unknown>;

  @Field()
  @Column({ type: 'boolean', default: false })
  isRequired: boolean;

  @Field()
  @Column({ type: 'integer', default: 0 })
  position: number;

  @Field()
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
