/**
 * Tasarım jetonları.
 * Varsayılan: nötr "grafit" (açık temada beyaz zemin + siyah vurgu, koyu temada siyah zemin + beyaz vurgu).
 * Diğer renkler tek bir ton (hue) değerinden üretilir; kullanıcı Profil > Tema'dan seçer.
 */

export type ThemeMode = 'light' | 'dark';

export const ACCENTS = {
  graphite: { label: 'Grafit', hue: -1, sat: 0 },
  blue: { label: 'Mavi', hue: 218, sat: 74 },
  sky: { label: 'Gökyüzü', hue: 199, sat: 85 },
  teal: { label: 'Turkuaz', hue: 174, sat: 70 },
  green: { label: 'Yeşil', hue: 145, sat: 62 },
  lime: { label: 'Limon', hue: 84, sat: 66 },
  yellow: { label: 'Sarı', hue: 45, sat: 92 },
  orange: { label: 'Turuncu', hue: 24, sat: 90 },
  red: { label: 'Kırmızı', hue: 352, sat: 78 },
  pink: { label: 'Pembe', hue: 330, sat: 78 },
  purple: { label: 'Mor', hue: 272, sat: 65 },
  indigo: { label: 'Çivit', hue: 244, sat: 70 },
  brown: { label: 'Kahve', hue: 22, sat: 42 },
} as const;

export type AccentName = keyof typeof ACCENTS;
export const ACCENT_LABELS = Object.fromEntries(Object.entries(ACCENTS).map(([k, v]) => [k, v.label])) as Record<AccentName, string>;
export const ACCENT_NAMES = Object.keys(ACCENTS) as AccentName[];

function hsl(h: number, s: number, l: number) {
  const sat = s / 100;
  const light = l / 100;
  const a = sat * Math.min(light, 1 - light);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const c = light - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(255 * c).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/** Parlak renklerde (sarı, limon) beyaz yazı okunmaz; koyu yazı kullanılır. */
function onColor(h: number, l: number) {
  const yellowish = h >= 40 && h <= 100;
  return yellowish && l > 38 ? '#1A1A1A' : '#FFFFFF';
}

const STATUS = {
  light: { destructive: '#E5484D', success: '#1FA37A', warning: '#F2A64B', lavender: '#8E7AC3', mintSoft: '#E5F6F1', lavenderSoft: '#EEE9FA', warnSoft: '#FFF1E9' },
  dark: { destructive: '#FF7A7F', success: '#3FD9A0', warning: '#F2B25A', lavender: '#B6A2EA', mintSoft: '#1F3A34', lavenderSoft: '#312A47', warnSoft: '#40291F' },
};

function build(mode: ThemeMode, name: AccentName) {
  const { hue, sat } = ACCENTS[name];
  const dark = mode === 'dark';
  const status = STATUS[mode];
  if (hue < 0) {
    return dark
      ? { text: '#F5F5F5', tint: '#FFFFFF', background: '#0B0B0C', foreground: '#F5F5F5', card: '#161618', cardForeground: '#F5F5F5', primary: '#FFFFFF', primaryForeground: '#0B0B0C', secondary: '#232326', secondaryForeground: '#E4E4E7', muted: '#1D1D20', mutedForeground: '#A1A1AA', accent: '#2A2A2E', accentForeground: '#FFFFFF', border: '#2E2E33', input: '#38383E', ...status }
      : { text: '#111113', tint: '#111113', background: '#FFFFFF', foreground: '#111113', card: '#FFFFFF', cardForeground: '#111113', primary: '#111113', primaryForeground: '#FFFFFF', secondary: '#F1F1F3', secondaryForeground: '#27272A', muted: '#F4F4F5', mutedForeground: '#71717A', accent: '#EDEDEF', accentForeground: '#111113', border: '#E4E4E7', input: '#E4E4E7', ...status };
  }
  const pl = dark ? 68 : 46;
  const primary = hsl(hue, sat, pl);
  return dark
    ? { text: hsl(hue, 30, 94), tint: primary, background: hsl(hue, 22, 8), foreground: hsl(hue, 30, 94), card: hsl(hue, 20, 12), cardForeground: hsl(hue, 30, 94), primary, primaryForeground: onColor(hue, pl) === '#FFFFFF' ? hsl(hue, 40, 10) : '#1A1A1A', secondary: hsl(hue, 20, 18), secondaryForeground: hsl(hue, 45, 86), muted: hsl(hue, 18, 15), mutedForeground: hsl(hue, 14, 68), accent: hsl(hue, 32, 20), accentForeground: hsl(hue, 70, 85), border: hsl(hue, 18, 22), input: hsl(hue, 18, 26), ...status }
    : { text: hsl(hue, 35, 12), tint: primary, background: hsl(hue, 60, 98), foreground: hsl(hue, 35, 12), card: '#FFFFFF', cardForeground: hsl(hue, 35, 12), primary, primaryForeground: onColor(hue, pl), secondary: hsl(hue, 50, 94), secondaryForeground: hsl(hue, 40, 26), muted: hsl(hue, 40, 95), mutedForeground: hsl(hue, 14, 42), accent: hsl(hue, 75, 92), accentForeground: hsl(hue, 70, 28), border: hsl(hue, 35, 89), input: hsl(hue, 35, 89), ...status };
}

export function getPalette(mode: ThemeMode, accent: AccentName) {
  return build(mode, ACCENTS[accent] ? accent : 'graphite');
}

const colors = { light: build('light', 'graphite'), dark: build('dark', 'graphite'), radius: 18 };
export default colors;
