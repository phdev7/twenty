import { type IconComponent } from 'diex-ui/icon';
import { type ButtonAccent, type ButtonVariant } from 'diex-ui/input';

export type SettingsBillingPlanAction = {
  accent?: ButtonAccent;
  disabled?: boolean;
  Icon?: IconComponent;
  isLoading?: boolean;
  onClick?: () => void;
  title: string;
  variant: ButtonVariant;
};
