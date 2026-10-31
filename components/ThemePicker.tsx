import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { ACCENT_LABELS, ACCENT_NAMES, getPalette } from '@/constants/colors';
import { usePlanim } from '@/context/PlanimContext';
import { useColors } from '@/hooks/useColors';

const MODES = [
  { key: 'system', label: 'Telefona göre' },
  { key: 'light', label: 'Beyaz' },
  { key: 'dark', label: 'Siyah' },
] as const;

/** Tema (telefona göre / beyaz / siyah) ve vurgu rengi seçimi. Seçim anında uygulanır ve kaydedilir. */
export function ThemePicker() {
  const colors = useColors();
  const { settings, updateSettings } = usePlanim();
  return <View style={{ gap: 14 }}>
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {MODES.map((item) => <Pressable key={item.key} onPress={() => updateSettings({ theme: item.key, themeInit: true })} style={{ flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: 13, backgroundColor: settings.theme === item.key ? colors.primary : colors.secondary }}>
        <Text style={{ color: settings.theme === item.key ? colors.primaryForeground : colors.secondaryForeground, fontSize: 12, fontWeight: '800' }}>{item.label}</Text>
      </Pressable>)}
    </View>
    <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: '700' }}>Vurgu rengi</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 14 }}>
      {ACCENT_NAMES.map((name) => {
        const selected = settings.accent === name;
        const swatch = getPalette(colors.mode, name).primary;
        return <Pressable key={name} onPress={() => updateSettings({ accent: name })} style={{ width: '25%', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: swatch, borderWidth: selected ? 3 : 1, borderColor: selected ? colors.foreground : colors.border }} />
          <Text style={{ color: selected ? colors.foreground : colors.mutedForeground, fontSize: 11, fontWeight: selected ? '800' : '600' }}>{ACCENT_LABELS[name]}</Text>
        </Pressable>;
      })}
    </View>
  </View>;
}
