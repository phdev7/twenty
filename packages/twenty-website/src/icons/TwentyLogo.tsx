import { styled } from '@linaria/react';

const LogoImage = styled.img`
  display: block;
  object-fit: contain;
`;

export type TwentyLogoProps = {
  sizePx?: number;
};

export function TwentyLogo({ sizePx = 40 }: TwentyLogoProps) {
  return (
    <LogoImage
      alt="Diex CRM"
      height={sizePx}
      src="/images/core/logo.svg"
      width={sizePx}
    />
  );
}
