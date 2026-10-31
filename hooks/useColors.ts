import { useColorScheme } from 'react-native';
import colors, { getPalette } from '@/constants/colors';
import { useOptionalPlanim } from '@/context/PlanimContext';

/**
 * Seçili tema (açık / koyu / sistem) ve vurgu rengine göre jetonları döndürür.
 * PlanimProvider dışında (ör. hata ekranı) sistem temasına ve grafit vurguya düşer.
 */
export function useColors() {
  const system = useColorScheme();
  const planim = useOptionalPlanim();
  const theme = planim?.settings.theme ?? 'system';
  const accent = planim?.settings.accent ?? 'graphite';
  const mode = theme === 'system' ? (system === 'dark' ? 'dark' : 'light') : theme;
  return { ...getPalette(mode, accent), radius: colors.radius, mode, isDark: mode === 'dark' };
}
