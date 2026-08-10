import { type LogLevel } from '@nestjs/common';

export type DiexLogLevel = LogLevel | 'performance';

export enum LoggerDriverType {
  CONSOLE = 'CONSOLE',
}

export interface ConsoleDriverFactoryOptions {
  type: LoggerDriverType.CONSOLE;
  logLevels?: DiexLogLevel[];
}

export type LoggerModuleOptions = ConsoleDriverFactoryOptions;
