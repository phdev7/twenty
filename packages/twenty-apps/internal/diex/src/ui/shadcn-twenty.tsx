import {
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from 'react';

import { brand, motion, radii } from 'src/ui/diex-tokens';
import { safeThemeCssVariables as themeCssVariables } from 'src/ui/safe-theme-css-variables';

type SurfaceVariant = 'default' | 'muted' | 'accent' | 'danger';
type Tone =
  'blue' | 'green' | 'orange' | 'red' | 'yellow' | 'turquoise' | 'gray';

const border = `1px solid ${themeCssVariables.border.color.light}`;

const surfaceStyles: Record<SurfaceVariant, CSSProperties> = {
  default: {
    background: themeCssVariables.background.primary,
    border,
  },
  muted: {
    background: themeCssVariables.background.secondary,
    border,
  },
  accent: {
    background: themeCssVariables.background.transparent.blue,
    border: `1px solid ${themeCssVariables.border.color.blue}`,
  },
  danger: {
    background: themeCssVariables.background.transparent.danger,
    border: `1px solid ${themeCssVariables.border.color.danger}`,
  },
};

const toneStyles: Record<Tone, CSSProperties> = {
  blue: {
    background: themeCssVariables.tag.background.blue,
    color: themeCssVariables.tag.text.blue,
  },
  green: {
    background: themeCssVariables.tag.background.green,
    color: themeCssVariables.tag.text.green,
  },
  orange: {
    background: themeCssVariables.tag.background.orange,
    color: themeCssVariables.tag.text.orange,
  },
  red: {
    background: themeCssVariables.tag.background.red,
    color: themeCssVariables.tag.text.red,
  },
  yellow: {
    background: themeCssVariables.tag.background.yellow,
    color: themeCssVariables.tag.text.yellow,
  },
  turquoise: {
    background: themeCssVariables.tag.background.turquoise,
    color: themeCssVariables.tag.text.turquoise,
  },
  gray: {
    background: themeCssVariables.tag.background.gray,
    color: themeCssVariables.tag.text.gray,
  },
};

type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: SurfaceVariant;
};

export const Card = ({ variant = 'default', style, ...props }: CardProps) => (
  <div
    {...props}
    style={{
      ...surfaceStyles[variant],
      borderRadius: radii.surface,
      boxShadow: themeCssVariables.boxShadow.light,
      boxSizing: 'border-box',
      color: themeCssVariables.font.color.primary,
      ...style,
    }}
  />
);

export const CardHeader = ({
  style,
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div
    {...props}
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: themeCssVariables.spacing[1],
      padding: themeCssVariables.spacing[4],
      ...style,
    }}
  />
);

