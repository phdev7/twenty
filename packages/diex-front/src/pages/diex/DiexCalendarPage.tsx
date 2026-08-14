import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { styled } from '@linaria/react';
import { useMemo, useState } from 'react';

import {
  CommandCenterCard,
  CommandCenterPage,
  CommandCenterLoadingState,
  CommandCenterMetric,
  CommandCenterMetrics,
  CommandCenterStartState,
} from '@/diex-command-centers/components/CommandCenterLayout';
import { useOpenRecordInSidePanel } from '@/side-panel/hooks/useOpenRecordInSidePanel';
import { useDiexPagePresentation } from '@/diex-onboarding/hooks/useDiexPagePresentation';
import { Button } from 'diex-ui';
import { themeCssVariables } from 'diex-ui/theme-constants';

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
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[4]};
  margin-bottom: ${themeCssVariables.spacing[4]};
`;

const StyledSelect = styled.select`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: 4px;
  color: ${themeCssVariables.font.color.primary};
  font-family: inherit;
  min-height: ${themeCssVariables.spacing[8]};
  padding: 0 ${themeCssVariables.spacing[2]};
`;

const StyledHeaderNav = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledMonthTitle = styled.h2`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.lg};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  margin: 0 ${themeCssVariables.spacing[2]};
  min-width: 150px;
  text-align: center;
`;

const StyledCalendarViewport = styled.div`
  overflow-x: auto;
`;

const StyledCalendarGrid = styled.div`
  background-color: ${themeCssVariables.border.color.light};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  display: grid;
  gap: 1px;
  grid-template-columns: repeat(7, minmax(140px, 1fr));
  margin-top: ${themeCssVariables.spacing[2]};
  min-width: 980px;
  overflow: hidden;
`;

const StyledCalendarHeaderCell = styled.div`
  background-color: ${themeCssVariables.background.secondary};
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.medium};
  padding: ${themeCssVariables.spacing[2]};
  text-align: center;
`;

const StyledCalendarCell = styled.div<{
  isCurrentMonth: boolean;
  isToday: boolean;
}>`
  background-color: ${({ isToday }) =>
    isToday
      ? themeCssVariables.background.transparent.blue
      : themeCssVariables.background.primary};
  border: 1px solid transparent;
  display: flex;
  flex-direction: column;
  min-height: 120px;
  opacity: ${({ isCurrentMonth }) => (isCurrentMonth ? 1 : 0.4)};
  padding: ${themeCssVariables.spacing[2]};

  &:hover {
    border-color: ${themeCssVariables.border.color.medium};
  }
`;

const StyledCellHeader = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin-bottom: ${themeCssVariables.spacing[1]};
`;

const StyledDayNumber = styled.span<{ isToday: boolean }>`
  color: ${({ isToday }) =>
    isToday
      ? themeCssVariables.color.blue
      : themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${({ isToday }) =>
    isToday
      ? themeCssVariables.font.weight.semiBold
      : themeCssVariables.font.weight.regular};
`;

const StyledTaskList = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
`;

const StyledTaskItem = styled.div<{ status: string | null }>`
  background-color: ${({ status }) =>
    status === 'DONE'
      ? themeCssVariables.background.transparent.success
      : themeCssVariables.background.transparent.orange};
  border-left: 3px solid
    ${({ status }) =>
      status === 'DONE'
        ? themeCssVariables.color.green
        : themeCssVariables.color.orange};
  border-radius: 4px;
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  font-size: ${themeCssVariables.font.size.xxs};
  overflow: hidden;
  padding: 4px;
  text-overflow: ellipsis;
  white-space: nowrap;

  &:hover {
    filter: brightness(0.95);
  }
