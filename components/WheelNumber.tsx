import React, { useEffect, useRef } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

const ITEM = 40;

/** Kaydırmalı sayı seçici (örn. dakika). Yazmak yok. */
export function WheelNumber({ label, value, min, max, step = 1, suffix, onChange }: { label?: string; value: number; min: number; max: number; step?: number; suffix?: string; onChange: (v: number) => void }) {
  const colors = useColors();
  const ref = useRef<ScrollView>(null);
  const count = Math.floor((max - min) / step) + 1;
  const index = Math.max(0, Math.min(count - 1, Math.round((value - min) / step)));
  const picked = useRef(-1);
  // Değer dışarıdan (hazır butonlarla) değişirse tekerleği oraya götür.
  useEffect(() => { if (picked.current === index) return; const t = setTimeout(() => ref.current?.scrollTo({ y: index * ITEM, animated: false }), 60); return () => clearTimeout(t); }, [index]);
  const pick = (y: number) => { const i = Math.max(0, Math.min(count - 1, Math.round(y / ITEM))); picked.current = i; onChange(min + i * step); };
  return <View style={{ alignItems: 'center', gap: 4 }}>
    {label ? <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: '700' }}>{label}</Text> : null}
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ height: ITEM * 3, width: 90, overflow: 'hidden' }}>
        <View pointerEvents="none" style={{ position: 'absolute', top: ITEM, height: ITEM, left: 0, right: 0, borderRadius: 12, backgroundColor: colors.accent }} />
        <ScrollView ref={ref} showsVerticalScrollIndicator={false} snapToInterval={ITEM} decelerationRate="fast" nestedScrollEnabled contentContainerStyle={{ paddingVertical: ITEM }}
          onMomentumScrollEnd={(e) => pick(e.nativeEvent.contentOffset.y)} onScrollEndDrag={(e) => pick(e.nativeEvent.contentOffset.y)}>
          {Array.from({ length: count }, (_, i) => <View key={i} style={{ height: ITEM, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: i === index ? 24 : 17, fontWeight: i === index ? '800' : '500', color: i === index ? colors.accentForeground : colors.mutedForeground }}>{min + i * step}</Text></View>)}
        </ScrollView>
      </View>
      {suffix ? <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '800' }}>{suffix}</Text> : null}
    </View>
  </View>;
}
