const REMINDER_DAYS = [7, 3, 1] as const;

function startOfDayUtc(d: Date) {
  const value = new Date(d);
  value.setUTCHours(0, 0, 0, 0);
  return value;
}

export function reminderTargetDates(baseDate = new Date()) {
  const start = startOfDayUtc(baseDate);
  return REMINDER_DAYS.map((daysBefore) => {
    const dueDate = new Date(start);
    dueDate.setUTCDate(dueDate.getUTCDate() + daysBefore);
    return { daysBefore, dueDate };
  });
}

export function buildReminderSubject(daysBefore: number) {
  return `【期限${daysBefore}日前】タスク期限リマインド`; 
}

export function buildReminderBody(input: {
  companyName: string;
  daysBefore: number;
  dueDateYmd: string;
  tasks: Array<{ title: string; category: string }>;
}) {
  const lines = input.tasks.map((task, index) => {
    return `${index + 1}. [${task.category}] ${task.title}`;
  });

  return [
    `${input.companyName} ご担当者様`,
    "",
    `以下のタスクが期限 ${input.daysBefore} 日前になりました。`,
    `期限日: ${input.dueDateYmd}`,
    "",
    ...lines,
    "",
    "本メールは自動送信です。",
  ].join("\n");
}

export function toYmd(date: Date) {
  return date.toISOString().slice(0, 10);
}

export { REMINDER_DAYS };