`;

interface Task {
  id: string;
  title: string | null;
  dueAt: string | null;
  status: string | null;
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
  const pagePresentation = useDiexPagePresentation({
    pageKey: 'calendar',
    fallbackLabel: 'Agenda de tarefas',
    fallbackDescription:
      'Organize tarefas com data e hora por responsável em uma visão mensal.',
  });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>('ALL');
  const visibleRange = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const rangeStart = new Date(year, month, 1 - firstDayIndex);
    const rangeEnd = new Date(rangeStart);

    rangeEnd.setDate(rangeStart.getDate() + 42);

    return { rangeStart, rangeEnd };
  }, [currentDate]);
  const { data, loading, error, refetch } = useQuery<{
    tasks: { edges: Array<{ node: Task }> };
    workspaceMembers: { edges: Array<{ node: WorkspaceMember }> };
  }>(CALENDAR_TASKS_QUERY, {
    fetchPolicy: 'network-only',
    errorPolicy: 'all',
    notifyOnNetworkStatusChange: true,
  });

  const { openRecordInSidePanel } = useOpenRecordInSidePanel();

  const tasks = useMemo(() => {
    return data?.tasks?.edges?.map(({ node }) => node) ?? [];
  }, [data]);

  const workspaceMembers = useMemo(() => {
    return data?.workspaceMembers?.edges?.map(({ node }) => node) ?? [];
  }, [data]);
  const dataLoadedAt = useMemo(
    () => (data ? new Date().toISOString() : null),
    [data],
  );

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (!task.dueAt) return false;

      const dueAt = new Date(task.dueAt);
      const isInVisibleRange =
        dueAt >= visibleRange.rangeStart && dueAt < visibleRange.rangeEnd;
      const matchesAssignee =
        selectedAssigneeId === 'ALL' ||
        task.assignee?.id === selectedAssigneeId;

      return isInVisibleRange && matchesAssignee;
    });
  }, [tasks, selectedAssigneeId, visibleRange]);

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
    const completed = filteredTasks.filter(
      (task) => task.status === 'DONE',
    ).length;
    const pending = total - completed;
    return { total, completed, pending };
  }, [filteredTasks]);

  if (loading && tasks.length === 0) return <CommandCenterLoadingState />;
  if (error && tasks.length === 0)
    return (
      <CommandCenterPage
        title={pagePresentation.label}
        description={pagePresentation.description}
        statusText="Dados indisponíveis"
      >
        <CommandCenterCard title="Agenda não confirmada">
          <CommandCenterStartState
            title="Não foi possível carregar esta janela"
            message="Nenhuma conclusão foi gerada com dados incompletos. Tente novamente para recuperar tarefas, responsáveis e prazos reais."
            actionLabel="Tentar novamente"
            onAction={() => void refetch()}
          />
          <Button
            title="Abrir tarefas"
            variant="secondary"
            to="/objects/tasks"
          />
        </CommandCenterCard>
      </CommandCenterPage>
    );

  return (
    <CommandCenterPage
      title={pagePresentation.label}
      description={pagePresentation.description}
      statusText={
        error
          ? 'Falha ao atualizar · dados anteriores preservados'
          : loading
            ? 'Atualizando dados reais'
            : dataLoadedAt
              ? `Dados atuais · ${new Date(dataLoadedAt).toLocaleTimeString(
                  'pt-BR',
                  {
                    hour: '2-digit',
                    minute: '2-digit',
                  },
                )}`
              : 'Aguardando dados reais'
      }
    >
      {error && tasks.length > 0 ? (
        <CommandCenterCard title="Qualidade dos dados">
          <CommandCenterStartState
            title="A atualização desta janela falhou"
            message="As tarefas exibidas pertencem à última consulta concluída. Atualize antes de decidir sobre prazos e responsáveis."
            actionLabel="Tentar novamente"
            onAction={() => void refetch()}
          />
        </CommandCenterCard>
      ) : null}
      <CommandCenterMetrics>
        <CommandCenterMetric label="Tarefas na janela" value={metrics.total} />
        <CommandCenterMetric label="Concluídas" value={metrics.completed} />
        <CommandCenterMetric label="Pendentes" value={metrics.pending} />
      </CommandCenterMetrics>

      {tasks.length === 0 ? (
        <CommandCenterCard title="A agenda acompanha cada próxima ação">
          <CommandCenterStartState
            title="Nenhuma tarefa com prazo nesta janela."
            message="Crie ou ajuste uma próxima ação com responsável e prazo. Ela aparecerá automaticamente no período correspondente."
            actionLabel="Abrir tarefas"
            to="/objects/tasks"
          />
        </CommandCenterCard>
      ) : null}

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
            <Button
              title="Anterior"
              size="small"
              variant="secondary"
              onClick={prevMonth}
            />
            <StyledMonthTitle>
              {monthNames[currentMonth]} {currentYear}
            </StyledMonthTitle>
            <Button
              title="Próximo"
              size="small"
              variant="secondary"
              onClick={nextMonth}
            />
            <Button
              title="Hoje"
              size="small"
              variant="tertiary"
              onClick={() => setCurrentDate(new Date())}
            />
            <Button
              title="Atualizar"
              size="small"
              variant="secondary"
              disabled={loading}
              onClick={() => void refetch()}
            />
          </StyledHeaderNav>
        </StyledFilters>

        <StyledCalendarViewport>
          <StyledCalendarGrid>
            {daysOfWeek.map((day) => (
              <StyledCalendarHeaderCell key={day}>
                {day}
              </StyledCalendarHeaderCell>
            ))}
            {calendarDays.map(({ date, isCurrentMonth }) => {
              const dateStr = date.toDateString();
              const todayStr = new Date().toDateString();
              const isToday = dateStr === todayStr;

              const dayTasks = filteredTasks.filter((task) => {
                if (!task.dueAt) return false;
                const taskDate = new Date(task.dueAt);
                return taskDate.toDateString() === dateStr;
              });

              return (
                <StyledCalendarCell
                  key={date.toISOString()}
                  isCurrentMonth={isCurrentMonth}
                  isToday={isToday}
                >
                  <StyledCellHeader>
                    <StyledDayNumber isToday={isToday}>
                      {date.getDate()}
                    </StyledDayNumber>
                  </StyledCellHeader>
                  <StyledTaskList>
                    {dayTasks.map((task) => (
                      <StyledTaskItem
                        key={task.id}
                        status={task.status}
                        onClick={() => handleTaskClick(task.id)}
                        title={task.title ?? 'Tarefa sem título'}
                      >
                        {new Date(task.dueAt ?? '').toLocaleTimeString(
                          'pt-BR',
                          {
                            hour: '2-digit',
                            minute: '2-digit',
                          },
                        )}{' '}
                        · {task.title ?? 'Tarefa sem título'}
                      </StyledTaskItem>
                    ))}
                  </StyledTaskList>
                </StyledCalendarCell>
              );
            })}
          </StyledCalendarGrid>
        </StyledCalendarViewport>
      </CommandCenterCard>
    </CommandCenterPage>
  );
};
