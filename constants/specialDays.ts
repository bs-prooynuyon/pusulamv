/** Yaklaşan özel günler. Sabit tarihliler her yıl tekrar eder; dini bayramların tarihi yıldan yıla değiştiği için ayrı listede (tahmini). */
export interface SpecialDay { title: string; date: string; note?: string; estimated?: boolean }

const FIXED: { m: number; d: number; title: string; teacher?: boolean; student?: boolean }[] = [
  { m: 4, d: 23, title: '23 Nisan Ulusal Egemenlik ve Çocuk Bayramı' },
  { m: 5, d: 1, title: '1 Mayıs Emek ve Dayanışma Günü' },
  { m: 5, d: 19, title: '19 Mayıs Atatürk’ü Anma, Gençlik ve Spor Bayramı' },
  { m: 7, d: 15, title: '15 Temmuz Demokrasi ve Milli Birlik Günü' },
  { m: 8, d: 30, title: '30 Ağustos Zafer Bayramı' },
  { m: 10, d: 29, title: '29 Ekim Cumhuriyet Bayramı' },
  { m: 11, d: 10, title: '10 Kasım Atatürk’ü Anma Günü' },
  { m: 11, d: 24, title: '24 Kasım Öğretmenler Günü', teacher: true },
  { m: 12, d: 31, title: 'Yılbaşı gecesi' },
];

/** Dini bayramlar (ilk gün). Resmî takvim açıklandığında değişebilir, bu yüzden "tahmini". */
const RELIGIOUS: SpecialDay[] = [
  { title: 'Ramazan Bayramı', date: '2027-03-09', estimated: true },
  { title: 'Kurban Bayramı', date: '2027-05-16', estimated: true },
  { title: 'Ramazan Bayramı', date: '2028-02-26', estimated: true },
  { title: 'Kurban Bayramı', date: '2028-05-05', estimated: true },
];

const pad = (n: number) => String(n).padStart(2, '0');
const iso = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;
export const daysUntil = (date: string, from = new Date()) => Math.ceil((new Date(`${date}T00:00:00`).getTime() - new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime()) / 86400000);

/** Bugünden itibaren en yakın `count` özel gün. LGS tarihi verilirse (öğrenci için) ona da yer verilir. */
export function upcomingDays(role: 'student' | 'teacher', lgsDate: string, count = 4, from = new Date()): (SpecialDay & { days: number })[] {
  const y = from.getFullYear();
  const list: SpecialDay[] = [];
  FIXED.forEach((f) => { if (role === 'student' && f.teacher) return; [y, y + 1].forEach((year) => list.push({ title: f.title, date: iso(year, f.m, f.d) })); });
  RELIGIOUS.forEach((r) => list.push(r));
  if (role === 'student' && lgsDate) list.push({ title: 'LGS sınav günü', date: lgsDate });
  return list.map((x) => ({ ...x, days: daysUntil(x.date, from) })).filter((x) => x.days >= 0).sort((a, b) => a.days - b.days).slice(0, count);
}
