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
import { DiexFormFieldEntity } from 'src/engine/core-modules/diex-forms/entities/diex-form-field.entity';
import { DiexFormSubmissionEntity } from 'src/engine/core-modules/diex-forms/entities/diex-form-submission.entity';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';

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

registerEnumType(FormTargetObject, { name: 'FormTargetObject' });
registerEnumType(FormStatus, { name: 'FormStatus' });

@ObjectType('DiexForm')
@Entity({ name: 'diexForm', schema: 'core' })
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
  description?: string;

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
    default: FormStatus.PUBLISHED,
  })
  status: FormStatus;

  @Field(() => [DiexFormFieldEntity])
  @OneToMany(() => DiexFormFieldEntity, (field) => field.form, { cascade: true })
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
