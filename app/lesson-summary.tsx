import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { Card, Header, PrimaryButton, Screen } from '@/components/PlanimUI';
import { usePlanim } from '@/context/PlanimContext';
import { useColors } from '@/hooks/useColors';
import { showInterstitialIfDue } from '@/lib/ads';
import { DENEME_NAME, REVIEW_ID, TopicEntry } from '@/types/planim';

type Row = { topicId: string; title: string; correct: string; wrong: string; blank: string };
const num = (value: string) => Math.max(0, parseInt(value.replace(/\D/g, ''), 10) || 0);

function Box({ label, value, onChange, tint }: { label: string; value: string; onChange: (v: string) => void; tint: string }) {
  const colors = useColors();
  return <View style={{ flex: 1, gap: 6 }}>
    <Text style={{ color: tint, fontSize: 11, fontWeight: '800', textAlign: 'center' }}>{label}</Text>
    <TextInput value={value} onChangeText={(v) => onChange(v.replace(/\D/g, '').slice(0, 3))} keyboardType="numeric" placeholder="0" placeholderTextColor={colors.mutedForeground} selectTextOnFocus
      style={{ height: 50, borderRadius: 14, borderWidth: 1.5, borderColor: tint, backgroundColor: colors.card, color: colors.foreground, fontSize: 20, fontWeight: '800', textAlign: 'center' }} />
  </View>;
}

