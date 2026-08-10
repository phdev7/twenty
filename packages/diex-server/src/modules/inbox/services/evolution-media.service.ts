import { Injectable } from '@nestjs/common';

import { EvolutionHttpService } from 'src/modules/inbox/services/evolution-http.service';
import { EvolutionProvisioningService } from 'src/modules/inbox/services/evolution-provisioning.service';
import { type EvolutionMedia } from 'src/modules/inbox/types/inbox-evolution.types';
import { readExternalMessageId } from 'src/modules/inbox/utils/evolution-payload.util';

const readString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

// Media is read from the provider every time it is needed and never stored: the
// provider is already the durable copy, and keeping a second one is what fills a
// disk with voice notes nobody opens twice.
@Injectable()
export class EvolutionMediaService {
  constructor(
    private readonly evolutionHttpService: EvolutionHttpService,
    private readonly evolutionProvisioningService: EvolutionProvisioningService,
  ) {}

  async fetchMediaBase64({
    workspaceId,
    providerMessageKey,
  }: {
    workspaceId: string;
    providerMessageKey: string | null | undefined;
  }): Promise<EvolutionMedia | null> {
    const externalMessageId = readExternalMessageId(providerMessageKey);

    if (!externalMessageId) {
      return null;
    }

    const configuration =
      await this.evolutionProvisioningService.resolveProvisioning(workspaceId);
    const response = await this.evolutionHttpService.request({
      baseUrl: configuration.baseUrl,
      path: `/chat/getBase64FromMediaMessage/${encodeURIComponent(configuration.instanceName)}`,
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        apikey: configuration.apiKey,
      },
      body: JSON.stringify({
        message: { key: { id: externalMessageId } },
        convertToMp4: false,
      }),
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json().catch(() => null)) as {
      base64?: unknown;
      mimetype?: unknown;
      mimeType?: unknown;
      fileName?: unknown;
    } | null;
    const base64 = readString(payload?.base64);

    if (!base64) {
      return null;
    }

    return {
      base64,
      mimeType:
        readString(payload?.mimetype) ??
        readString(payload?.mimeType) ??
        'application/octet-stream',
      fileName: readString(payload?.fileName),
    };
  }
}
