import { Module } from '@nestjs/common';

import { WellKnownController } from 'src/engine/core-modules/well-known/controllers/well-known.controller';
import { DiexConfigModule } from 'src/engine/core-modules/diex-config/diex-config.module';

@Module({
  imports: [DiexConfigModule],
  controllers: [WellKnownController],
})
export class WellKnownModule {}
