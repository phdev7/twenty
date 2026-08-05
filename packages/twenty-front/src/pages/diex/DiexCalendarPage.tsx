import { styled } from '@linaria/react';
import { useMemo, useState } from 'react';
import { gql, useQuery } from '@apollo/client';

import {
  CommandCenterCard,
  CommandCenterEmptyState,
  CommandCenterGrid,
  CommandCenterPage,
  CommandCenterLoadingState,
  CommandCenterMetric,
  CommandCenterMetrics,
} from '@/diex-command-centers/components/CommandCenterLayout';
import { useOpenRecordInSidePanel } from '@/side-panel/hooks/useOpenRecordInSidePanel';
import { Button } from 'twenty-ui';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const CALENDAR_TASKS_QUERY = gql`
  query DiexCalendarTasks {
    tasks(first: 500) {
      edges {
        node {
          id
          title
          dueAt
          status
          assignee {
            id
            name {
              firstName
              lastName
            }
          }
        }
      }
    }
    workspaceMembers(first: 200) {
      edges {
        node {
          id
          name {
            firstName
            lastName
          }
        }
      }
    }
  }
`;

const StyledFilters = styled.div`
  display: flex;
  align-items: center;
  gap: ${themeCssVariables.spacing[4]};
  margin-bottom: ${themeCssVariables.spacing[4]};
`;

const StyledSelect = styled.select`
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: 4px;
  min-height: ${themeCssVariables.spacing[8]};
  padding: 0 ${themeCssVariables.spacing[2]};
  font-family: inherit;
  color: ${themeCssVariables.font.color.primary};
  background: ${themeCssVariables.background.secondary};
`;

const StyledHeaderNav = styled.div`
  display: flex;
  align-items: center;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledMonthTitle = styled.h2`
  font-size: ${themeCssVariables.font.size.lg};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  color: ${themeCssVariables.font.color.primary};
  margin: 0 ${themeCssVariables.spacing[2]};
  min-width: 150px;
  text-align: center;
`;

const CalendarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background-color: ${themeCssVariables.border.color.light};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  overflow: hidden;
  margin-top: ${themeCssVariables.spacing[2]};
`;

const CalendarHeaderCell = styled.div`
  background-color: ${themeCssVariables.background.secondary};
  padding: ${themeCssVariables.spacing[2]};
  text-align: center;
  font-weight: ${themeCssVariables.font.weight.medium};
  font-size: ${themeCssVariables.font.size.xs};
  color: ${themeCssVariables.font.color.secondary};
`;

const CalendarCell = styled.div<{ isCurrentMonth: boolean; isToday: boolean }>`
  background-color: ${({ isToday }) =>
    isToday
      ? themeCssVariables.background.transparent.blue
      : themeCssVariables.background.primary};
  min-height: 120px;
  padding: ${themeCssVariables.spacing[2]};
  display: flex;
  flex-direction: column;
  opacity: ${({ isCurrentMonth }) => (isCurrentMonth ? 1 : 0.4)};
  border: 1px solid transparent;
  &:hover {
    border-color: ${themeCssVariables.border.color.medium};
  }
`;

const CellHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${themeCssVariables.spacing[1]};
`;

const DayNumber = styled.span<{ isToday: boolean }>`
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${({ isToday }) =>
    isToday ? themeCssVariables.font.weight.bold : themeCssVariables.font.weight.regular};
  color: ${({ isToday }) =>
    isToday ? themeCssVariables.color.blue : themeCssVariables.font.color.secondary};
`;

const TaskList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
  flex: 1;
`;

const TaskItem = styled.div<{ status: string }>`
  font-size: ${themeCssVariables.font.size.xxs};
  padding: 4px;
  border-radius: 4px;
  background-color: ${({ status }) =>
    status === 'COMPLETED'
      ? themeCssVariables.background.transparent.green
      : themeCssVariables.background.transparent.orange};
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border-left: 3px solid
    ${({ status }) => (status === 'COMPLETED' ? themeCssVariables.color.green : themeCssVariables.color.orange)};
  &:hover {
    filter: brightness(0.95);
  }
`;

interface Task {
  id: string;
  title: string;
  dueAt: string;
  status: string;
  assignee?: {
    id: string;
    name: {
      firstName: string;
      lastName: string;
    };
  } | null;
}

interface WorkspaceMember {
  id: string;
  name: {
    firstName: string;
    lastName: string;
  };
}

