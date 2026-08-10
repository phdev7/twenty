import {
  LoggerDriverType,
  type LoggerModuleOptions,
} from 'src/engine/core-modules/logger/interfaces';
import { type DiexConfigService } from 'src/engine/core-modules/diex-config/diex-config.service';

/**
 * Logger Module factory
 * @returns LoggerModuleOptions
 * @param diexConfigService
 */
export const loggerModuleFactory = async (
  diexConfigService: DiexConfigService,
): Promise<LoggerModuleOptions> => {
  const driverType = diexConfigService.get('LOGGER_DRIVER');
  const logLevels = diexConfigService.get('LOG_LEVELS');

  switch (driverType) {
    case LoggerDriverType.CONSOLE: {
      return {
        type: LoggerDriverType.CONSOLE,
        logLevels: logLevels,
      };
    }
    default:
      throw new Error(
        `Invalid logger driver type (${driverType}), check your .env file`,
      );
  }
};
