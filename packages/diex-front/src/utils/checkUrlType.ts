import { LinkType, SOCIAL_LINK_PROVIDERS } from 'diex-ui/navigation';

export const checkUrlType = (url: string) => {
  const provider = SOCIAL_LINK_PROVIDERS.find((socialLinkProvider) =>
    socialLinkProvider.detectPattern.test(url),
  );

  return provider?.type ?? LinkType.Url;
};
