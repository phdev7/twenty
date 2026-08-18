import { useMemo, useState } from 'react';
import { styled } from '@linaria/react';
import { Button } from 'diex-ui';
import { themeCssVariables } from 'diex-ui/theme-constants';

import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import {
  buildDiexCalendarDays,
  getDiexCalendarRange,
  groupDiexCalendarTasksByDay,
} from '@/diex-command-centers/calendar/buildDiexCalendarMonth';
import { DiexCalendarMonthGrid } from '@/diex-command-centers/calendar/DiexCalendarMonthGrid';
import { type DiexCalendarTask } from '@/diex-command-centers/calendar/diexCalendarTypes';
import {
  CommandCenterCard,
  CommandCenterLoadingState,
  CommandCenterMetric,
  CommandCenterMetrics,
  CommandCenterPage,
  CommandCenterStartState,
} from '@/diex-command-centers/components/CommandCenterLayout';
import { useDiexPagePresentation } from '@/diex-onboarding/hooks/useDiexPagePresentation';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useOpenRecordInSidePanel } from '@/side-panel/hooks/useOpenRecordInSidePanel';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

// A month never holds more than six weeks of cells, and the query is already
// bounded to those weeks, so this only guards against a workspace that piles
// everything onto a single window.
const CALENDAR_TASK_LIMIT = 500;
const ALL_ASSIGNEES = 'ALL';

