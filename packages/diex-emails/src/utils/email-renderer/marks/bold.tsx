import { type ReactNode } from 'react';
import { type TipTapMark } from 'diex-shared/utils';

export const bold = (_: TipTapMark, children: ReactNode): ReactNode => {
  return <strong>{children}</strong>;
};
