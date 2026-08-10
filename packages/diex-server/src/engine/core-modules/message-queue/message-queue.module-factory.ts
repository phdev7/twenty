import {
  type BullMQDriverFactoryOptions,
  MessageQueueDriverType,
  type MessageQueueModuleOptions,
} from 'src/engine/core-modules/message-queue/interfaces';
import { type MetricsService } from 'src/engine/core-modules/metrics/metrics.service';
import { type RedisClientService } from 'src/engine/core-modules/redis-client/redis-client.service';
import { type DiexConfigService } from 'src/engine/core-modules/diex-config/diex-config.service';

/**
 * MessageQueue Module factory
 * @returns MessageQueueModuleOptions
 * @param diexConfigService
 * @param redisClientService
 * @param metricsService
 */
export const messageQueueModuleFactory = async (
  diexConfigService: DiexConfigService,
  redisClientService: RedisClientService,
  metricsService: MetricsService,
): Promise<MessageQueueModuleOptions> => {
  const driverType = MessageQueueDriverType.BullMQ;

  switch (driverType) {
    case MessageQueueDriverType.BullMQ: {
      return {
        type: MessageQueueDriverType.BullMQ,
        options: {
          connection: redisClientService.getQueueClient(),
        },
        metricsService,
        diexConfigService,
      } satisfies BullMQDriverFactoryOptions;
    }
    default:
      throw new Error(
        `Invalid message queue driver type (${driverType}), check your .env file`,
      );
  }
};
