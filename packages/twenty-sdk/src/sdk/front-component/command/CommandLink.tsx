import { useEffect, useState } from 'react';

import { type NavigateOptions, type PathParam } from 'react-router-dom';
import { type AppPath } from 'twenty-shared/types';
import { navigate, unmountFrontComponent, useFrontComponentId } from '..';

type AppPathValue = `${AppPath}`;

export type CommandLinkProps<T extends AppPathValue> = {
  to: T;
  params?: { [key in PathParam<T>]: string | null };
  queryParams?: Record<string, any>;
  options?: NavigateOptions;
};

export const CommandLink = <T extends AppPathValue>({
  to,
  params,
  queryParams,
  options,
}: CommandLinkProps<T>) => {
  const [hasExecuted, setHasExecuted] = useState(false);

  const frontComponentId = useFrontComponentId();

  useEffect(() => {
    if (hasExecuted) {
      return;
    }

    setHasExecuted(true);

    const run = async () => {
      await navigate(to, params, queryParams, options);

      await unmountFrontComponent();
    };

    run();
  }, [to, params, queryParams, options, hasExecuted, frontComponentId]);

  return null;
};
