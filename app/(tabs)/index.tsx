import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { TopBar } from '@/components/TopBar';
import { usePlanim } from '@/context/PlanimContext';
import { useColors } from '@/hooks/useColors';
import { quoteOfToday } from '@/constants/quotes';
import { upcomingDays } from '@/constants/specialDays';
import { lgsCountdown } from '@/lib/lgs';
import { Subject } from '@/types/planim';

type Shortcut = { title: string; subtitle: string; icon: keyof typeof Feather.glyphMap; route: string };

const STUDENT_SHORTCUTS: Shortcut[] = [
  { title: 'Yapay zeka', subtitle: 'Program, soru çözümü', icon: 'cpu', route: '/ai' },
  { title: 'Deneme ekle', subtitle: 'Netlerini kaydet', icon: 'edit-3', route: '/exams' },
  { title: 'Yanlış sorular', subtitle: 'Tekrar çöz', icon: 'layers', route: '/wrongs' },
  { title: 'Sohbet', subtitle: 'Sınıf, okul ve arkadaşlar', icon: 'message-circle', route: '/chat' },
];
const TEACHER_SHORTCUTS: Shortcut[] = [
  { title: 'Sohbet', subtitle: 'Sınıflar, öğrenciler, okul', icon: 'message-circle', route: '/chat' },
  { title: 'Yapay zeka', subtitle: 'Asistan ve program taslağı', icon: 'cpu', route: '/ai' },
];

const minutesBetween = (a: string, b: string) => { const [h1, m1] = a.split(':').map(Number); const [h2, m2] = b.split(':').map(Number); return Math.max(0, h2 * 60 + m2 - (h1 * 60 + m1)); };
const greeting = (h: number) => (h < 12 ? 'Günaydın' : h < 18 ? 'İyi günler' : 'İyi akşamlar');

