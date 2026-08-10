import { Injectable } from '@nestjs/common';

import { fromNodeProviderChain } from '@aws-sdk/credential-providers';

import { type StorageDriver } from 'src/engine/core-modules/file-storage/drivers/interfaces/storage-driver.interface';
import { StorageDriverType } from 'src/engine/core-modules/file-storage/interfaces/file-storage.interface';

import { LocalDriver } from 'src/engine/core-modules/file-storage/drivers/local.driver';
import { S3Driver } from 'src/engine/core-modules/file-storage/drivers/s3.driver';
import { ValidatedStorageDriver } from 'src/engine/core-modules/file-storage/drivers/validated-storage.driver';
import { DriverFactoryBase } from 'src/engine/core-modules/diex-config/dynamic-factory.base';
import { ConfigVariablesGroup } from 'src/engine/core-modules/diex-config/enums/config-variables-group.enum';
import { ConfigGroupHashService } from 'src/engine/core-modules/diex-config/services/config-group-hash.service';
import { DiexConfigService } from 'src/engine/core-modules/diex-config/diex-config.service';
import { resolveAbsolutePath } from 'src/utils/resolve-absolute-path';

@Injectable()
export class FileStorageDriverFactory extends DriverFactoryBase<StorageDriver> {
  constructor(
    diexConfigService: DiexConfigService,
    configGroupHashService: ConfigGroupHashService,
  ) {
    super(diexConfigService, configGroupHashService);
  }

  protected buildConfigKey(): string {
    const storageType = this.diexConfigService.get('STORAGE_TYPE');

    if (storageType === StorageDriverType.LOCAL) {
      const storagePath = this.diexConfigService.get('STORAGE_LOCAL_PATH');

      return `local|${storagePath}`;
    }

    if (storageType === StorageDriverType.S_3) {
      const storageConfigHash = this.configGroupHashService.computeHash(
        ConfigVariablesGroup.STORAGE_CONFIG,
      );

      return `s3|${storageConfigHash}`;
    }

    throw new Error(`Unsupported storage type: ${storageType}`);
  }

  protected createDriver(): StorageDriver {
    const storageType = this.diexConfigService.get('STORAGE_TYPE');
    let rawDriver: StorageDriver;

    switch (storageType) {
      case StorageDriverType.LOCAL: {
        const storagePath = this.diexConfigService.get('STORAGE_LOCAL_PATH');

        rawDriver = new LocalDriver({
          storagePath: resolveAbsolutePath(storagePath),
        });
        break;
      }

      case StorageDriverType.S_3: {
        const bucketName = this.diexConfigService.get('STORAGE_S3_NAME');
        const endpoint = this.diexConfigService.get('STORAGE_S3_ENDPOINT');
        const region = this.diexConfigService.get('STORAGE_S3_REGION');
        const accessKeyId = this.diexConfigService.get(
          'STORAGE_S3_ACCESS_KEY_ID',
        );
        const secretAccessKey = this.diexConfigService.get(
          'STORAGE_S3_SECRET_ACCESS_KEY',
        );
        const presignEnabled = this.diexConfigService.get(
          'STORAGE_S3_PRESIGNED_URL_ENABLED',
        );
        const presignEndpointOverride = this.diexConfigService.get(
          'STORAGE_S3_PRESIGNED_URL_BASE',
        );

        rawDriver = new S3Driver({
          bucketName: bucketName ?? '',
          endpoint: endpoint,
          presignEnabled,
          presignEndpoint: presignEndpointOverride || undefined,
          credentials: accessKeyId
            ? { accessKeyId, secretAccessKey }
            : fromNodeProviderChain({ clientConfig: { region } }),
          forcePathStyle: true,
          region: region ?? '',
        });
        break;
      }

      default:
        throw new Error(`Invalid storage driver type: ${storageType}`);
    }

    return new ValidatedStorageDriver(rawDriver);
  }
}