const MONTH_NAMES = [
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

type CalendarWorkspaceMember = {
  id: string;
  name: { firstName: string | null; lastName: string | null };
};

const getWorkspaceMemberLabel = (member: CalendarWorkspaceMember) =>
  [member.name?.firstName, member.name?.lastName]
    .filter((namePart) => Boolean(namePart))
    .join(' ') || 'Usuário sem nome';

export const DiexCalendarPage = () => {
  const pagePresentation = useDiexPagePresentation({
    pageKey: 'calendar',
    fallbackLabel: 'Agenda de tarefas',
    fallbackDescription:
      'Organize tarefas com data e hora por responsável em uma visão mensal.',
  });
  const currentWorkspaceMember = useAtomStateValue(currentWorkspaceMemberState);
  const [currentDate, setCurrentDate] = useState(new Date());
  // Left unset until the operator chooses, so the agenda opens on the signed-in
  // user without waiting for the workspace member to resolve.
  const [chosenAssigneeId, setChosenAssigneeId] = useState<string | null>(null);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const selectedAssigneeId =
    chosenAssigneeId ?? currentWorkspaceMember?.id ?? ALL_ASSIGNEES;

  const visibleRange = useMemo(
    () => getDiexCalendarRange(currentDate),
    [currentDate],
  );
  const calendarDays = useMemo(
    () => buildDiexCalendarDays(currentDate),
    [currentDate],
  );

  // The window is filtered on the server. Reading a fixed head of the task
  // table and discarding what fell outside the month silently hid tasks as
  // soon as a workspace passed that many records.
  const taskFilter = useMemo(
    () => ({
      and: [
        {
          dueAt: {
            gte: visibleRange.rangeStart.toISOString(),
            lt: visibleRange.rangeEnd.toISOString(),
          },
        },
        ...(selectedAssigneeId === ALL_ASSIGNEES
          ? []
          : [{ assigneeId: { eq: selectedAssigneeId } }]),
      ],
    }),
    [selectedAssigneeId, visibleRange],
  );

  const {
    records: tasks,
    loading,
    error,
    refetch: refetchTasks,
  } = useFindManyRecords<DiexCalendarTask & { __typename: string }>({
    objectNameSingular: 'task',
    filter: taskFilter,
    orderBy: [{ dueAt: 'AscNullsLast' }],
    limit: CALENDAR_TASK_LIMIT,
    recordGqlFields: {
      id: true,
      title: true,
      dueAt: true,
      status: true,
      assigneeId: true,
    },
    fetchPolicy: 'network-only',
  });

  const {
    records: workspaceMembers,
    loading: isLoadingWorkspaceMembers,
    error: workspaceMembersError,
    refetch: refetchWorkspaceMembers,
  } = useFindManyRecords<CalendarWorkspaceMember & { __typename: string }>({
    objectNameSingular: 'workspaceMember',
    limit: 200,
    recordGqlFields: { id: true, name: { firstName: true, lastName: true } },
  });

  const { openRecordInSidePanel } = useOpenRecordInSidePanel();

  const tasksByDay = useMemo(() => groupDiexCalendarTasksByDay(tasks), [tasks]);

  const metrics = useMemo(() => {
    const completed = tasks.filter((task) => task.status === 'DONE').length;

    return {
      total: tasks.length,
      completed,
      pending: tasks.length - completed,
    };
  }, [tasks]);

  if (loading && tasks.length === 0) {
    return <CommandCenterLoadingState />;
  }

  if (error && tasks.length === 0) {
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
            onAction={() => void refetchTasks()}
          />
          <Button
            title="Abrir tarefas"
            variant="secondary"
            to="/objects/tasks"
          />
        </CommandCenterCard>
      </CommandCenterPage>
    );
  }

  return (
    <CommandCenterPage
      title={pagePresentation.label}
      description={pagePresentation.description}
      statusText={
        error
          ? 'Falha ao atualizar · dados anteriores preservados'
          : workspaceMembersError
            ? 'Agenda carregada · filtro de responsáveis indisponível'
            : loading
              ? 'Atualizando dados reais'
              : `${MONTH_NAMES[currentMonth]} de ${currentYear} · ${
                  selectedAssigneeId === ALL_ASSIGNEES
                    ? 'todos os responsáveis'
                    : 'agenda individual'
                }`
      }
    >
      {error && tasks.length > 0 ? (
        <CommandCenterCard title="Qualidade dos dados">
          <CommandCenterStartState
            title="A atualização desta janela falhou"
            message="As tarefas exibidas pertencem à última consulta concluída. Atualize antes de decidir sobre prazos e responsáveis."
            actionLabel="Tentar novamente"
            onAction={() => void refetchTasks()}
          />
        </CommandCenterCard>
      ) : null}
      {workspaceMembersError ? (
        <CommandCenterCard title="Filtro de responsáveis">
          <CommandCenterStartState
            title="A agenda continua disponível"
            message="As tarefas e os prazos foram carregados. Apenas o filtro por responsável não pôde ser atualizado nesta leitura."
            actionLabel="Atualizar responsáveis"
            onAction={() => void refetchWorkspaceMembers()}
          />
        </CommandCenterCard>
      ) : null}
      <CommandCenterMetrics>
        <CommandCenterMetric label="Tarefas na janela" value={metrics.total} />
        <CommandCenterMetric label="Concluídas" value={metrics.completed} />
        <CommandCenterMetric label="Pendentes" value={metrics.pending} />
      </CommandCenterMetrics>

      {!loading && !error && tasks.length === 0 ? (
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
            aria-label="Filtrar agenda por responsável"
            value={selectedAssigneeId}
            onChange={(event) => setChosenAssigneeId(event.target.value)}
            disabled={isLoadingWorkspaceMembers}
          >
            <option value={ALL_ASSIGNEES}>Todos os usuários</option>
            {workspaceMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {getWorkspaceMemberLabel(member)}
                {member.id === currentWorkspaceMember?.id ? ' (você)' : ''}
              </option>
            ))}
          </StyledSelect>

          <StyledHeaderNav>
            <Button
              title="Anterior"
              size="small"
              variant="secondary"
              onClick={() =>
                setCurrentDate(new Date(currentYear, currentMonth - 1, 1))
              }
            />
            <StyledMonthTitle>
              {MONTH_NAMES[currentMonth]} {currentYear}
            </StyledMonthTitle>
            <Button
              title="Próximo"
              size="small"
              variant="secondary"
              onClick={() =>
                setCurrentDate(new Date(currentYear, currentMonth + 1, 1))
              }
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
              onClick={() =>
                void Promise.all([refetchTasks(), refetchWorkspaceMembers()])
              }
            />
          </StyledHeaderNav>
        </StyledFilters>

        <DiexCalendarMonthGrid
          days={calendarDays}
          tasksByDay={tasksByDay}
          onSelectTask={(taskId) =>
            openRecordInSidePanel({
              recordId: taskId,
              objectNameSingular: 'task',
            })
          }
        />
      </CommandCenterCard>
    </CommandCenterPage>
  );
};
