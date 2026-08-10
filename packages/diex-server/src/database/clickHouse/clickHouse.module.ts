import { Module } from '@nestjs/common';

import { DiexConfigModule } from 'src/engine/core-modules/diex-config/diex-config.module';

import { ClickHouseService } from './clickHouse.service';

@Module({
  imports: [DiexConfigModule],
  providers: [ClickHouseService],
  exports: [ClickHouseService],
})
export class ClickHouseModule {}
