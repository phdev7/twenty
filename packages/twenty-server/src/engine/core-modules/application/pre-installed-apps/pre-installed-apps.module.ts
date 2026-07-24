import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WorkspaceIteratorModule } from 'src/database/commands/command-runners/workspace-iterator.module';
import { ApplicationInstallModule } from 'src/engine/core-modules/application/application-install/application-install.module';
import { ApplicationRegistrationEntity } from 'src/engine/core-modules/application/application-registration/application-registration.entity';
import { PreInstalledAppsService } from 'src/engine/core-modules/application/pre-installed-apps/pre-installed-apps.service';
import { BundledDiexCoreService } from 'src/engine/core-modules/application/pre-installed-apps/bundled-diex-core.service';
import { TwentyStandardApplicationModule } from 'src/engine/workspace-manager/twenty-standard-application/twenty-standard-application.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ApplicationRegistrationEntity]),
    ApplicationInstallModule,
    WorkspaceIteratorModule,
    TwentyStandardApplicationModule,
  ],
  providers: [PreInstalledAppsService, BundledDiexCoreService],
  exports: [PreInstalledAppsService],
})
export class PreInstalledAppsModule {}
