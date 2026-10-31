import type { Lesson } from '@/types/planim';

/** "HH:MM" -> dakika. Geçersizse null. */
export function toMinutes(t: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec((t || '').trim());
  if (!m) return null;
  const h = Number(m[1]), mi = Number(m[2]);
  if (h > 23 || mi > 59) return null;
  return h * 60 + mi;
}

/**
 * Aynı günde saatleri çakışan dersi bulur (başlangıç dahil, bitiş hariç: 10:00-11:00 ile 11:00-12:00 çakışmaz).
 * `ignoreId` düzenleme sırasında dersin kendisini saymamak içindir.
 */
export function findConflict(lessons: Lesson[], cand: Pick<Lesson, 'day' | 'startTime' | 'endTime'>, ignoreId?: string): Lesson | null {
  const s = toMinutes(cand.startTime), e = toMinutes(cand.endTime);
  if (s === null || e === null) return null;
  const end = e > s ? e : s + 1;
  for (const l of lessons) {
    if (l.day !== cand.day || l.id === ignoreId) continue;
    const ls = toMinutes(l.startTime), le = toMinutes(l.endTime);
    if (ls === null || le === null) continue;
    const lend = le > ls ? le : ls + 1;
    if (s < lend && ls < end) return l;
  }
  return null;
}

/** Çakışma uyarısı metni. */
export function conflictMessage(c: Lesson): string {
  return `Bu saatte zaten "${c.name}" dersin var (${c.startTime}-${c.endTime}). Başka bir saat seç ya da önce onu sil.`;
}

/**
 * Yapay zekânın önerdiği programı süzer: mevcut derslerle ya da kendi içinde çakışanları ayırır.
 * `kept` eklenebilecekler, `rejected` çakışanlar (kullanıcıya gösterilir).
 */
export function filterAiLessons<T extends Pick<Lesson, 'id' | 'day' | 'startTime' | 'endTime'>>(existing: Lesson[], proposed: T[]): { kept: T[]; rejected: T[] } {
  const kept: T[] = [], rejected: T[] = [];
  let pool: Lesson[] = [...existing];
  for (const p of proposed) {
    if (findConflict(pool, p)) { rejected.push(p); continue; }
    kept.push(p);
    pool = [...pool, p as unknown as Lesson];
  }
  return { kept, rejected };
}
