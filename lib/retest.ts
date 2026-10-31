import { WrongQuestion } from '@/types/planim';

const WEEK = 7 * 86400000;
const MASTERED = 3;

/**
 * Tekrar sırası: henüz çözülemeyenler (en çok zorlananlar önce), sonra çözülmüş ama bir haftadır tekrar edilmemiş olanlar.
 * Üç kez üst üste doğru çözülen soru öğrenilmiş sayılır ve sıradan çıkar.
 */
export function dueWrongs(wrongs: WrongQuestion[], max = 10): WrongQuestion[] {
  const now = Date.now();
  const ts = (w: WrongQuestion) => new Date(w.reviewedAt ?? w.date).getTime();
  return wrongs
    .filter((w) => (w.correctStreak ?? 0) < MASTERED && (w.understood !== true || now - ts(w) >= WEEK))
    .sort((a, b) => (b.failCount - a.failCount) || (ts(a) - ts(b)))
    .slice(0, max);
}