/** Ders bitince: çalışılan her konu için doğru / yanlış / boş sayısı (yatay, elle yazılır). */
export default function LessonSummaryScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string; }>();
  const { lessons, topics, addQuestionLog } = usePlanim();
  const lesson = lessons.find((item) => item.id === id);
  const subjectTopics = useMemo(() => topics.filter((topic) => topic.subject === lesson?.name), [topics, lesson?.name]);
  const [rows, setRows] = useState<Row[]>(() => (lesson?.topicIds ?? []).filter((tid) => topics.some((t) => t.id === tid)).map((tid) => ({ topicId: tid, title: topics.find((t) => t.id === tid)?.title ?? 'Konu', correct: '', wrong: '', blank: '' })));
  const [picking, setPicking] = useState(false);

  const patch = (topicId: string, key: 'correct' | 'wrong' | 'blank', value: string) => setRows((current) => current.map((row) => row.topicId === topicId ? { ...row, [key]: value } : row));
  const addTopic = (topicId: string, title: string) => { setRows((current) => current.some((row) => row.topicId === topicId) ? current : [...current, { topicId, title, correct: '', wrong: '', blank: '' }]); setPicking(false); };
  const addGeneral = () => addTopic('general', 'Genel soru çözümü');

  const entries: TopicEntry[] = rows.map((row) => ({ topicId: row.topicId, title: row.title, correct: num(row.correct), wrong: num(row.wrong), blank: num(row.blank) })).filter((entry) => entry.correct + entry.wrong + entry.blank > 0);
  const total = entries.reduce((sum, entry) => sum + entry.correct + entry.wrong + entry.blank, 0);
  const wrongTotal = entries.reduce((sum, entry) => sum + entry.wrong, 0);

  const save = (addWrongs: boolean) => {
    if (lesson && entries.length) {
      addQuestionLog({
        lessonId: lesson.id,
        subject: lesson.name,
        solved: total,
        correct: entries.reduce((sum, entry) => sum + entry.correct, 0),
        wrong: wrongTotal,
        blank: entries.reduce((sum, entry) => sum + entry.blank, 0),
        topicIds: rows.map((row) => row.topicId).filter((tid) => tid !== 'general'),
        entries,
      });
    }
    if (entries.length) showInterstitialIfDue();
    if (addWrongs) router.replace(`/wrongs?add=1&subject=${encodeURIComponent(lesson?.name ?? '')}` as never);
    else router.replace('/');
  };
  const confirmSkip = () => entries.length ? save(false) : Alert.alert('Soru girmedin', 'Hiç soru yazmadan bitirelim mi?', [{ text: 'Geri dön', style: 'cancel' }, { text: 'Bitir', onPress: () => save(false) }]);

  const ids = lesson?.topicIds ?? [];
  const isDeneme = lesson?.name === DENEME_NAME;
  const onlyReview = ids.length > 0 && ids.every((tid) => tid === REVIEW_ID);
  if (lesson && (isDeneme || onlyReview)) {
    return <Screen>
      <Header eyebrow="Ders bitti" title={lesson.name} subtitle={isDeneme ? 'Deneme bitti. İstersen sonucunu şimdi ekle.' : 'Ders tekrarı tamamlandı. Soru sayısı girmen gerekmiyor.'} />
      {isDeneme ? <PrimaryButton label="Deneme sonucunu ekle" onPress={() => router.replace('/exams' as never)} icon="edit-3" /> : null}
      <PrimaryButton label={isDeneme ? 'Şimdilik bitir' : 'Bitir'} onPress={() => router.replace('/')} icon="check" secondary={isDeneme} />
    </Screen>;
  }

  return <Screen>
    <Header eyebrow="Ders bitti" title={lesson?.name ?? 'Ders'} subtitle="Çalıştığın her konuda kaç doğru, yanlış ve boş yaptığını yaz." />
    {rows.length === 0 ? <Text style={{ color: colors.mutedForeground }}>Henüz konu eklenmedi. Aşağıdan çalıştığın konuyu seç.</Text> : null}
    {rows.map((row) => <Card key={row.topicId}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Feather name="book-open" size={17} color={colors.primary} />
        <Text style={{ flex: 1, color: colors.foreground, fontWeight: '800', fontSize: 16 }}>{row.title}</Text>
        <Pressable onPress={() => setRows((current) => current.filter((item) => item.topicId !== row.topicId))} hitSlop={10}><Feather name="x" size={17} color={colors.mutedForeground} /></Pressable>
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Box label="DOĞRU" value={row.correct} onChange={(v) => patch(row.topicId, 'correct', v)} tint={colors.success} />
        <Box label="YANLIŞ" value={row.wrong} onChange={(v) => patch(row.topicId, 'wrong', v)} tint={colors.destructive} />
        <Box label="BOŞ" value={row.blank} onChange={(v) => patch(row.topicId, 'blank', v)} tint={colors.mutedForeground} />
      </View>
      <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Toplam {num(row.correct) + num(row.wrong) + num(row.blank)} soru</Text>
    </Card>)}
    <PrimaryButton label="Konu ekle" onPress={() => setPicking((value) => !value)} icon="plus" secondary />
    {picking ? <Card><Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: '700' }}>Çalıştığın konuyu seç</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
        {subjectTopics.filter((topic) => !rows.some((row) => row.topicId === topic.id)).map((topic) => <Pressable key={topic.id} onPress={() => addTopic(topic.id, topic.title)} style={{ paddingVertical: 8, paddingHorizontal: 11, borderRadius: 11, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}><Text style={{ color: colors.foreground, fontSize: 12, fontWeight: '600' }}>{topic.title}</Text></Pressable>)}
        <Pressable onPress={addGeneral} style={{ paddingVertical: 8, paddingHorizontal: 11, borderRadius: 11, backgroundColor: colors.accent }}><Text style={{ color: colors.accentForeground, fontSize: 12, fontWeight: '800' }}>Konu belirtmeden</Text></Pressable>
      </View></Card> : null}
    <Card tone="lavender"><View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
      <Text style={{ color: colors.foreground, fontWeight: '800' }}>{rows.length} konu</Text>
      <Text style={{ color: colors.foreground, fontWeight: '800' }}>{total} soru</Text>
      <Text style={{ color: colors.destructive, fontWeight: '800' }}>{wrongTotal} yanlış</Text>
    </View></Card>
    <PrimaryButton label="Yanlışlarımı ekle" onPress={() => save(true)} icon="camera" disabled={wrongTotal === 0} />
    <PrimaryButton label="Kaydet ve bitir" onPress={confirmSkip} icon="check" secondary />
  </Screen>;
}
