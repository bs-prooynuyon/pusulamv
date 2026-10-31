import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Card, styles } from '@/components/PlanimUI';
import { usePlanim } from '@/context/PlanimContext';
import { useColors } from '@/hooks/useColors';
import { middleKeys, NAV_CHOICES, navItem } from '@/lib/nav';

/** Alt menü ayarı: alt menüde görünecek 3 ekranı kişi seçer; sıra kendiliğinden değişmez. */
export function NavEditor() {
  const colors = useColors();
  const { settings, updateSettings } = usePlanim();
  const current = middleKeys(settings);
  const toggle = (key: string) => {
    if (current.includes(key)) return;
    updateSettings({ navPicks: [...current.slice(1), key] });
  };
  return <Card>
    <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Alt menü</Text>
    <>
      <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: '700' }}>Alt menüde 3 ekran görünür. Birini değiştirmek için yeni bir ekrana dokun; en eski seçimin yerine geçer. Sıra kendiliğinden değişmez.</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{NAV_CHOICES.map((n) => { const on = current.includes(n.key); return <Pressable key={n.key} onPress={() => toggle(n.key)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 13, borderRadius: 14, backgroundColor: on ? colors.primary : colors.card, borderWidth: 1, borderColor: on ? colors.primary : colors.border }}><Feather name={n.icon} size={14} color={on ? colors.primaryForeground : colors.mutedForeground} /><Text style={{ color: on ? colors.primaryForeground : colors.foreground, fontWeight: '700', fontSize: 13 }}>{n.title}</Text></Pressable>; })}</View>
    </>
    <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Şu an: Ana sayfa · {current.map((k) => navItem(k)?.title).join(' · ')} · Daha</Text>
  </Card>;
}
