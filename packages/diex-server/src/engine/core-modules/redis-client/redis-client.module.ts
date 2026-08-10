import { Global, Module } from '@nestjs/common';

import { RedisClientService } from 'src/engine/core-modules/redis-client/redis-client.service';
import { DiexConfigModule } from 'src/engine/core-modules/diex-config/diex-config.module';

@Global()
@Module({
  imports: [DiexConfigModule],
  providers: [RedisClientService],
  exports: [RedisClientService],
})
export class RedisClientModule {}
