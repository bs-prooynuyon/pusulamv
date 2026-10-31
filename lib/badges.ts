import { QuestionLog, WrongQuestion } from '@/types/planim';

/** Kademe renkleri: bronz → gümüş → altın → zümrüt → safir → ametist → yakut → elmas → efsane. */
export const TIER_COLORS = ['#b0703c', '#9aa5b1', '#e0b030', '#2fb67c', '#2f7fe0', '#8a4fe0', '#e04f6e', '#2fc4d8', '#ff8a2f'];

interface TierDef { goal: number; title: string; icon: string }
interface CategoryDef { id: string; title: string; unit: string; desc: (goal: number) => string; tiers: TierDef[] }

/** Her kategori bir "blok"tur; kademeler sağa kaydırınca açılır. Her kademenin kendi adı, simgesi ve rengi vardır. */
const CATEGORIES: CategoryDef[] = [
  { id: 'hours', title: 'Çalışma süresi', unit: 'saat', desc: (g) => `Toplam ${g} saat odaklan.`, tiers: [
    { goal: 1, title: 'Isınma', icon: 'coffee' }, { goal: 5, title: 'Düzenli', icon: 'book-open' }, { goal: 10, title: 'Odaklı', icon: 'eye' },
    { goal: 25, title: 'Çalışkan', icon: 'clock' }, { goal: 50, title: 'Azimli', icon: 'target' }, { goal: 100, title: 'Usta', icon: 'star' },
    { goal: 250, title: 'Efsane Çalışkan', icon: 'award' }, { goal: 500, title: 'Bilge', icon: 'sun' }, { goal: 1000, title: 'Pusula Efsanesi', icon: 'compass' },
  ] },
  { id: 'streak', title: 'Seri', unit: 'gün', desc: (g) => `${g} gün art arda çalış.`, tiers: [
    { goal: 3, title: 'Ateşlendi', icon: 'zap' }, { goal: 7, title: 'Haftalık Seri', icon: 'calendar' }, { goal: 14, title: 'İki Hafta', icon: 'trending-up' },
    { goal: 21, title: 'Üç Hafta', icon: 'activity' }, { goal: 30, title: 'Aylık Seri', icon: 'sunrise' }, { goal: 60, title: 'İki Ay', icon: 'shield' },
    { goal: 100, title: 'Yüzüncü Gün', icon: 'flag' }, { goal: 200, title: 'Demir İrade', icon: 'anchor' }, { goal: 365, title: 'Bir Yıl', icon: 'globe' },
  ] },
  { id: 'marathon', title: 'Maraton', unit: 'dakika', desc: (g) => `Tek oturumda ${g} dakika çalış.`, tiers: [
    { goal: 30, title: 'Isınma Turu', icon: 'watch' }, { goal: 45, title: 'Kırk Beş', icon: 'wind' }, { goal: 60, title: 'Bir Saat', icon: 'moon' },
    { goal: 90, title: 'Maraton', icon: 'navigation' }, { goal: 120, title: 'İki Saat', icon: 'layers' }, { goal: 150, title: 'Dayanıklı', icon: 'hexagon' },
    { goal: 180, title: 'Üç Saat', icon: 'octagon' }, { goal: 240, title: 'Dört Saat', icon: 'life-buoy' },
  ] },
  { id: 'sessions', title: 'Odak oturumu', unit: 'oturum', desc: (g) => `${g} odak oturumu tamamla.`, tiers: [
    { goal: 1, title: 'İlk Adım', icon: 'flag' }, { goal: 10, title: 'On Oturum', icon: 'check-circle' }, { goal: 25, title: 'Alışkanlık', icon: 'bookmark' },
    { goal: 50, title: 'Elli Oturum', icon: 'thumbs-up' }, { goal: 100, title: 'Yüz Oturum', icon: 'key' }, { goal: 250, title: 'Dönüm Noktası', icon: 'map' },
    { goal: 500, title: 'Beş Yüz Oturum', icon: 'unlock' },
  ] },
  { id: 'exams', title: 'Denemeler', unit: 'deneme', desc: (g) => `${g} deneme sonucu ekle.`, tiers: [
    { goal: 1, title: 'İlk Deneme', icon: 'file-text' }, { goal: 3, title: 'Üç Deneme', icon: 'edit-3' }, { goal: 5, title: 'Deneme Ustası', icon: 'bar-chart-2' },
    { goal: 10, title: 'On Deneme', icon: 'crosshair' }, { goal: 20, title: 'Deneme Kurdu', icon: 'cpu' }, { goal: 40, title: 'Deneme Efsanesi', icon: 'aperture' },
  ] },
  { id: 'wrongs', title: 'Yanlışlarla yüzleşme', unit: 'soru', desc: (g) => `${g} yanlış soruyu anla.`, tiers: [
    { goal: 5, title: 'Yüzleşen', icon: 'smile' }, { goal: 10, title: 'Yanlışlarla Barış', icon: 'heart' }, { goal: 30, title: 'Yanlış Avcısı', icon: 'target' },
    { goal: 50, title: 'Düzelticilik', icon: 'tool' }, { goal: 100, title: 'Hata Ustası', icon: 'pen-tool' }, { goal: 200, title: 'Hatasız Yol', icon: 'feather' },
  ] },
  { id: 'solved', title: 'Çözülen soru', unit: 'soru', desc: (g) => `Toplam ${g} soru çöz.`, tiers: [
    { goal: 50, title: 'Isınma Soruları', icon: 'droplet' }, { goal: 200, title: 'Soru Çözücü', icon: 'command' }, { goal: 500, title: 'Beş Yüz', icon: 'package' },
    { goal: 1000, title: 'Bin Soru', icon: 'gift' }, { goal: 2500, title: 'İki Buçuk Bin', icon: 'send' }, { goal: 5000, title: 'Beş Bin', icon: 'users' },
    { goal: 10000, title: 'On Bin', icon: 'award' },
  ] },
];

