type AppKeyValueScope = 'WORKSPACE' | 'SERVER';

type AppKeyValue = {
  key: string;
  value: unknown;
  scope: AppKeyValueScope;
};

type KvOptions = {
  scope?: AppKeyValueScope;
};

const DEFAULT_SCOPE: AppKeyValueScope = 'WORKSPACE';

const getRuntimeCredentials = (
  caller: string,
): { apiUrl: string; accessToken: string } => {
  const apiUrl = process.env.TWENTY_API_URL?.replace(/\/+$/, '');
  const accessToken = process.env.TWENTY_APP_ACCESS_TOKEN;

  if (!apiUrl || !accessToken) {
    throw new Error(
      `${caller} requires the Twenty application runtime credentials.`,
    );
  }

  return { apiUrl, accessToken };
};

const postMetadata = async <TData, TVariables>({
  caller,
  query,
  variables,
}: {
  caller: string;
  query: string;
  variables: TVariables;
}): Promise<TData> => {
  const { apiUrl, accessToken } = getRuntimeCredentials(caller);
  const response = await fetch(`${apiUrl}/metadata`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
    redirect: 'error',
  });

  if (!response.ok) {
    throw new Error(`${caller} failed with HTTP ${response.status}.`);
  }

  const body = (await response.json()) as {
    data?: TData;
    errors?: Array<{ message?: unknown }>;
  };

  if (body.errors?.length) {
    const messages = body.errors
      .map(({ message }) =>
        typeof message === 'string' ? message.slice(0, 300) : 'Unknown error',
      )
      .join(', ');

    throw new Error(`${caller} failed: ${messages}`);
  }

  if (!body.data) {
    throw new Error(`${caller} failed: response contained no data.`);
  }

  return body.data;
};

export const appKeyValue = {
  async get<TValue = unknown>(
    key: string,
    options?: KvOptions,
  ): Promise<TValue | null> {
    const { appKeyValue: result } = await postMetadata<
      { appKeyValue: AppKeyValue | null },
      { key: string; scope: AppKeyValueScope }
    >({
      caller: 'appKeyValue.get',
      query: `
        query GetAppKeyValue($key: String!, $scope: AppKeyValueScope) {
          appKeyValue(key: $key, scope: $scope) {
            value
          }
        }
      `,
      variables: {
        key,
        scope: options?.scope ?? DEFAULT_SCOPE,
      },
    });

    return (result?.value ?? null) as TValue | null;
  },

  async set<TValue>(
    key: string,
    value: TValue,
    options?: KvOptions,
  ): Promise<void> {
    await postMetadata<
      { setAppKeyValue: AppKeyValue },
      {
        input: {
          key: string;
          value: TValue;
          scope: AppKeyValueScope;
        };
      }
    >({
      caller: 'appKeyValue.set',
      query: `
        mutation SetAppKeyValue($input: SetAppKeyValueInput!) {
          setAppKeyValue(input: $input) {
            key
          }
        }
      `,
      variables: {
        input: {
          key,
          value,
          scope: options?.scope ?? DEFAULT_SCOPE,
        },
      },
    });
  },

  async delete(key: string, options?: KvOptions): Promise<boolean> {
    const { deleteAppKeyValue } = await postMetadata<
      { deleteAppKeyValue: boolean },
      { key: string; scope: AppKeyValueScope }
    >({
      caller: 'appKeyValue.delete',
      query: `
        mutation DeleteAppKeyValue($key: String!, $scope: AppKeyValueScope) {
          deleteAppKeyValue(key: $key, scope: $scope)
        }
      `,
      variables: {
        key,
        scope: options?.scope ?? DEFAULT_SCOPE,
      },
    });

    return deleteAppKeyValue;
  },
};
