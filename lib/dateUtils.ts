export function getQuickDates() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const dow = today.getDay();
  const thisWeekend = new Date(today); thisWeekend.setDate(thisWeekend.getDate() + (dow === 6 ? 7 : 6 - dow));
  const nextWeek = new Date(today); nextWeek.setDate(nextWeek.getDate() + (dow === 1 ? 7 : (8 - dow) % 7));
  const nextWeekend = new Date(thisWeekend); nextWeekend.setDate(nextWeekend.getDate() + 7);
  const twoWeeks = new Date(today); twoWeeks.setDate(twoWeeks.getDate() + 14);
  const fourWeeks = new Date(today); fourWeeks.setDate(fourWeeks.getDate() + 28);
  const dayName = (d: Date) => d.toLocaleDateString('en-US', { weekday: 'short' });
  const dateFmt = (d: Date) => d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  return [
    { label: 'Today', hint: dayName(today), date: today },
    { label: 'Tomorrow', hint: dayName(tomorrow), date: tomorrow },
    { label: 'This weekend', hint: dayName(thisWeekend), date: thisWeekend },
    { label: 'Next week', hint: dateFmt(nextWeek), date: nextWeek },
    { label: 'Next weekend', hint: dateFmt(nextWeekend), date: nextWeekend },
    { label: '2 weeks', hint: dateFmt(twoWeeks), date: twoWeeks },
    { label: '4 weeks', hint: dateFmt(fourWeeks), date: fourWeeks },
  ];
}

/** 42 cells (6 weeks) for a month grid. */
export function getCalendarDays(year: number, month: number) {
  const startDow = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevLast = new Date(year, month, 0).getDate();
  const days: { date: Date; currentMonth: boolean }[] = [];
  for (let i = startDow - 1; i >= 0; i--) days.push({ date: new Date(year, month - 1, prevLast - i), currentMonth: false });
  for (let d = 1; d <= totalDays; d++) days.push({ date: new Date(year, month, d), currentMonth: true });
  for (let d = 1; days.length < 42; d++) days.push({ date: new Date(year, month + 1, d), currentMonth: false });
  return days;
}

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
export const sameDay = (a: Date, b: Date) => startOfDay(a) === startOfDay(b);
