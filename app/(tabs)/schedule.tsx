import { conflictMessage, findConflict, toMinutes } from '@/lib/lessonConflict';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { Card, Field, Header, IconButton, PrimaryButton, Screen, SectionTitle, styles } from '@/components/PlanimUI';
import { usePlanim } from '@/context/PlanimContext';
import { ConfirmSheet } from '@/components/ConfirmSheet';
import { SelectBox } from '@/components/SelectBox';
import { WheelTime } from '@/components/WheelTime';
import { DENEME_GROUPS, DENEME_NAME, REVIEW_ID, SUBJECTS, WEEKDAYS, topicLabel } from '@/types/planim';
import { useColors } from '@/hooks/useColors';

export default function ScheduleScreen() {
  const colors = useColors();
  const { lessons, addLesson, updateLesson, removeLesson, topics, playlists } = usePlanim();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState((new Date().getDay() + 6) % 7);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [start, setStart] = useState('17:00');
  const [end, setEnd] = useState('17:45');
  const [place, setPlace] = useState('');
  const [topicIds, setTopicIds] = useState<string[]>([]);
  const [alarmMinutes, setAlarmMinutes] = useState(10);
  const [playlistId, setPlaylistId] = useState('');
  const [toRemove, setToRemove] = useState<string | null>(null);

  const customSubjects = [...new Set(lessons.map((lesson) => lesson.name))].filter((item) => !SUBJECTS.includes(item as never) && item !== DENEME_NAME);
  const realTopics = topics.filter((topic) => topic.subject === name);
  const subjectTopics: { id: string; title: string }[] = name === DENEME_NAME ? DENEME_GROUPS : realTopics.length ? [{ id: REVIEW_ID, title: 'Ders tekrarı' }, ...realTopics] : [];
  const dayLessons = lessons.filter((lesson) => lesson.day === selectedDay).sort((a, b) => a.startTime.localeCompare(b.startTime));
  const save = () => {
    if (!name.trim()) return Alert.alert('Ders adı gerekli', 'Listeden bir ders seçince programa ekleyebiliriz.');
    const sm = toMinutes(start), em = toMinutes(end);
    if (sm === null || em === null) return Alert.alert('Saat hatalı', 'Saati 17:00 gibi yaz.');
    if (em <= sm) return Alert.alert('Saat hatalı', 'Bitiş saati başlangıç saatinden sonra olmalı.');
    const clash = findConflict(lessons, { day: selectedDay, startTime: start, endTime: end }, editingId ?? undefined);
    if (clash) return Alert.alert('Saat çakışıyor', conflictMessage(clash));
    const data = { name: name.trim(), startTime: start, endTime: end, place, day: selectedDay, alarmMinutes, topicIds, playlistId: playlistId || undefined, spotifyTrackUri: undefined, spotifyName: undefined };
    if (editingId) updateLesson(editingId, data); else addLesson(data);
    setEditingId(null);
    setName(''); setTopicIds([]); setPlaylistId(''); setAlarmMinutes(10); setAdding(false);
  };

  const startEdit = (lesson: (typeof lessons)[number]) => {
    setEditingId(lesson.id); setSelectedDay(lesson.day); setName(lesson.name); setStart(lesson.startTime); setEnd(lesson.endTime); setPlace(lesson.place);
    setTopicIds(lesson.topicIds ?? []); setAlarmMinutes(lesson.alarmMinutes); setPlaylistId(lesson.playlistId ?? ''); setAdding(true);
  };
  const toggleForm = () => { if (adding) { setEditingId(null); setName(''); setTopicIds([]); } setAdding((value) => !value); };

  return <Screen topBar>
    <Header eyebrow="Çalışma alanın" title="Ders programı" subtitle="Haftanı kendine uygun bir ritme dönüştür." right={<IconButton name={adding ? 'x' : 'plus'} onPress={toggleForm} color={colors.primary} />} />
    <View style={{ flexDirection: 'row', gap: 8 }}>{WEEKDAYS.map((day, index) => <Pressable key={day} onPress={() => setSelectedDay(index)} style={{ flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: 14, backgroundColor: selectedDay === index ? colors.primary : colors.card, borderWidth: 1, borderColor: selectedDay === index ? colors.primary : colors.border }}><Text style={{ color: selectedDay === index ? colors.primaryForeground : colors.mutedForeground, fontSize: 12, fontWeight: '800' }}>{day}</Text></Pressable>)}</View>
    {adding ? <Card tone="pink"><Text style={[styles.sectionTitle, { color: colors.foreground }]}>{editingId ? 'Dersi düzenle' : 'Yeni ders ekle'}</Text><SelectBox label="Ders" placeholder="Ders seçiniz..." value={name} options={[...SUBJECTS, DENEME_NAME, ...customSubjects]} allowCustom onSelect={(v) => { setName(v); setTopicIds([]); }} />{subjectTopics.length ? <><Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{name === DENEME_NAME ? 'Deneme türü (Sözel: Türkçe, İnkılap, Din, İngilizce · Sayısal: Matematik, Fen)' : 'Çalışacağım konular (birden fazla seçebilirsin)'}</Text><View style={{ flexDirection: 'row', gap: 7, flexWrap: 'wrap' }}>{subjectTopics.map((topic) => { const on = topicIds.includes(topic.id); return <Pressable key={topic.id} onPress={() => setTopicIds((current) => on ? current.filter((id) => id !== topic.id) : [...current, topic.id])} style={{ paddingVertical: 8, paddingHorizontal: 11, borderRadius: 11, backgroundColor: on ? colors.accent : colors.card, borderWidth: 1, borderColor: on ? colors.primary : colors.border }}><Text style={{ color: on ? colors.accentForeground : colors.mutedForeground, fontSize: 12, fontWeight: on ? '800' : '600' }}>{topic.title}</Text></Pressable>; })}</View></> : null}<View style={{ flexDirection: 'row', justifyContent: 'space-around' }}><WheelTime label="Başlangıç" value={start} onChange={setStart} /><WheelTime label="Bitiş" value={end} onChange={setEnd} /></View><Field label="Yer (opsiyonel)" value={place} onChangeText={setPlace} placeholder="Ev, kütüphane..." /><SelectBox label="Ders başlamadan kaç dakika önce uyarayım?" placeholder="Süre seçiniz..." value={`${alarmMinutes} dk önce`} options={[5, 10, 15, 30].map((m) => `${m} dk önce`)} onSelect={(v) => setAlarmMinutes(parseInt(v, 10))} /><SelectBox label="Ders başlayınca müzik" placeholder="Müzik seçiniz..." value={playlistId ? (playlists.find((pl) => pl.id === playlistId)?.name ?? 'Müziksiz') : 'Müziksiz'} options={['Müziksiz', ...playlists.map((pl) => pl.name)]} onSelect={(v) => setPlaylistId(playlists.find((pl) => pl.name === v)?.id ?? '')} /><Pressable onPress={() => router.push('/music' as never)}><Text style={{ color: colors.primary, fontSize: 12, fontWeight: '800' }}>+ Müzik sayfasında çalma listesi yap</Text></Pressable><PrimaryButton label={editingId ? 'Değişiklikleri kaydet' : 'Programa ekle'} onPress={save} icon="check" /></Card> : null}
    <SectionTitle title={`${WEEKDAYS[selectedDay]} planın`} />
    {dayLessons.length ? dayLessons.map((lesson) => <Card key={lesson.id}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}><View style={{ width: 49, alignItems: 'center', paddingVertical: 9, borderRadius: 15, backgroundColor: colors.accent }}><Text style={{ color: colors.primary, fontWeight: '800', fontSize: 13 }}>{lesson.startTime}</Text><View style={{ height: 13, borderLeftWidth: 1, borderLeftColor: colors.border, marginVertical: 3 }} /><Text style={{ color: colors.mutedForeground, fontSize: 11 }}>{lesson.endTime}</Text></View><View style={{ flex: 1 }}><Text style={{ color: colors.foreground, fontWeight: '800', fontSize: 16 }}>{lesson.name}</Text><Text style={{ color: colors.mutedForeground, fontSize: 13, marginTop: 4 }}>{lesson.place || 'Kendi çalışma alanın'} · {lesson.alarmMinutes} dk önce hatırlat</Text>{lesson.topicIds?.length ? <Text style={{ color: colors.primary, fontSize: 12, marginTop: 4 }}>{lesson.topicIds.map((id) => topicLabel(id, topics)).filter(Boolean).join(' · ')}</Text> : null}</View><Pressable onPress={() => startEdit(lesson)} hitSlop={8}><Feather name="edit-2" size={17} color={colors.primary} /></Pressable><Pressable onPress={() => setToRemove(lesson.id)}><Feather name="trash-2" size={17} color={colors.mutedForeground} /></Pressable></View><View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}><Feather name="bell" size={14} color={colors.warning} /><Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Ders öncesi uyarı · Başlangıç alarmı ayrı</Text></View>{lesson.playlistId && playlists.find((pl) => pl.id === lesson.playlistId) ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 11, borderRadius: 12, backgroundColor: colors.mintSoft }}><Feather name="music" size={15} color={colors.success} /><Text numberOfLines={1} style={{ color: colors.success, fontSize: 12, fontWeight: '800', flex: 1 }}>{playlists.find((pl) => pl.id === lesson.playlistId)?.name}</Text></View> : null}<Pressable onPress={() => router.push(`/lesson-start?id=${lesson.id}` as never)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Feather name="play-circle" size={15} color={colors.primary} /><Text style={{ color: colors.primary, fontSize: 12, fontWeight: '800' }}>Şimdi başla</Text></Pressable><Pressable onPress={() => router.push(`/lesson-summary?id=${lesson.id}` as never)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Feather name="edit-3" size={15} color={colors.primary} /><Text style={{ color: colors.primary, fontSize: 12, fontWeight: '800' }}>Çözülen soru ekle</Text></Pressable></Card>) : <Card style={{ alignItems: 'center', paddingVertical: 28 }}><Feather name="calendar" size={27} color={colors.mutedForeground} /><Text style={{ color: colors.foreground, fontWeight: '800', marginTop: 10 }}>Henüz ders eklenmedi</Text><Text style={{ color: colors.mutedForeground, fontSize: 13, marginTop: 4, textAlign: 'center' }}>Sağ üstteki + ile bu güne bir ders ekleyebilirsin.</Text><PrimaryButton label="İlk dersi ekle" onPress={() => setAdding(true)} icon="plus" secondary /></Card>}
    <PrimaryButton label="Yapay zeka ile program yap" onPress={() => router.push('/ai-schedule' as never)} icon="cpu" secondary />
    <ConfirmSheet visible={!!toRemove} danger title="Ders kaldırılsın mı?" text="Bu ders programdan silinecek." confirmLabel="Kaldır" onCancel={() => setToRemove(null)} onConfirm={() => { if (toRemove) removeLesson(toRemove); setToRemove(null); }} />
  </Screen>;
}