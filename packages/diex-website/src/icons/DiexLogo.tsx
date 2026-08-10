import { styled } from '@linaria/react';

const LogoImage = styled.img`
  display: block;
  object-fit: contain;
`;

export type DiexLogoProps = {
  sizePx?: number;
};

export function DiexLogo({ sizePx = 40 }: DiexLogoProps) {
  return (
    <LogoImage
      alt="Diex CRM"
      height={sizePx}
      src="/images/core/logo.svg"
      width={sizePx}
    />
  );
}
