import IconDiexStarRaw from '@assets/icons/diex-star.svg?react';
import { type IconComponentProps } from '@ui/icon/types/IconComponent';
import { useTheme } from '@ui/theme-constants';

type IconDiexStarProps = Pick<IconComponentProps, 'size' | 'stroke'>;

export const IconDiexStar = (props: IconDiexStarProps) => {
  const theme = useTheme();
  const size = props.size ?? 24;
  const stroke = props.stroke ?? theme.icon.stroke.md;

  return <IconDiexStarRaw height={size} width={size} strokeWidth={stroke} />;
};
