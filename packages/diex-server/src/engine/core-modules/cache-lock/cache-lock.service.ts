import { Injectable, Logger } from '@nestjs/common';

import crypto from 'crypto';

import {
  CacheLockException,
  CacheLockExceptionCode,
} from 'src/engine/core-modules/cache-lock/exceptions/cache-lock.exception';
import { InjectCacheStorage } from 'src/engine/core-modules/cache-storage/decorators/cache-storage.decorator';
import { CacheStorageNamespace } from 'src/engine/core-modules/cache-storage/types/cache-storage-namespace.enum';
import { CacheStorageService } from 'src/engine/core-modules/cache-storage/services/cache-storage.service';

export type CacheLockOptions = {
  ms?: number;
  maxRetries?: number;
  renewalIntervalMs?: number;
  ttl?: number;
};

export type RenewableCacheLock = {
  assertOwnership: () => Promise<void>;
};

@Injectable()
export class CacheLockService {
  private readonly logger = new Logger(CacheLockService.name);

  constructor(
    @InjectCacheStorage(CacheStorageNamespace.EngineLock)
    private readonly cacheStorageService: CacheStorageService,
  ) {}

  async delay(ms: number) {
    return new Promise((res) => setTimeout(res, ms));
  }

  async withLock<T>(
    fn: () => Promise<T>,
    key: string,
    options?: CacheLockOptions,
  ): Promise<T> {
    const { ms = 100, maxRetries = 50, ttl = 5_500 } = options || {};

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const acquired = await this.cacheStorageService.acquireLock(key, ttl);

      if (acquired) {
        try {
          return await fn();
        } finally {
          try {
            await this.cacheStorageService.releaseLock(key);
          } catch (releaseError) {
            this.logger.warn(
              `Failed to release lock for key "${key}": ${releaseError}`,
            );
          }
        }
      }

      await this.delay(ms);
    }

    throw new CacheLockException(
      `Failed to acquire lock for key: ${key}`,
      CacheLockExceptionCode.LOCK_ACQUISITION_TIMEOUT,
    );
  }

  async withRenewableLock<T>(
    fn: (lock: RenewableCacheLock) => Promise<T>,
    key: string,
    options?: CacheLockOptions,
  ): Promise<T> {
    const {
      ms = 100,
      maxRetries = 300,
      ttl = 30_000,
      renewalIntervalMs = Math.max(1_000, Math.floor(ttl / 3)),
    } = options ?? {};
    const ownerToken = crypto.randomUUID();

    let acquired = false;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      acquired = await this.cacheStorageService.acquireOwnedLock(
        key,
        ownerToken,
        ttl,
      );

      if (acquired) {
        break;
      }

      await this.delay(ms);
    }

    if (!acquired) {
      throw new CacheLockException(
        `Failed to acquire renewable lock for key: ${key}`,
        CacheLockExceptionCode.LOCK_ACQUISITION_TIMEOUT,
      );
    }

    let ownershipError: CacheLockException | null = null;
    let heartbeatTimer: ReturnType<typeof setTimeout> | null = null;
    let heartbeatPromise: Promise<void> | null = null;
    let stopped = false;

    const markOwnershipLost = (error?: unknown): CacheLockException => {
      const reason =
        error instanceof Error ? `: ${error.message}` : ' during renewal';

      ownershipError ??= new CacheLockException(
        `Lost ownership of renewable lock for key "${key}"${reason}`,
        CacheLockExceptionCode.LOCK_OWNERSHIP_LOST,
      );

      return ownershipError;
    };

    const renewOwnership = async (): Promise<void> => {
      if (ownershipError) {
        throw ownershipError;
      }

      try {
        const renewed = await this.cacheStorageService.renewOwnedLock(
          key,
          ownerToken,
          ttl,
        );

        if (!renewed) {
          throw markOwnershipLost();
        }
      } catch (error) {
        throw markOwnershipLost(error);
      }
    };

    const scheduleHeartbeat = (): void => {
      if (stopped || ownershipError) {
        return;
      }

      heartbeatTimer = setTimeout(() => {
        heartbeatPromise = renewOwnership()
          .catch(() => undefined)
          .finally(() => {
            heartbeatPromise = null;
            scheduleHeartbeat();
          });
      }, renewalIntervalMs);
    };

    scheduleHeartbeat();

    try {
      const result = await fn({ assertOwnership: renewOwnership });

      await renewOwnership();

      return result;
    } finally {
      stopped = true;

      if (heartbeatTimer) {
        clearTimeout(heartbeatTimer);
      }

      await heartbeatPromise;

      try {
        await this.cacheStorageService.releaseOwnedLock(key, ownerToken);
      } catch (releaseError) {
        this.logger.warn(
          `Failed to conditionally release renewable lock for key "${key}": ${releaseError}`,
        );
      }
    }
  }
}
