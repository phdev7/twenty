import { type CoreApiClient, type CoreSchema } from 'diex-client-sdk/core';

export function createPartnerService(
  client: CoreApiClient,
  data: CoreSchema.PartnerServiceCreateInput,
) {
  return client.mutation({
    createPartnerService: { __args: { data }, id: true },
  });
}
