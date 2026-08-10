import { type ReactNode } from 'react';
import { type TipTapMark } from 'diex-shared/utils';

export const underline = (_: TipTapMark, children: ReactNode): ReactNode => {
  return <span style={{ textDecoration: 'underline' }}>{children}</span>;
};
