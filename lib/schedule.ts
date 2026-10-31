import { Lesson, Topic } from '@/types/planim';
import { PlanLesson } from '@/lib/members';
import { findConflict, toMinutes } from '@/lib/lessonConflict';

/** Önerilen / gönderilen programı öğrencinin programına ekler. Aynı gün ve saatte başka ders varsa (kendi içinde çakışanlar dahil) o dersi atlar. */
export function applyPlan(plan: PlanLesson[], lessons: Lesson[], topics: Topic[], addLesson: (l: Omit<Lesson, 'id'>) => void): { added: number; skipped: number } {
  let added = 0, skipped = 0;
  let pool: Lesson[] = [...lessons];
  plan.forEach((l) => {
    const s = toMinutes(l.startTime), e = toMinutes(l.endTime);
    if (s === null || e === null || e <= s || findConflict(pool, l)) { skipped += 1; return; }
    const ids = (l.topics ?? []).map((title) => topics.find((t) => t.subject === l.name && t.title === title)?.id).filter(Boolean) as string[];
    const lesson = { name: l.name, day: l.day, startTime: l.startTime, endTime: l.endTime, place: '', alarmMinutes: 10, topicIds: l.name === 'Deneme' ? ['deneme-sozel', 'deneme-sayisal'] : ids };
    addLesson(lesson);
    pool = [...pool, { ...lesson, id: `plan-${added}` }];
    added += 1;
  });
  return { added, skipped };
}

/** Plandaki hangi dersler, hangi mevcut derslerle çakışıyor? (Planın kendi içindeki çakışmalar sayılmaz.) */
export function findPlanClashes(plan: PlanLesson[], lessons: Lesson[]): { existing: Lesson[]; clashCount: number } {
  const hit = new Map<string, Lesson>();
  let clashCount = 0;
  plan.forEach((l) => {
    const s = toMinutes(l.startTime), e = toMinutes(l.endTime);
    if (s === null || e === null || e <= s) return;
    const c = lessons.filter((x) => findConflict([x], l));
    if (c.length) { clashCount += 1; c.forEach((x) => hit.set(x.id, x)); }
  });
  return { existing: [...hit.values()].sort((a, b) => a.day - b.day || a.startTime.localeCompare(b.startTime)), clashCount };
}
