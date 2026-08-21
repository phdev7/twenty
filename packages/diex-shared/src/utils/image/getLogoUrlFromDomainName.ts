import { DIEX_ICONS_BASE_URL } from '../../constants/DiexIconsBaseUrl';

export const sanitizeURL = (link: string | null | undefined) => {
  return link
    ? link.replace(/(https?:\/\/)|(www\.)/g, '').replace(/\/$/, '')
    : '';
};

export const getLogoUrlFromDomainName = (
  domainName?: string,
): string | undefined => {
  const sanitizedDomain = sanitizeURL(domainName);
  return sanitizedDomain
    ? `${DIEX_ICONS_BASE_URL}/${sanitizedDomain}`
    : undefined;
};
