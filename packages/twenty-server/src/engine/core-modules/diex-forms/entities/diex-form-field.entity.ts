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
import { DiexFormEntity } from 'src/engine/core-modules/diex-forms/entities/diex-form.entity';

export enum FormFieldType {
  TEXT = 'TEXT',
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  SELECT = 'SELECT',
  NUMBER = 'NUMBER',
  TEXTAREA = 'TEXTAREA',
}

registerEnumType(FormFieldType, { name: 'FormFieldType' });

@ObjectType('DiexFormField')
@Entity({ name: 'diexFormField', schema: 'core' })
export class DiexFormFieldEntity {
  @Field(() => UUIDScalarType)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => UUIDScalarType)
  @Column({ type: 'uuid' })
  @Index('IDX_DIEX_FORM_FIELD_FORM_ID')
  formId: string;

  @ManyToOne(() => DiexFormEntity, (form) => form.fields, { onDelete: 'CASCADE' })
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

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  targetFieldName?: string;

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
