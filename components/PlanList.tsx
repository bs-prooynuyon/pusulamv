import React from 'react';
import { Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { PlanLesson } from '@/lib/members';
import { WEEKDAYS } from '@/types/planim';

/** Haftalık program satırları (gün, saat, ders, konular). */
export function PlanList({ lessons }: { lessons: PlanLesson[] }) {
  const colors = useColors();
  return <View style={{ gap: 8 }}>
    {[...lessons].sort((a, b) => a.day - b.day || a.startTime.localeCompare(b.startTime)).map((l, i) => <View key={`${l.day}-${l.startTime}-${i}`} style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
      <Text style={{ width: 34, color: colors.primary, fontWeight: '800' }}>{WEEKDAYS[l.day]}</Text>
      <Text style={{ width: 96, color: colors.mutedForeground, fontSize: 12 }}>{l.startTime}–{l.endTime}</Text>
      <View style={{ flex: 1 }}><Text style={{ color: colors.foreground, fontWeight: '800' }}>{l.name}</Text>{l.topics?.length ? <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>{l.topics.join(' · ')}</Text> : null}</View>
    </View>)}
  </View>;
}