/** Ana sayfa seçili temaya (açık / koyu / vurgu rengi) göre boyanır; sabit mavi yok. */
export default function HomeScreen() {
  const c = useColors();
  const { settings, topics, lessons } = usePlanim();
  const teacher = settings.role === 'teacher';
  const [now] = useState(() => new Date());
  const lgs = useMemo(() => lgsCountdown(settings), [settings]);
  const days = useMemo(() => upcomingDays(teacher ? 'teacher' : 'student', lgs.date, 4, now), [teacher, lgs.date, now]);
  const missingTopics = topics.filter((topic) => topic.status === 'missing');
  const subjects = [...new Set(missingTopics.map((topic) => topic.subject))] as Subject[];
  const name = settings.studentName || (teacher ? 'hocam' : 'arkadaşım');
  const today = (now.getDay() + 6) % 7;
  const todays = lessons.filter((l) => l.day === today).sort((a, b) => a.startTime.localeCompare(b.startTime)).slice(0, 3);
  const examLabel = `${new Date(`${lgs.date}T00:00:00`).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}${lgs.estimated ? ' (tahmini)' : ''}`;
  const card = { backgroundColor: c.card, borderWidth: 1, borderColor: c.border } as const;
  const list = teacher ? TEACHER_SHORTCUTS : STUDENT_SHORTCUTS;

  return <View style={{ flex: 1, backgroundColor: c.background }}>
    <TopBar />
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingTop: 16, gap: 22 }}>
      <View>
        <Text style={{ color: c.mutedForeground, fontSize: 14, fontWeight: '600' }}>{greeting(now.getHours())}, {name}</Text>
        <Text style={{ color: c.foreground, fontSize: 28, fontWeight: '800', lineHeight: 34, marginTop: 4 }}>{teacher ? 'Bugün öğrencilerin yanındasın.' : 'Bugün senin günün.'}</Text>
      </View>

      {!teacher ? <View style={{ borderRadius: 24, padding: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: c.primary }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.primaryForeground, opacity: 0.8, fontSize: 12, fontWeight: '800', letterSpacing: 1.1 }}>{lgs.year} LGS’YE KALAN</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
            <Text style={{ color: c.primaryForeground, fontSize: 56, fontWeight: '800', lineHeight: 62 }}>{lgs.days}</Text>
            <Text style={{ color: c.primaryForeground, fontSize: 18, fontWeight: '700' }}>gün</Text>
          </View>
          <Text style={{ color: c.primaryForeground, opacity: 0.8, fontSize: 13, marginTop: 8 }}>{examLabel}</Text>
        </View>
        <Svg viewBox="0 0 64 64" width={72} height={72} fill="none" stroke={c.primaryForeground} strokeWidth={3}>
          <Circle cx={32} cy={32} r={28} /><Path d="M32 12 38 32 32 52 26 32z" fill={c.primaryForeground} fillOpacity={0.25} />
        </Svg>
      </View> : null}

      {!teacher ? <View style={[card, { borderRadius: 20, paddingHorizontal: 18, paddingVertical: 6 }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, paddingBottom: 10 }}>
          <Text style={{ color: c.foreground, fontSize: 17, fontWeight: '800' }}>Bugünün dersleri</Text>
          <Pressable onPress={() => router.navigate('/schedule' as never)} hitSlop={8}><Text style={{ color: c.primary, fontSize: 13, fontWeight: '700' }}>Programa git</Text></Pressable>
        </View>
        {todays.length === 0 ? <Text style={{ color: c.mutedForeground, fontSize: 14, paddingBottom: 14 }}>Bugün için ders yok. Programa ders ekleyebilirsin.</Text> : null}
        {todays.map((l, i) => {
          const firstTopic = topics.find((t) => l.topicIds?.includes(t.id))?.title;
          const dur = minutesBetween(l.startTime, l.endTime);
          return <View key={l.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: c.border }}>
            <Text style={{ width: 56, color: c.primary, fontSize: 16, fontWeight: '800' }}>{l.startTime}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.foreground, fontSize: 15, fontWeight: '700' }}>{l.name}</Text>
              <Text style={{ color: c.mutedForeground, fontSize: 12, marginTop: 2 }}>{[firstTopic, dur ? `${dur} dk` : ''].filter(Boolean).join(' · ')}</Text>
            </View>
          </View>;
        })}
      </View> : null}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {list.map((s) => <Pressable key={s.route} onPress={() => router.push(s.route as never)} style={{ flexBasis: '47%', flexGrow: 1 }}>
          <View style={[card, { borderRadius: 18, padding: 16, gap: 10 }]}>
            <Feather name={s.icon} size={22} color={c.primary} />
            <View>
              <Text style={{ color: c.foreground, fontSize: 15, fontWeight: '800' }}>{s.title}</Text>
              <Text style={{ color: c.mutedForeground, fontSize: 12, marginTop: 2 }}>{s.subtitle}</Text>
            </View>
          </View>
        </Pressable>)}
      </View>

      {!teacher ? <Pressable onPress={() => router.navigate('/topics' as never)}>
        <View style={[card, { borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }]}>
          <View style={{ width: 46, height: 46, borderRadius: 16, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' }}><Feather name="compass" size={22} color={c.accentForeground} /></View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.foreground, fontSize: 16, fontWeight: '800' }}>{missingTopics.length} konu üzerinde çalışabilirsin</Text>
            <Text style={{ color: c.mutedForeground, fontSize: 13, marginTop: 3 }}>{subjects.slice(0, 3).join(' · ') || 'Henüz konu yok'}</Text>
          </View>
          <Feather name="chevron-right" size={19} color={c.mutedForeground} />
        </View>
      </Pressable> : null}

      <View style={[card, { borderRadius: 20, paddingHorizontal: 18, paddingVertical: 6 }]}>
        <Text style={{ color: c.foreground, fontSize: 17, fontWeight: '800', paddingTop: 14, paddingBottom: 6 }}>Yaklaşan günler</Text>
        {days.length === 0 ? <Text style={{ color: c.mutedForeground, paddingVertical: 12 }}>Yaklaşan özel gün yok.</Text> : null}
        {days.map((d, i) => <View key={`${d.title}-${d.date}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: c.border }}>
          <View style={{ minWidth: 54, alignItems: 'center', paddingVertical: 6, borderRadius: 12, backgroundColor: d.days <= 7 ? c.primary : c.secondary }}>
            <Text style={{ color: d.days <= 7 ? c.primaryForeground : c.secondaryForeground, fontSize: 17, fontWeight: '800' }}>{d.days === 0 ? 'Bugün' : d.days}</Text>
            {d.days > 0 ? <Text style={{ color: d.days <= 7 ? c.primaryForeground : c.secondaryForeground, fontSize: 10, fontWeight: '700' }}>gün</Text> : null}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.foreground, fontSize: 14, fontWeight: '700' }}>{d.title}</Text>
            <Text style={{ color: c.mutedForeground, fontSize: 12, marginTop: 2 }}>{new Date(`${d.date}T00:00:00`).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}{d.estimated ? ' (tahmini)' : ''}</Text>
          </View>
        </View>)}
      </View>

      <View style={[card, { borderRadius: 18, padding: 16, gap: 8 }]}>
        <Text style={{ color: c.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1.1 }}>GÜNÜN SÖZÜ</Text>
        <Text style={{ color: c.foreground, fontSize: 16, lineHeight: 24, fontWeight: '600' }}>{quoteOfToday()}</Text>
      </View>
    </ScrollView>
  </View>;
}
