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

registerEnumType(FormSubmissionSource, { name: 'FormSubmissionSource' });

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

  @ManyToOne(() => DiexFormEntity, (form) => form.submissions, { onDelete: 'CASCADE' })
  form: Relation<DiexFormEntity>;

  @Field(() => UUIDScalarType)
  @Column({ type: 'uuid' })
  @Index('IDX_DIEX_FORM_SUBMISSION_WORKSPACE_ID')
  workspaceId: string;

  @Field()
  @Column({ type: 'jsonb' })
  submittedData: Record<string, any>;

  @Field(() => FormSubmissionSource)
  @Column({
    type: 'enum',
    enumName: 'diex_form_submission_source_enum',
    enum: FormSubmissionSource,
    default: FormSubmissionSource.INTERNAL_FORM,
  })
  source: FormSubmissionSource;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  mappedRecordId?: string;

  @Field()
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
