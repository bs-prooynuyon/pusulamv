const dayKey = (date: Date) => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

/** Bugünden geriye doğru, her gün en az bir odak oturumu olan ardışık gün sayısı. */
export function streakDays(sessions: { date: string }[]) {
  const days = new Set(sessions.map((session) => dayKey(new Date(session.date))));
  const cursor = new Date();
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let count = 0;
  while (days.has(dayKey(cursor))) { count += 1; cursor.setDate(cursor.getDate() - 1); }
  return count;
}

export function minutesToday(sessions: { date: string; durationMinutes: number }[]) {
  const today = dayKey(new Date());
  return sessions.filter((item) => dayKey(new Date(item.date)) === today).reduce((sum, item) => sum + item.durationMinutes, 0);
}
