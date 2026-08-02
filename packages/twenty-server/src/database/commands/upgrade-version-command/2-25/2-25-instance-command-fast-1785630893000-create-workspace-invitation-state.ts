import { type QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { type FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.25.0', 1785630893000)
export class CreateWorkspaceInvitationStateFastInstanceCommand implements FastInstanceCommand {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "core"."workspaceInvitationState" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "workspaceId" uuid NOT NULL,
        "normalizedEmail" text NOT NULL,
        "family" text NOT NULL,
        "appTokenId" uuid,
        "deliveryStatus" text NOT NULL,
        "deliveryAttemptKey" text,
        "deliveryAttemptedAt" TIMESTAMP WITH TIME ZONE,
        "sentAt" TIMESTAMP WITH TIME ZONE,
        "failedAt" TIMESTAMP WITH TIME ZONE,
        "failureReason" text,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_workspaceInvitationState_id" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_workspaceInvitationState_family" CHECK ("family" IN ('WORKSPACE_INVITATION')),
        CONSTRAINT "CHK_workspaceInvitationState_deliveryStatus" CHECK ("deliveryStatus" IN ('PENDING', 'DISPATCHING', 'SENT', 'FAILED', 'UNKNOWN')),
        CONSTRAINT "FK_workspaceInvitationState_workspaceId" FOREIGN KEY ("workspaceId") REFERENCES "core"."workspace"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_workspaceInvitationState_appTokenId" FOREIGN KEY ("appTokenId") REFERENCES "core"."appToken"("id") ON DELETE SET NULL
      )`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_WORKSPACE_INVITATION_STATE_IDENTITY_UNIQUE"
        ON "core"."workspaceInvitationState" ("workspaceId", "normalizedEmail", "family")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_WORKSPACE_INVITATION_STATE_APP_TOKEN_UNIQUE"
        ON "core"."workspaceInvitationState" ("appTokenId")
        WHERE "appTokenId" IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_WORKSPACE_INVITATION_STATE_WORKSPACE_ID"
        ON "core"."workspaceInvitationState" ("workspaceId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP TABLE IF EXISTS "core"."workspaceInvitationState"',
    );
  }
}
