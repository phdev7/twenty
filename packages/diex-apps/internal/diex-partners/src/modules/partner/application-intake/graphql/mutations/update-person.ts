import type { CoreApiClient, CoreSchema } from 'diex-client-sdk/core';

export function updatePerson(
  client: CoreApiClient,
  id: string,
  data: CoreSchema.PersonUpdateInput,
) {
  return client.mutation({
    updatePerson: {
      __args: { id, data },
      id: true,
    },
  });
}
