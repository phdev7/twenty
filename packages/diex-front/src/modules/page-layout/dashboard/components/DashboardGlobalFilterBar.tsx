import { currentWorkspaceMembersState } from '@/auth/states/currentWorkspaceMembersState';
import {
  DashboardGlobalFiltersContext,
  type DashboardPeriod,
} from '@/page-layout/dashboard/contexts/DashboardGlobalFiltersContext';
import { Select } from '@/ui/input/components/Select';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { styled } from '@linaria/react';
import { useContext } from 'react';
import { IconCalendar, IconFilter, IconUser } from 'diex-ui/icon';
import { type SelectOption } from 'diex-ui/input';
import { themeCssVariables } from 'diex-ui/theme-constants';

const StyledBar = styled.div`
  align-items: center;
  background: ${themeCssVariables.background.primary};
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
  min-height: 44px;
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
`;

const StyledLabel = styled.div`
  align-items: center;
  color: ${themeCssVariables.font.color.secondary};
  display: flex;
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  gap: ${themeCssVariables.spacing[1]};
  margin-right: ${themeCssVariables.spacing[1]};
`;

const StyledSelectContainer = styled.div`
  min-width: 170px;
`;

const StyledDateInput = styled.input`
  background: ${themeCssVariables.background.transparent.light};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.primary};
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.sm};
  height: 30px;
  padding: 0 ${themeCssVariables.spacing[2]};
`;

const periodOptions: SelectOption<DashboardPeriod>[] = [
  { label: 'Todo o período', value: 'ALL', Icon: IconCalendar },
  { label: 'Hoje', value: 'TODAY', Icon: IconCalendar },
  { label: 'Últimos 7 dias', value: 'LAST_7_DAYS', Icon: IconCalendar },
  { label: 'Últimos 30 dias', value: 'LAST_30_DAYS', Icon: IconCalendar },
  { label: 'Últimos 90 dias', value: 'LAST_90_DAYS', Icon: IconCalendar },
  { label: 'Este ano', value: 'THIS_YEAR', Icon: IconCalendar },
  { label: 'Período personalizado', value: 'CUSTOM', Icon: IconCalendar },
];

export const DashboardGlobalFilterBar = () => {
  const { filters, setFilters } = useContext(DashboardGlobalFiltersContext);
  const workspaceMembers = useAtomStateValue(currentWorkspaceMembersState);

  const workspaceMemberOptions: SelectOption<string | null>[] = [
    { label: 'Todos os usuários', value: null, Icon: IconUser },
    ...workspaceMembers.map((member) => ({
      label:
        `${member.name.firstName ?? ''} ${member.name.lastName ?? ''}`.trim() ||
        member.userEmail,
      value: member.id,
      Icon: IconUser,
    })),
  ];

  return (
    <StyledBar className="page-layout-dashboard-global-filters">
      <StyledLabel>
        <IconFilter size={16} />
        Filtros do dashboard
      </StyledLabel>

      <StyledSelectContainer>
        <Select
          dropdownId="dashboard-global-period-filter"
          value={filters.period}
          options={periodOptions}
          onChange={(period) => setFilters({ ...filters, period })}
          selectSizeVariant="small"
          fullWidth
        />
      </StyledSelectContainer>

      <StyledSelectContainer>
        <Select
          dropdownId="dashboard-global-user-filter"
          value={filters.workspaceMemberId}
          options={workspaceMemberOptions}
          onChange={(workspaceMemberId) =>
            setFilters({ ...filters, workspaceMemberId })
          }
          selectSizeVariant="small"
          fullWidth
          withSearchInput
        />
      </StyledSelectContainer>

      {filters.period === 'CUSTOM' && (
        <>
          <StyledDateInput
            aria-label="Data inicial do dashboard"
            type="date"
            value={filters.customStartDate}
            onChange={(event) =>
              setFilters({
                ...filters,
                customStartDate: event.target.value,
              })
            }
          />
          <StyledDateInput
            aria-label="Data final do dashboard"
            type="date"
            value={filters.customEndDate}
            onChange={(event) =>
              setFilters({
                ...filters,
                customEndDate: event.target.value,
              })
            }
          />
        </>
      )}
    </StyledBar>
  );
};
