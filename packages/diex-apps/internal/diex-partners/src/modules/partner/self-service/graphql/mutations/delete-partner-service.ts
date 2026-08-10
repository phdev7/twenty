import { type CoreApiClient } from 'diex-client-sdk/core';

export function deletePartnerService(client: CoreApiClient, id: string) {
  return client.mutation({
    deletePartnerService: { __args: { id }, id: true },
  });
}
