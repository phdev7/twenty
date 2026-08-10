import { createContext, type ReactNode, useMemo, useState } from 'react';

export type DashboardPeriod =
  | 'ALL'
  | 'TODAY'
  | 'LAST_7_DAYS'
  | 'LAST_30_DAYS'
  | 'LAST_90_DAYS'
  | 'THIS_YEAR'
  | 'CUSTOM';

export type DashboardGlobalFilters = {
  period: DashboardPeriod;
  workspaceMemberId: string | null;
  customStartDate: string;
  customEndDate: string;
};

type DashboardGlobalFiltersContextValue = {
  isEnabled: boolean;
  filters: DashboardGlobalFilters;
  setFilters: (filters: DashboardGlobalFilters) => void;
};

export const DashboardGlobalFiltersContext =
  createContext<DashboardGlobalFiltersContextValue>({
    isEnabled: false,
    filters: {
      period: 'ALL',
      workspaceMemberId: null,
      customStartDate: '',
      customEndDate: '',
    },
    setFilters: () => undefined,
  });

export const DashboardGlobalFiltersProvider = ({
  children,
  isEnabled,
}: {
  children: ReactNode;
  isEnabled: boolean;
}) => {
  const [filters, setFilters] = useState<DashboardGlobalFilters>({
    period: 'ALL',
    workspaceMemberId: null,
    customStartDate: '',
    customEndDate: '',
  });

  const value = useMemo(
    () => ({ filters, isEnabled, setFilters }),
    [filters, isEnabled],
  );

  return (
    <DashboardGlobalFiltersContext.Provider value={value}>
      {children}
    </DashboardGlobalFiltersContext.Provider>
  );
};
