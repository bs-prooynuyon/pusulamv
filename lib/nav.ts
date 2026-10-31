import { Feather } from '@expo/vector-icons';
import { UserSettings } from '@/types/planim';

export interface NavItem { key: string; title: string; icon: keyof typeof Feather.glyphMap; /** Sekme ise ad, değilse sayfa yolu. */ tab?: string; path?: string }

export const NAV_HOME: NavItem = { key: 'index', title: 'Ana sayfa', icon: 'home', tab: 'index' };
export const NAV_MORE: NavItem = { key: 'more', title: 'Daha', icon: 'grid', tab: 'more' };
/** Ortadaki 3 yere gelebilecek ekranlar (varsayılan sıra). */
export const NAV_CHOICES: NavItem[] = [
  { key: 'schedule', title: 'Program', icon: 'calendar', tab: 'schedule' },
  { key: 'focus', title: 'Odak', icon: 'clock', tab: 'focus' },
  { key: 'topics', title: 'Konular', icon: 'book-open', tab: 'topics' },
  { key: 'exams', title: 'Deneme', icon: 'edit-3', path: '/exams' },
  { key: 'wrongs', title: 'Yanlışlar', icon: 'layers', path: '/wrongs' },
  { key: 'music', title: 'Müzik', icon: 'music', path: '/music' },
  { key: 'weekly', title: 'Özet', icon: 'trending-up', path: '/weekly' },
  { key: 'friends', title: 'Arkadaş', icon: 'users', path: '/friends' },
  { key: 'chat', title: 'Sohbet', icon: 'message-circle', path: '/chat' },
  { key: 'ai', title: 'Yapay zeka', icon: 'cpu', path: '/ai' },
];
/** Öğretmenin alt menüsü sabittir: Sohbet (sınıflar dahil) ve Yapay zeka. */
export const TEACHER_KEYS = ['chat', 'ai'];
const DEFAULTS = ['schedule', 'focus', 'topics'];

/** Alt menüde görünecek orta ekranlar: sıra sabittir, yalnızca kişi kendisi değiştirirse değişir (tıklamaya göre yer değiştirmez). */
export function middleKeys(s: Pick<UserSettings, 'navPicks'> & { role?: string }): string[] {
  if (s.role === 'teacher') return TEACHER_KEYS;
  const valid = new Set(NAV_CHOICES.map((n) => n.key));
  const picks = (s.navPicks ?? []).filter((k, i, all) => valid.has(k) && all.indexOf(k) === i).slice(0, 3);
  return [...picks, ...DEFAULTS.filter((k) => !picks.includes(k))].slice(0, 3);
}

export const navItem = (key: string) => NAV_CHOICES.find((x) => x.key === key);
export const navKeyForPath = (path: string) => NAV_CHOICES.find((n) => n.path === path)?.key;
