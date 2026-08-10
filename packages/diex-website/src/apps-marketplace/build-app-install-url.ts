const DEFAULT_DIEX_APP_BASE_URL = 'https://app.diex.com';

export const buildAppInstallUrl = (universalIdentifier: string): string => {
  const baseUrl =
    process.env.DIEX_APP_BASE_URL ?? DEFAULT_DIEX_APP_BASE_URL;

  const returnToPath = `/settings/applications/available/${universalIdentifier}`;

  return `${baseUrl.replace(/\/$/, '')}/?returnToPath=${encodeURIComponent(returnToPath)}`;
};
