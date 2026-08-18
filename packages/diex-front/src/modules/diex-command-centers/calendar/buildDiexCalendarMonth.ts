import {
  type DiexCalendarDay,
  type DiexCalendarTask,
} from '@/diex-command-centers/calendar/diexCalendarTypes';

const CALENDAR_CELL_COUNT = 42;

// Keyed on the local calendar date. An ISO key would move a late-evening task
// into the next day for every workspace east of UTC.
export const getDiexCalendarDayKey = (date: Date): string =>
  `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}-${`${date.getDate()}`.padStart(2, '0')}`;

export const getDiexCalendarRange = (referenceDate: Date) => {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const rangeStart = new Date(
    year,
    month,
    1 - new Date(year, month, 1).getDay(),
  );
  const rangeEnd = new Date(rangeStart);

  rangeEnd.setDate(rangeStart.getDate() + CALENDAR_CELL_COUNT);

  return { rangeStart, rangeEnd };
};

export const buildDiexCalendarDays = (
  referenceDate: Date,
): DiexCalendarDay[] => {
  const { rangeStart } = getDiexCalendarRange(referenceDate);
  const currentMonth = referenceDate.getMonth();
  const todayKey = getDiexCalendarDayKey(new Date());

  return Array.from({ length: CALENDAR_CELL_COUNT }, (_, cellIndex) => {
    const date = new Date(rangeStart);

    date.setDate(rangeStart.getDate() + cellIndex);

    const dayKey = getDiexCalendarDayKey(date);

    return {
      date,
      dayKey,
      isCurrentMonth: date.getMonth() === currentMonth,
      isToday: dayKey === todayKey,
    };
  });
};

export const groupDiexCalendarTasksByDay = (
  tasks: DiexCalendarTask[],
): Record<string, DiexCalendarTask[]> =>
  tasks.reduce<Record<string, DiexCalendarTask[]>>((tasksByDay, task) => {
    if (task.dueAt === null) {
      return tasksByDay;
    }

    const dayKey = getDiexCalendarDayKey(new Date(task.dueAt));

    return { ...tasksByDay, [dayKey]: [...(tasksByDay[dayKey] ?? []), task] };
  }, {});