export interface BadgeTier { id: string; title: string; desc: string; icon: string; color: string; goal: number; earned: boolean; progress: number; hint: string }
export interface BadgeCategory { id: string; title: string; unit: string; value: number; tiers: BadgeTier[]; earnedCount: number }

/** Herhangi bir rozet kimliğinden (örn. "hours_10") görünümünü bulur; başkasının rozetini çizmek için. */
export const BADGE_INDEX: Record<string, { title: string; icon: string; color: string; desc: string; category: string }> = {};
CATEGORIES.forEach((c) => c.tiers.forEach((t, i) => { BADGE_INDEX[`${c.id}_${t.goal}`] = { title: t.title, icon: t.icon, color: TIER_COLORS[i % TIER_COLORS.length], desc: c.desc(t.goal), category: c.title }; }));
export const TOTAL_BADGES = Object.keys(BADGE_INDEX).length;

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

/** Şimdiye kadarki en uzun ardışık çalışma günü sayısı. */
export function bestStreak(sessions: { date: string }[]) {
  const days = [...new Set(sessions.map((s) => dayKey(new Date(s.date))))]
    .map((k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d).getTime(); })
    .sort((a, b) => a - b);
  let best = 0; let run = 0; let prev = 0;
  for (const t of days) { run = prev && Math.round((t - prev) / 86400000) === 1 ? run + 1 : 1; best = Math.max(best, run); prev = t; }
  return best;
}

interface Input { sessions: { date: string; durationMinutes: number }[]; exams: unknown[]; wrongs: WrongQuestion[]; questionLogs?: QuestionLog[] }

/** Rozetler tamamen telefondaki verilerden hesaplanır. */
export function computeBadgeCategories({ sessions, exams, wrongs, questionLogs = [] }: Input): BadgeCategory[] {
  const total = sessions.reduce((s, x) => s + x.durationMinutes, 0);
  const values: Record<string, number> = {
    hours: Math.floor(total / 60),
    streak: bestStreak(sessions),
    marathon: sessions.reduce((m, x) => Math.max(m, x.durationMinutes), 0),
    sessions: sessions.length,
    exams: exams.length,
    wrongs: wrongs.filter((w) => w.understood === true).length,
    solved: questionLogs.reduce((s, l) => s + (l.solved || 0), 0),
  };
  return CATEGORIES.map((c) => {
    const value = values[c.id] ?? 0;
    const tiers = c.tiers.map((t, i): BadgeTier => ({
      id: `${c.id}_${t.goal}`, title: t.title, desc: c.desc(t.goal), icon: t.icon, color: TIER_COLORS[i % TIER_COLORS.length], goal: t.goal,
      earned: value >= t.goal, progress: Math.min(1, value / t.goal), hint: `${Math.min(value, t.goal)} / ${t.goal} ${c.unit}`,
    }));
    return { id: c.id, title: c.title, unit: c.unit, value, tiers, earnedCount: tiers.filter((t) => t.earned).length };
  });
}

export const earnedBadgeIds = (cats: BadgeCategory[]) => cats.flatMap((c) => c.tiers.filter((t) => t.earned).map((t) => t.id));