export const CardTitle = ({
  style,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) => (
  <h3
    {...props}
    style={{
      color: themeCssVariables.font.color.primary,
      fontSize: themeCssVariables.font.size.md,
      fontWeight: themeCssVariables.font.weight.semiBold,
      margin: 0,
      ...style,
    }}
  />
);

export const CardDescription = ({
  style,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) => (
  <p
    {...props}
    style={{
      color: themeCssVariables.font.color.tertiary,
      fontSize: themeCssVariables.font.size.xs,
      lineHeight: 1.45,
      margin: 0,
      ...style,
    }}
  />
);

export const CardContent = ({
  style,
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div
    {...props}
    style={{
      padding: `0 ${themeCssVariables.spacing[4]} ${themeCssVariables.spacing[4]}`,
      ...style,
    }}
  />
);

export const Badge = ({
  children,
  tone = 'gray',
  style,
}: {
  children: ReactNode;
  tone?: Tone;
  style?: CSSProperties;
}) => (
  <span
    style={{
      ...toneStyles[tone],
      alignItems: 'center',
      borderRadius: radii.pill,
      display: 'inline-flex',
      fontSize: themeCssVariables.font.size.xxs,
      fontWeight: themeCssVariables.font.weight.medium,
      lineHeight: 1,
      maxWidth: '100%',
      padding: `${themeCssVariables.spacing[1]} ${themeCssVariables.spacing[2]}`,
      whiteSpace: 'nowrap',
      ...style,
    }}
  >
    {children}
  </span>
);

export const Progress = ({
  value,
  tone = 'blue',
  style,
}: {
  value: number;
  tone?: Tone;
  style?: CSSProperties;
}) => {
  const normalizedValue = Math.max(0, Math.min(100, value));

  return (
    <div
      aria-label={`${Math.round(normalizedValue)}%`}
      style={{
        background: themeCssVariables.background.tertiary,
        borderRadius: radii.pill,
        height: themeCssVariables.spacing[1],
        overflow: 'hidden',
        width: '100%',
        ...style,
      }}
    >
      <div
        style={{
          ...toneStyles[tone],
          height: '100%',
          transition: 'width 180ms ease',
          width: `${normalizedValue}%`,
        }}
      />
    </div>
  );
};

export const Separator = ({ style }: { style?: CSSProperties }) => (
  <div
    aria-hidden="true"
    style={{
      background: themeCssVariables.border.color.light,
      height: 1,
      width: '100%',
      ...style,
    }}
  />
);

export const Skeleton = ({ style }: { style?: CSSProperties }) => (
  <div
    aria-hidden="true"
    style={{
      background: themeCssVariables.background.tertiary,
      borderRadius: radii.control,
      minHeight: themeCssVariables.spacing[8],
      ...style,
    }}
  />
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'outline' | 'ghost' | 'danger';
};

// A front component renders through a worker, so there is no stylesheet to hold
// :hover or :focus-visible. The states a button must have are tracked here
// instead of being dropped.
export const Button = ({
  variant = 'default',
  style,
  type = 'button',
  onPointerEnter,
  onPointerLeave,
  onPointerDown,
  onPointerUp,
  onFocus,
  onBlur,
  ...props
}: ButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const isInteractive = props.disabled !== true;
  const isActive = isInteractive && isPressed;
  const isHighlighted = isInteractive && isHovered;

  const variantStyle: CSSProperties =
    variant === 'default'
      ? {
          background: isActive
            ? brand.solidActive
            : isHighlighted
              ? brand.solidHover
              : brand.solid,
          border: '1px solid transparent',
          color: brand.onSolid,
        }
      : variant === 'danger'
        ? {
            background: themeCssVariables.background.transparent.danger,
            border: `1px solid ${themeCssVariables.border.color.danger}`,
            color: themeCssVariables.font.color.danger,
          }
        : variant === 'ghost'
          ? {
              background: isHighlighted
                ? themeCssVariables.background.transparent.light
                : 'transparent',
              border: '1px solid transparent',
              color: themeCssVariables.font.color.secondary,
            }
          : {
              background: isHighlighted
                ? themeCssVariables.background.tertiary
                : themeCssVariables.background.secondary,
              border,
              color: themeCssVariables.font.color.secondary,
            };

  return (
    <button
      {...props}
      type={type}
      onPointerEnter={(event) => {
        setIsHovered(true);
        onPointerEnter?.(event);
      }}
      onPointerLeave={(event) => {
        setIsHovered(false);
        setIsPressed(false);
        onPointerLeave?.(event);
      }}
      onPointerDown={(event) => {
        setIsPressed(true);
        onPointerDown?.(event);
      }}
      onPointerUp={(event) => {
        setIsPressed(false);
        onPointerUp?.(event);
      }}
      onFocus={(event) => {
        setIsFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setIsFocused(false);
        onBlur?.(event);
      }}
      style={{
        ...variantStyle,
        alignItems: 'center',
        borderRadius: radii.control,
        boxShadow: isFocused && isInteractive ? brand.focusRing : 'none',
        cursor: isInteractive ? 'pointer' : 'not-allowed',
        display: 'inline-flex',
        fontFamily: themeCssVariables.font.family,
        fontSize: themeCssVariables.font.size.xs,
        fontWeight: themeCssVariables.font.weight.medium,
        gap: themeCssVariables.spacing[1],
        height: themeCssVariables.spacing[8],
        justifyContent: 'center',
        opacity: isInteractive ? 1 : 0.55,
        outline: 'none',
        padding: `0 ${themeCssVariables.spacing[3]}`,
        transition: motion.control,
        ...style,
      }}
    />
  );
};
