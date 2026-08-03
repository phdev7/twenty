import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { AppTokenDeliveryStatus } from 'src/engine/core-modules/app-token/app-token.entity';

export enum WorkspaceInvitationFamily {
  WORKSPACE_INVITATION = 'WORKSPACE_INVITATION',
}

@Entity({ name: 'workspaceInvitationState', schema: 'core' })
@Index(
  'IDX_WORKSPACE_INVITATION_STATE_IDENTITY_UNIQUE',
  ['workspaceId', 'normalizedEmail', 'family'],
  { unique: true },
)
@Index('IDX_WORKSPACE_INVITATION_STATE_APP_TOKEN_UNIQUE', ['appTokenId'], {
  unique: true,
  where: '"appTokenId" IS NOT NULL',
})
export class WorkspaceInvitationStateEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  workspaceId: string;

  @Column({ type: 'text' })
  normalizedEmail: string;

  @Column({ type: 'text' })
  family: WorkspaceInvitationFamily;

  @Column({ type: 'uuid', nullable: true })
  appTokenId: string | null;

  @Column({ type: 'text' })
  deliveryStatus: AppTokenDeliveryStatus;

  @Column({ type: 'text', nullable: true })
  deliveryAttemptKey: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  deliveryAttemptedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  sentAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  failedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  failureReason: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
