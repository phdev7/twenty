import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DiexFormEntity } from 'src/engine/core-modules/diex-forms/entities/diex-form.entity';
import { DiexFormFieldEntity } from 'src/engine/core-modules/diex-forms/entities/diex-form-field.entity';
import { DiexFormSubmissionEntity } from 'src/engine/core-modules/diex-forms/entities/diex-form-submission.entity';
import { DiexPublicFormsController } from 'src/engine/core-modules/diex-forms/controllers/diex-public-forms.controller';
import {
  DiexFormsApexController,
  DiexFormsDomainController,
} from 'src/engine/core-modules/diex-forms/controllers/diex-forms-domain.controller';
import { DiexFormsResolver } from 'src/engine/core-modules/diex-forms/diex-forms.resolver';
import { DiexFormsPublicRendererService } from 'src/engine/core-modules/diex-forms/services/diex-forms-public-renderer.service';
import { DiexFormsService } from 'src/engine/core-modules/diex-forms/services/diex-forms.service';
import { FileUrlModule } from 'src/engine/core-modules/file/file-url/file-url.module';
import { ThrottlerModule } from 'src/engine/core-modules/throttler/throttler.module';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { provideWorkspaceScopedRepository } from 'src/engine/diex-orm/workspace-scoped-repository/provide-workspace-scoped-repository';
import { PermissionsModule } from 'src/engine/metadata-modules/permissions/permissions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DiexFormEntity,
      DiexFormFieldEntity,
      DiexFormSubmissionEntity,
      WorkspaceEntity,
    ]),
    ThrottlerModule,
    FileUrlModule,
    PermissionsModule,
  ],
  controllers: [
    DiexPublicFormsController,
    DiexFormsDomainController,
    DiexFormsApexController,
  ],
  providers: [
    DiexFormsService,
    DiexFormsPublicRendererService,
    DiexFormsResolver,
    provideWorkspaceScopedRepository(DiexFormEntity),
    provideWorkspaceScopedRepository(DiexFormSubmissionEntity),
  ],
  exports: [DiexFormsService],
})
export class DiexFormsModule {}
