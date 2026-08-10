import IconDiexStarFilledRaw from '@assets/icons/diex-star-filled.svg?react';
import { type IconComponentProps } from '@ui/icon/types/IconComponent';
import { useTheme } from '@ui/theme-constants';

type IconDiexStarFilledProps = Pick<IconComponentProps, 'size' | 'stroke'>;

export const IconDiexStarFilled = (props: IconDiexStarFilledProps) => {
  const theme = useTheme();
  const size = props.size ?? 24;
  const stroke = props.stroke ?? theme.icon.stroke.md;

  return (
    <IconDiexStarFilledRaw height={size} width={size} strokeWidth={stroke} />
  );
};
