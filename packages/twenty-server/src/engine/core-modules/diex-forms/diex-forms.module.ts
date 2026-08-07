import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DiexFormEntity } from 'src/engine/core-modules/diex-forms/entities/diex-form.entity';
import { DiexFormFieldEntity } from 'src/engine/core-modules/diex-forms/entities/diex-form-field.entity';
import { DiexFormSubmissionEntity } from 'src/engine/core-modules/diex-forms/entities/diex-form-submission.entity';
import { DiexPublicFormsController } from 'src/engine/core-modules/diex-forms/controllers/diex-public-forms.controller';
import { DiexFormsResolver } from 'src/engine/core-modules/diex-forms/diex-forms.resolver';
import { DiexFormsService } from 'src/engine/core-modules/diex-forms/services/diex-forms.service';
import { ThrottlerModule } from 'src/engine/core-modules/throttler/throttler.module';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DiexFormEntity,
      DiexFormFieldEntity,
      DiexFormSubmissionEntity,
      WorkspaceEntity,
    ]),
    ThrottlerModule,
  ],
  controllers: [DiexPublicFormsController],
  providers: [DiexFormsService, DiexFormsResolver],
  exports: [DiexFormsService],
})
export class DiexFormsModule {}
