export type DiexCalendarTask = {
  id: string;
  title: string | null;
  dueAt: string | null;
  status: string | null;
  assigneeId: string | null;
};

export type DiexCalendarDay = {
  date: Date;
  dayKey: string;
  isCurrentMonth: boolean;
  isToday: boolean;
};
