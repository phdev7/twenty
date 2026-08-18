import { styled } from '@linaria/react';
import { themeCssVariables } from 'diex-ui/theme-constants';

import {
  type DiexCalendarDay,
  type DiexCalendarTask,
} from '@/diex-command-centers/calendar/diexCalendarTypes';

const StyledViewport = styled.div`
  overflow-x: auto;
`;

const StyledGrid = styled.div`
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

const StyledHeaderCell = styled.div`
  background-color: ${themeCssVariables.background.secondary};
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.medium};
  padding: ${themeCssVariables.spacing[2]};
  text-align: center;
`;

const StyledCell = styled.div<{
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

const StyledTaskItem = styled.button<{ isDone: boolean }>`
  background-color: ${({ isDone }) =>
    isDone
      ? themeCssVariables.background.transparent.success
      : themeCssVariables.background.transparent.orange};
  border: 0;
  border-left: 3px solid
    ${({ isDone }) =>
      isDone ? themeCssVariables.color.green : themeCssVariables.color.orange};
  border-radius: 4px;
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  font-family: ${themeCssVariables.font.family};
  font-size: ${themeCssVariables.font.size.xxs};
  overflow: hidden;
  padding: 4px;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;

  &:hover {
    filter: brightness(0.95);
  }
`;

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const formatTaskTime = (dueAt: string) =>
  new Date(dueAt).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

type DiexCalendarMonthGridProps = {
  days: DiexCalendarDay[];
  tasksByDay: Record<string, DiexCalendarTask[]>;
  onSelectTask: (taskId: string) => void;
};

export const DiexCalendarMonthGrid = ({
  days,
  tasksByDay,
  onSelectTask,
}: DiexCalendarMonthGridProps) => (
  <StyledViewport>
    <StyledGrid>
      {DAYS_OF_WEEK.map((dayOfWeek) => (
        <StyledHeaderCell key={dayOfWeek}>{dayOfWeek}</StyledHeaderCell>
      ))}
      {days.map(({ date, isCurrentMonth, isToday, dayKey }) => (
        <StyledCell
          key={dayKey}
          isCurrentMonth={isCurrentMonth}
          isToday={isToday}
        >
          <StyledCellHeader>
            <StyledDayNumber isToday={isToday}>
              {date.getDate()}
            </StyledDayNumber>
          </StyledCellHeader>
          <StyledTaskList>
            {(tasksByDay[dayKey] ?? []).map((task) => {
              const title = task.title ?? 'Tarefa sem título';

              return (
                <StyledTaskItem
                  key={task.id}
                  type="button"
                  isDone={task.status === 'DONE'}
                  onClick={() => onSelectTask(task.id)}
                  title={title}
                >
                  {task.dueAt !== null
                    ? `${formatTaskTime(task.dueAt)} · `
                    : ''}
                  {title}
                </StyledTaskItem>
              );
            })}
          </StyledTaskList>
        </StyledCell>
      ))}
    </StyledGrid>
  </StyledViewport>
);
