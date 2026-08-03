import { type DataSource, type QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { type SlowInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/slow-instance-command.interface';

@RegisteredInstanceCommand('2.25.0', 1785630893001, { type: 'slow' })
export class BackfillWorkspaceInvitationStateSlowInstanceCommand implements SlowInstanceCommand {
  async runDataMigration(dataSource: DataSource): Promise<void> {
    // Preserve every legacy token. One durable identity points at the best
    // active candidate; historical delivery without an explicit marker is
    // classified as UNKNOWN and is never silently resent.
    await dataSource.query(
      `WITH ranked AS (
        SELECT
          token."id",
          token."workspaceId",
          lower(trim(token."context"->>'email')) AS "normalizedEmail",
          token."context"->>'deliveryStatus' AS "legacyDeliveryStatus",
          row_number() OVER (
            PARTITION BY token."workspaceId", lower(trim(token."context"->>'email'))
            ORDER BY
              CASE WHEN token."context"->>'deliveryStatus' = 'SENT' THEN 0 ELSE 1 END,
              token."createdAt" DESC,
              token."id" DESC
          ) AS "candidateRank"
        FROM "core"."appToken" token
        WHERE token."workspaceId" IS NOT NULL
          AND token."type" IN ('INVITATION_TOKEN', 'ONBOARDING_INVITATION_TOKEN')
          AND token."deletedAt" IS NULL
          AND token."revokedAt" IS NULL
          AND token."expiresAt" > now()
          AND nullif(trim(token."context"->>'email'), '') IS NOT NULL
      )
      INSERT INTO "core"."workspaceInvitationState" (
        "id",
        "workspaceId",
        "normalizedEmail",
        "family",
        "appTokenId",
        "deliveryStatus",
        "sentAt"
      )
      SELECT
        uuid_generate_v4(),
        ranked."workspaceId",
        ranked."normalizedEmail",
        'WORKSPACE_INVITATION',
        ranked."id",
        CASE
          WHEN ranked."legacyDeliveryStatus" = 'SENT' THEN 'SENT'
          WHEN ranked."legacyDeliveryStatus" = 'FAILED' THEN 'FAILED'
          ELSE 'UNKNOWN'
        END,
        CASE WHEN ranked."legacyDeliveryStatus" = 'SENT' THEN now() ELSE NULL END
      FROM ranked
      WHERE ranked."candidateRank" = 1
      ON CONFLICT ("workspaceId", "normalizedEmail", "family") DO NOTHING`,
    );
  }

  public async up(_queryRunner: QueryRunner): Promise<void> {}

  public async down(_queryRunner: QueryRunner): Promise<void> {}
}
