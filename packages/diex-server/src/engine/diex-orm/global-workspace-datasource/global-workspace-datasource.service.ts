import {
  Injectable,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { isDefined } from 'diex-shared/utils';
import { DataSource } from 'typeorm';

import {
  DatabasePoolMetricsService,
  DatabasePoolName,
} from 'src/database/typeorm/database-pool-metrics.service';
import { DiexConfigService } from 'src/engine/core-modules/diex-config/diex-config.service';
import { GlobalWorkspaceDataSource } from 'src/engine/diex-orm/global-workspace-datasource/global-workspace-datasource';
import { WorkspaceEventEmitter } from 'src/engine/workspace-event-emitter/workspace-event-emitter';

@Injectable()
export class GlobalWorkspaceDataSourceService
  implements OnModuleInit, OnApplicationShutdown
{
  private globalWorkspaceDataSource: GlobalWorkspaceDataSource | null = null;
  private globalWorkspaceDataSourceReplica: GlobalWorkspaceDataSource | null =
    null;

  constructor(
    private readonly diexConfigService: DiexConfigService,
    private readonly workspaceEventEmitter: WorkspaceEventEmitter,
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
    private readonly databasePoolMetricsService: DatabasePoolMetricsService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.globalWorkspaceDataSource = new GlobalWorkspaceDataSource(
      {
        url: this.diexConfigService.get('PG_DATABASE_URL'),
        type: 'postgres',
        logging: this.diexConfigService.getLoggingConfig(),
        entities: [],
        ssl: this.diexConfigService.get('PG_SSL_ALLOW_SELF_SIGNED')
          ? {
              rejectUnauthorized: false,
            }
          : undefined,
        poolSize: this.diexConfigService.get('PG_POOL_MAX_CONNECTIONS'),
        extra: {
          query_timeout: this.diexConfigService.get(
            'PG_DATABASE_PRIMARY_TIMEOUT_MS',
          ),
          idleTimeoutMillis: this.diexConfigService.get(
            'PG_POOL_IDLE_TIMEOUT_MS',
          ),
          allowExitOnIdle: this.diexConfigService.get(
            'PG_POOL_ALLOW_EXIT_ON_IDLE',
          ),
        },
      },
      this.workspaceEventEmitter,
      this.coreDataSource,
    );

    await this.globalWorkspaceDataSource.initialize();
    this.databasePoolMetricsService.registerDataSource({
      poolName: DatabasePoolName.WorkspacePrimary,
      dataSource: this.globalWorkspaceDataSource,
    });

    const shouldInitializeReplicaDataSource = isDefined(
      this.diexConfigService.get('PG_DATABASE_REPLICA_URL'),
    );

    if (shouldInitializeReplicaDataSource) {
      this.globalWorkspaceDataSourceReplica = new GlobalWorkspaceDataSource(
        {
          url: this.diexConfigService.get('PG_DATABASE_REPLICA_URL'),
          type: 'postgres',
          logging: this.diexConfigService.getLoggingConfig(),
          entities: [],
          ssl: this.diexConfigService.get('PG_SSL_ALLOW_SELF_SIGNED')
            ? {
                rejectUnauthorized: false,
              }
            : undefined,
          poolSize: this.diexConfigService.get('PG_POOL_MAX_CONNECTIONS'),
          extra: {
            query_timeout: this.diexConfigService.get(
              'PG_DATABASE_REPLICA_TIMEOUT_MS',
            ),
            idleTimeoutMillis: this.diexConfigService.get(
              'PG_POOL_IDLE_TIMEOUT_MS',
            ),
            allowExitOnIdle: this.diexConfigService.get(
              'PG_POOL_ALLOW_EXIT_ON_IDLE',
            ),
          },
        },
        this.workspaceEventEmitter,
        this.coreDataSource,
      );
      await this.globalWorkspaceDataSourceReplica.initialize();
      this.databasePoolMetricsService.registerDataSource({
        poolName: DatabasePoolName.WorkspaceReplica,
        dataSource: this.globalWorkspaceDataSourceReplica,
      });
    }
  }

  public getGlobalWorkspaceDataSource(): GlobalWorkspaceDataSource {
    if (!isDefined(this.globalWorkspaceDataSource)) {
      throw new Error(
        'GlobalWorkspaceDataSource has not been initialized. Make sure the module has been initialized.',
      );
    }

    return this.globalWorkspaceDataSource;
  }

  public getGlobalWorkspaceDataSourceReplica(): GlobalWorkspaceDataSource {
    if (!isDefined(this.globalWorkspaceDataSourceReplica)) {
      return this.getGlobalWorkspaceDataSource();
    }

    return this.globalWorkspaceDataSourceReplica;
  }

  async onApplicationShutdown(): Promise<void> {
    if (this.globalWorkspaceDataSource) {
      await this.globalWorkspaceDataSource.destroy();
      this.globalWorkspaceDataSource = null;
    }
    if (this.globalWorkspaceDataSourceReplica) {
      await this.globalWorkspaceDataSourceReplica.destroy();
      this.globalWorkspaceDataSourceReplica = null;
    }
  }
}
