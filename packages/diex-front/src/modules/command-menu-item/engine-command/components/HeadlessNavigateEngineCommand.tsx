import { HeadlessEngineCommandWrapperEffect } from '@/command-menu-item/engine-command/components/HeadlessEngineCommandWrapperEffect';
import { type PathParam, useNavigate } from 'react-router-dom';
import { type AppPath } from 'diex-shared/types';
import { getAppPath } from 'diex-shared/utils';

export const HeadlessNavigateEngineCommand = <T extends AppPath>({
  to,
  params,
  queryParams,
}: {
  to: T;
  params?: { [key in PathParam<T>]: string | null };
  queryParams?: Record<string, any>;
}) => {
  const navigate = useNavigate();
  const path = getAppPath(to, params, queryParams);

  // eslint-disable-next-line diex/no-navigate-prefer-link
  const onExecute = () => {
    navigate(path);
  };

  return <HeadlessEngineCommandWrapperEffect execute={onExecute} />;
};
