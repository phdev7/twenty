import {
  Body,
  Controller,
  ForbiddenException,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { type Request } from 'express';

import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { JwtTokenTypeEnum } from 'src/engine/core-modules/auth/types/jwt-token-type.enum';
import { type WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { JwtAuthGuard } from 'src/engine/guards/jwt-auth.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { MigrationService } from 'src/modules/migration/services/migration.service';

@Controller('rest/diex/migration')
@UseGuards(JwtAuthGuard, WorkspaceAuthGuard)
export class MigrationController {
  constructor(
    private readonly migrationService: MigrationService,
    private readonly twentyConfigService: TwentyConfigService,
  ) {}

  @Post('import')
  async importBatch(
    @Req() request: Request,
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Body() body: Record<string, unknown>,
  ) {
    if (!this.twentyConfigService.get('DIEX_MIGRATION_API_ENABLED')) {
      throw new ForbiddenException('Diex migration API is disabled.');
    }
    if (request.tokenType !== JwtTokenTypeEnum.API_KEY) {
      throw new ForbiddenException(
        'Diex migration requires a workspace API key.',
      );
    }

    return this.migrationService.importBatch({
      workspaceId: workspace.id,
      sourceTeamId:
        typeof body?.sourceTeamId === 'string' ? body.sourceTeamId : '',
      entity: typeof body?.entity === 'string' ? body.entity : '',
      records: body?.records,
      confirmImport: body?.confirmImport === true,
    });
  }
}
