import { Module } from '@nestjs/common';

import { AuthModule } from 'src/engine/core-modules/auth/auth.module';
import { TwentyORMModule } from 'src/engine/twenty-orm/twenty-orm.module';
import { CustomerSuccessController } from 'src/modules/customer-success/controllers/customer-success.controller';
import { CustomerSuccessService } from 'src/modules/customer-success/services/customer-success.service';
import { CustomerSuccessToolWorkspaceService } from 'src/modules/customer-success/tools/services/customer-success-tool.workspace-service';

@Module({
  imports: [AuthModule, TwentyORMModule],
  controllers: [CustomerSuccessController],
  providers: [CustomerSuccessService, CustomerSuccessToolWorkspaceService],
  exports: [CustomerSuccessService, CustomerSuccessToolWorkspaceService],
})
export class CustomerSuccessModule {}
