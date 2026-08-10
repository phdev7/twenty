import { type DynamicModule, Global, Module } from '@nestjs/common';

import { ConfigVariables } from 'src/engine/core-modules/diex-config/config-variables';
import { CONFIG_VARIABLES_INSTANCE_TOKEN } from 'src/engine/core-modules/diex-config/constants/config-variables-instance-tokens.constants';
import { DatabaseConfigModule } from 'src/engine/core-modules/diex-config/drivers/database-config.module';
import { ConfigGroupHashService } from 'src/engine/core-modules/diex-config/services/config-group-hash.service';
import { ConfigurableModuleClass } from 'src/engine/core-modules/diex-config/diex-config.module-definition';
import { DiexConfigService } from 'src/engine/core-modules/diex-config/diex-config.service';

@Global()
@Module({})
export class DiexConfigModule extends ConfigurableModuleClass {
  static forRoot(): DynamicModule {
    const isConfigVariablesInDbEnabled =
      process.env.IS_CONFIG_VARIABLES_IN_DB_ENABLED !== 'false';

    const imports = isConfigVariablesInDbEnabled
      ? [DatabaseConfigModule.forRoot()]
      : [];

    return {
      module: DiexConfigModule,
      imports,
      providers: [
        DiexConfigService,
        ConfigGroupHashService,
        {
          provide: CONFIG_VARIABLES_INSTANCE_TOKEN,
          useValue: new ConfigVariables(),
        },
      ],
      exports: [DiexConfigService, ConfigGroupHashService],
    };
  }
}
