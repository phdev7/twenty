import { Injectable, Logger } from '@nestjs/common';

import semver from 'semver';
import * as z from 'zod';

import { type VersionInfoDTO } from 'src/engine/core-modules/admin-panel/dtos/version-info.dto';
import { SecureHttpClientService } from 'src/engine/core-modules/secure-http-client/secure-http-client.service';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';

const DIEX_IMAGE_REPOSITORY = 'phdev7/twenty-diex';
const DIEX_TAG_PREFIX = 'diex-v';

@Injectable()
export class AdminPanelVersionService {
  private readonly logger = new Logger(AdminPanelVersionService.name);

  constructor(
    private readonly twentyConfigService: TwentyConfigService,
    private readonly secureHttpClientService: SecureHttpClientService,
  ) {}

  async getVersionInfo(): Promise<VersionInfoDTO> {
    const currentVersion = this.twentyConfigService.get('APP_VERSION');

    try {
      const httpClient = this.secureHttpClientService.getHttpClient();

      // Compare against the Diex registry, not upstream Twenty: the release
      // counters are unrelated, and pointing the panel at Docker Hub told every
      // client's admin screen it was dozens of versions behind while leaking
      // that the product is a Twenty fork.
      const tokenResponse = await httpClient.get<unknown>(
        `https://ghcr.io/token?scope=repository:${DIEX_IMAGE_REPOSITORY}:pull&service=ghcr.io`,
      );
      const { data: tokenData } = z
        .object({ data: z.object({ token: z.string() }) })
        .parse(tokenResponse);

      const rawResponse = await httpClient.get<unknown>(
        `https://ghcr.io/v2/${DIEX_IMAGE_REPOSITORY}/tags/list`,
        { headers: { Authorization: `Bearer ${tokenData.token}` } },
      );
      const response = z
        .object({ data: z.object({ tags: z.array(z.string()) }) })
        .parse(rawResponse);

      const versions = response.data.tags
        .filter((tag) => tag.startsWith(DIEX_TAG_PREFIX))
        .map((tag) => tag.slice(DIEX_TAG_PREFIX.length))
        .filter((name) => semver.valid(name));

      if (versions.length === 0) {
        return { currentVersion, latestVersion: null };
      }

      versions.sort((a, b) => semver.compare(b, a));
      const latestVersion = versions[0];

      return { currentVersion, latestVersion };
    } catch (error) {
      this.logger.warn(
        `Failed to fetch latest Diex version from the container registry: ${error instanceof Error ? error.message : String(error)}`,
      );
      return { currentVersion, latestVersion: null };
    }
  }
}
