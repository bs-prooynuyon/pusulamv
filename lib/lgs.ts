import { QUESTION_COUNTS, SubjectResult } from '@/types/planim';

/** Açıklanmış LGS tarihleri (MEB sınav takvimi). Yılı burada olmayanlar bir önceki yıldan tahmin edilir. */
const KNOWN: Record<number, string> = { 2024: '2024-06-01', 2025: '2025-06-14', 2026: '2026-06-13', 2027: '2027-06-13' };
const pad = (n: number) => String(n).padStart(2, '0');
const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Yıl → { date, estimated }. Bilinmiyorsa bir önceki yılın gün/ayına en yakın cumartesi. */
export function lgsDateForYear(year: number): { date: string; estimated: boolean } {
  if (KNOWN[year]) return { date: KNOWN[year], estimated: false };
  const prev = lgsDateForYear(year - 1 < 2024 ? 2025 : year - 1).date;
  const [, m, d] = prev.split('-').map(Number);
  const base = new Date(year, m - 1, d);
  const diff = (6 - base.getDay() + 7) % 7; // ileri cumartesi
  const back = (base.getDay() + 1) % 7; // geri cumartesi
  base.setDate(base.getDate() + (diff <= back ? diff : -back));
  return { date: fmt(base), estimated: true };
}

export const LGS_YEARS = (() => { const y = new Date().getFullYear(); return [y, y + 1, y + 2]; })();

const COEF: Record<string, number> = { Türkçe: 4, Matematik: 4, 'Fen Bilimleri': 4, İnkılap: 1, 'Din Kültürü': 1, İngilizce: 1 };
export const examTotal = (results: SubjectResult[]) => results.reduce((s, r) => s + r.net, 0);

/** Yaklaşık LGS puanı (100–500). Gerçek puan her yıl standart sapmaya göre değişir; bu bir tahmindir. */
export function estimateScore(results: SubjectResult[]) {
  const max = Object.entries(QUESTION_COUNTS).reduce((s, [k, v]) => s + v * (COEF[k] ?? 1), 0);
  const got = results.reduce((s, r) => s + Math.max(0, r.net) * (COEF[r.subject] ?? 1), 0);
  return Math.round(100 + (got / max) * 400);
}

export const sortExams = <T extends { date: string }>(exams: T[]) => [...exams].sort((a, b) => b.date.localeCompare(a.date));


/** Sözel: Türkçe, İnkılap, Din, İngilizce. Sayısal: Matematik, Fen. */
const SOZEL = ['Türkçe', 'İnkılap', 'Din Kültürü', 'İngilizce'];
export const sozelNet = (results: SubjectResult[]) => results.filter((r) => SOZEL.includes(r.subject)).reduce((s, r) => s + r.net, 0);
export const sayisalNet = (results: SubjectResult[]) => results.filter((r) => !SOZEL.includes(r.subject)).reduce((s, r) => s + r.net, 0);
/** 71.0 → "71,0" */
export const fmtNet = (n: number) => n.toFixed(1).replace('.', ',');

/** Seçili yılın LGS tarihine kalan gün. Tarih geçmişse ya da yoksa sıradaki (tahmini) LGS kullanılır. */
export function lgsCountdown(s: { examYear?: number; examDate?: string; examDateEstimated?: boolean }) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const at = (d: string) => new Date(`${d}T00:00:00`);
  let date = s.examDate || '';
  let estimated = !!s.examDateEstimated;
  // Telefonda eskiden "tahmini" kaydedilmiş tarih kalmış olabilir; yıl seçiliyse tarih her zaman güncel tablodan alınır.
  if (s.examYear) { const known = lgsDateForYear(s.examYear); date = known.date; estimated = known.estimated; }
  if (!date || at(date) < today) {
    let year = Math.max(s.examYear || 0, today.getMonth() >= 5 ? today.getFullYear() + 1 : today.getFullYear());
    for (let i = 0; i < 4; i += 1, year += 1) {
      const info = lgsDateForYear(year);
      if (at(info.date) >= today) { date = info.date; estimated = info.estimated; break; }
    }
  }
  const days = Math.max(0, Math.ceil((at(date).getTime() - today.getTime()) / 86400000));
  return { date, year: at(date).getFullYear(), days, estimated };
}
