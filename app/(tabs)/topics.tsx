import { SelectBox } from '@/components/SelectBox';
import { Feather } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Card, Field, Header, IconButton, PrimaryButton, Screen, styles } from '@/components/PlanimUI';
import { usePlanim } from '@/context/PlanimContext';
import { SUBJECTS, SUBJECT_COLORS, Subject } from '@/types/planim';
import { useColors } from '@/hooks/useColors';

export default function TopicsScreen() {
  const colors = useColors();
  const { topics, toggleTopic, addTopic } = usePlanim();
  const [selected, setSelected] = useState<Subject | 'Tümü'>('Tümü');
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState<Subject>('Matematik');
  const filtered = useMemo(() => selected === 'Tümü' ? topics : topics.filter((topic) => topic.subject === selected), [selected, topics]);
  const save = () => { if (!title.trim()) return; addTopic({ title: title.trim(), subject, status: 'missing', isCustom: true, note: '' }); setTitle(''); setAdding(false); };

  return <Screen topBar><Header eyebrow="Küçük adımlar, büyük fark" title="Konularım" subtitle="Eksik gördüklerini işaretle, öğrendikçe üzerinden geç." right={<IconButton name="plus" onPress={() => setAdding((value) => !value)} color={colors.primary} />} />
    <SelectBox placeholder="Ders seçiniz..." value={selected} options={['Tümü', ...SUBJECTS]} onSelect={(v) => setSelected(v as typeof selected)} />
    {adding ? <Card tone="pink"><Text style={[styles.sectionTitle, { color: colors.foreground }]}>Özel konu ekle</Text><Field label="Konu adı" value={title} onChangeText={setTitle} placeholder="Örn. Olasılık soru tipi" /><Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Ders</Text><View style={{ flexDirection: 'row', gap: 7, flexWrap: 'wrap' }}>{SUBJECTS.map((item) => <Pressable key={item} onPress={() => setSubject(item)} style={{ paddingVertical: 8, paddingHorizontal: 10, borderRadius: 11, backgroundColor: subject === item ? SUBJECT_COLORS[item] : colors.card }}><Text style={{ color: subject === item ? '#FFFFFF' : colors.mutedForeground, fontSize: 11, fontWeight: '700' }}>{item}</Text></Pressable>)}</View><PrimaryButton label="Konuyu ekle" onPress={save} icon="plus" /></Card> : null}
    <View style={{ gap: 10 }}>{filtered.length === 0 ? <Text style={{ color: colors.mutedForeground }}>Henüz konu yok.</Text> : null}{filtered.map((topic) => <Pressable key={topic.id} onPress={() => toggleTopic(topic.id)}><Card style={{ paddingVertical: 14 }}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><View style={{ width: 32, height: 32, borderRadius: 11, backgroundColor: topic.status === 'learned' ? colors.mintSoft : colors.muted, alignItems: 'center', justifyContent: 'center' }}><Feather name={topic.status === 'learned' ? 'check' : 'book-open'} size={16} color={topic.status === 'learned' ? colors.success : SUBJECT_COLORS[topic.subject]} /></View><View style={{ flex: 1 }}><Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '800', textDecorationLine: topic.status === 'learned' ? 'line-through' : 'none' }}>{topic.title}</Text><Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 3 }}>{topic.subject}{topic.isCustom ? ' · özel konu' : ''}</Text></View><View style={{ paddingVertical: 6, paddingHorizontal: 9, borderRadius: 10, backgroundColor: topic.status === 'learned' ? colors.mintSoft : colors.warnSoft }}><Text style={{ color: topic.status === 'learned' ? colors.success : colors.destructive, fontSize: 11, fontWeight: '800' }}>{topic.status === 'learned' ? 'ÖĞRENDİM' : 'EKSİK'}</Text></View></View></Card></Pressable>)}</View>
    <Pressable onPress={() => router.push('/wrongs' as never)}><Card tone="lavender"><View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><Feather name="layers" size={21} color={colors.lavender} /><View style={{ flex: 1 }}><Text style={{ color: colors.foreground, fontWeight: '800' }}>Yanlış soru deposu</Text><Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 3 }}>Yanlışlarını ekle ve tekrar çöz.</Text></View><Feather name="arrow-right" size={18} color={colors.lavender} /></View></Card></Pressable>
  </Screen>;
}