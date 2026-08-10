import { useMediaQuery } from 'react-responsive';
import { MOBILE_VIEWPORT } from 'diex-ui/theme-constants';

export const useIsMobile = () =>
  useMediaQuery({ query: `(max-width: ${MOBILE_VIEWPORT}px)` });
