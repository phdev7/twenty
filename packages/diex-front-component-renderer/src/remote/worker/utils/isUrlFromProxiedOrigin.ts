import { getURLSafely, isDefined } from 'diex-shared/utils';

export const isUrlFromProxiedOrigin = (
  url: string,
  proxiedOrigins: string[],
): boolean => {
  const origin = getURLSafely(url)?.origin;

  return isDefined(origin) && proxiedOrigins.includes(origin);
};
