import React, { useEffect, useRef } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

const ITEM = 40;
const pad = (n: number) => String(n).padStart(2, '0');

function Column({ count, value, onChange }: { count: number; value: number; onChange: (v: number) => void }) {
  const colors = useColors();
  const ref = useRef<ScrollView>(null);
  useEffect(() => { const t = setTimeout(() => ref.current?.scrollTo({ y: value * ITEM, animated: false }), 60); return () => clearTimeout(t); }, []);
  return <View style={{ height: ITEM * 3, width: 70, overflow: 'hidden' }}>
    <View pointerEvents="none" style={{ position: 'absolute', top: ITEM, height: ITEM, left: 0, right: 0, borderRadius: 12, backgroundColor: colors.accent }} />
    <ScrollView ref={ref} showsVerticalScrollIndicator={false} snapToInterval={ITEM} decelerationRate="fast" nestedScrollEnabled
      contentContainerStyle={{ paddingVertical: ITEM }}
      onMomentumScrollEnd={(e) => onChange(Math.max(0, Math.min(count - 1, Math.round(e.nativeEvent.contentOffset.y / ITEM))))}
      onScrollEndDrag={(e) => onChange(Math.max(0, Math.min(count - 1, Math.round(e.nativeEvent.contentOffset.y / ITEM))))}>
      {Array.from({ length: count }, (_, i) => <View key={i} style={{ height: ITEM, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: i === value ? 22 : 17, fontWeight: i === value ? '800' : '500', color: i === value ? colors.accentForeground : colors.mutedForeground }}>{pad(i)}</Text></View>)}
    </ScrollView>
  </View>;
}

/** Kaydırmalı saat seçici (yazmak yok). value ve onChange "SS:DD" biçiminde. */
export function WheelTime({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const colors = useColors();
  const [h, m] = value.split(':').map(Number);
  return <View style={{ alignItems: 'center', gap: 4 }}>
    <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: '700' }}>{label}</Text>
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Column count={24} value={h || 0} onChange={(v) => onChange(`${pad(v)}:${pad(m || 0)}`)} />
      <Text style={{ color: colors.foreground, fontSize: 22, fontWeight: '800' }}>:</Text>
      <Column count={60} value={m || 0} onChange={(v) => onChange(`${pad(h || 0)}:${pad(v)}`)} />
    </View>
  </View>;
}
