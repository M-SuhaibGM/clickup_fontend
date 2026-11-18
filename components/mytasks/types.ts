export interface MyTask {
  id: string;
  title: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  dueDate: string | null;
  list: { id: string; name: string; project: { id: string; name: string; color: string } };
  subtasks: { id: string; title: string; status: string }[];
  comments?: { id: string }[];
}

export type CardId = 'recents' | 'agenda' | 'today' | 'assigned' | 'personal' | 'comments' | 'time';

export const CARDS: { id: CardId; title: string; desc: string }[] = [
  { id: 'recents', title: 'Recents', desc: 'Tasks and projects you opened lately' },
  { id: 'agenda', title: 'Agenda', desc: 'What is due in the next 7 days, and your calendars' },
  { id: 'today', title: 'Today & Overdue', desc: 'Open tasks that are due today or already late' },
  { id: 'assigned', title: 'Assigned to me', desc: 'Upcoming tasks, tasks without a date, and completed work' },
  { id: 'personal', title: 'Personal List', desc: 'Your own private to-dos' },
  { id: 'comments', title: 'Assigned comments', desc: 'Comments on your tasks, and ones you left for others' },
  { id: 'time', title: 'Time tracked', desc: 'Your tracked time over the last 7 days' },
];