export const DiexCalendarPage = () => {
  const { data, loading, error } = useQuery<{
    tasks: { edges: Array<{ node: Task }> };
    workspaceMembers: { edges: Array<{ node: WorkspaceMember }> };
  }>(CALENDAR_TASKS_QUERY);

  const { openRecordInSidePanel } = useOpenRecordInSidePanel();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>('ALL');

  const tasks = useMemo(() => {
    return data?.tasks?.edges?.map(({ node }) => node) ?? [];
  }, [data]);

  const workspaceMembers = useMemo(() => {
    return data?.workspaceMembers?.edges?.map(({ node }) => node) ?? [];
  }, [data]);

  const filteredTasks = useMemo(() => {
    if (selectedAssigneeId === 'ALL') return tasks;
    return tasks.filter((task) => task.assignee?.id === selectedAssigneeId);
  }, [tasks, selectedAssigneeId]);

  const monthNames = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];

  const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const getDaysInMonth = (year: number, month: number) => {
    const date = new Date(year, month, 1);
    const days = [];
    // Prev month days to fill week start
    const firstDayIndex = date.getDay();
    const prevMonthLastDate = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex; i > 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDate - i + 1),
        isCurrentMonth: false,
      });
    }
    // Current month days
    const lastDate = new Date(year, month + 1, 0).getDate();
    for (let i = 1; i <= lastDate; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }
    // Next month days to fill week end
    const totalCells = 42; // 6 rows of 7 days
    const nextMonthDays = totalCells - days.length;
    for (let i = 1; i <= nextMonthDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }
    return days;
  };

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const calendarDays = getDaysInMonth(currentYear, currentMonth);

  const prevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleTaskClick = (taskId: string) => {
    openRecordInSidePanel({
      recordId: taskId,
      objectNameSingular: 'task',
    });
  };

  const metrics = useMemo(() => {
    const total = filteredTasks.length;
    const completed = filteredTasks.filter((t) => t.status === 'COMPLETED').length;
    const pending = total - completed;
    return { total, completed, pending };
  }, [filteredTasks]);

  if (loading) return <CommandCenterLoadingState />;
  if (error) return <CommandCenterEmptyState message="Não foi possível carregar a agenda." />;

  return (
    <CommandCenterPage title="Agenda de Tarefas" showBackButton={false}>
      <CommandCenterMetrics>
        <CommandCenterMetric title="Total de Tarefas" value={metrics.total} />
        <CommandCenterMetric title="Concluídas" value={metrics.completed} trend="up" />
        <CommandCenterMetric title="Pendentes" value={metrics.pending} trend="down" />
      </CommandCenterMetrics>

      <CommandCenterCard title="Visualização Mensal">
        <StyledFilters>
          <StyledSelect
            value={selectedAssigneeId}
            onChange={(e) => setSelectedAssigneeId(e.target.value)}
          >
            <option value="ALL">Todos os Usuários</option>
            {workspaceMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name.firstName} {member.name.lastName}
              </option>
            ))}
          </StyledSelect>

          <StyledHeaderNav>
            <Button title="Anterior" size="small" variant="secondary" onClick={prevMonth} />
            <StyledMonthTitle>
              {monthNames[currentMonth]} {currentYear}
            </StyledMonthTitle>
            <Button title="Próximo" size="small" variant="secondary" onClick={nextMonth} />
          </StyledHeaderNav>
        </StyledFilters>

        <CalendarGrid>
          {daysOfWeek.map((day) => (
            <CalendarHeaderCell key={day}>{day}</CalendarHeaderCell>
          ))}
          {calendarDays.map(({ date, isCurrentMonth }, idx) => {
            const dateStr = date.toDateString();
            const todayStr = new Date().toDateString();
            const isToday = dateStr === todayStr;

            const dayTasks = filteredTasks.filter((task) => {
              if (!task.dueAt) return false;
              const taskDate = new Date(task.dueAt);
              return taskDate.toDateString() === dateStr;
            });

            return (
              <CalendarCell key={idx} isCurrentMonth={isCurrentMonth} isToday={isToday}>
                <CellHeader>
                  <DayNumber isToday={isToday}>{date.getDate()}</DayNumber>
                </CellHeader>
                <TaskList>
                  {dayTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      status={task.status}
                      onClick={() => handleTaskClick(task.id)}
                      title={task.title}
                    >
                      {task.title}
                    </TaskItem>
                  ))}
                </TaskList>
              </CalendarCell>
            );
          })}
        </CalendarGrid>
      </CommandCenterCard>
    </CommandCenterPage>
  );
};
