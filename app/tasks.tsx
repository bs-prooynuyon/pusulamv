import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { Card, Field, Header, PrimaryButton, Screen, SectionTitle } from '@/components/PlanimUI';
import { usePlanim } from '@/context/PlanimContext';
import { useColors } from '@/hooks/useColors';
import { createTask, deleteTask, doneNames, DUE_CHOICES, dueFrom, isDone, markDone, subscribeTasks, TaskRow, undoDone } from '@/lib/tasks';

const dateText = (iso: string) => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? '' : `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`; };

/** Sınıf ödevleri ve hedefleri. Öğretmen ekler; öğrenci tamamlar. Hedefte ilerleme, odak sürenden otomatik hesaplanır. */
export default function TasksScreen() {
  const colors = useColors();
  const { gid, name, owner } = useLocalSearchParams<{ gid: string; name?: string; owner?: string }>();
  const isOwner = owner === '1';
  const { sessions, settings } = usePlanim();
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [names, setNames] = useState<Record<string, string[]>>({});
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [kind, setKind] = useState<'homework' | 'goal'>('homework');
  const [minutes, setMinutes] = useState('120');
  const [dueDays, setDueDays] = useState(3);
  const [busy, setBusy] = useState(false);
  const me = settings.studentName || 'Öğrenci';

  useEffect(() => {
    if (!gid) return undefined;
    return subscribeTasks(gid, setTasks, () => Alert.alert('Ödevler yüklenemedi', 'Bağlantını kontrol edip tekrar dene.'));
  }, [gid]);

  const progress = (t: TaskRow) => {
    const from = new Date(t.created_at).getTime(); const to = t.due ? new Date(t.due).getTime() : Infinity;
    return sessions.filter((s) => { const x = new Date(s.date).getTime(); return x >= from && x <= to; }).reduce((sum, s) => sum + s.durationMinutes, 0);
  };

  // Öğrenci: bu görevleri daha önce tamamlamış mı bak; hedef dolmuşsa otomatik tamamla.
  useEffect(() => {
    if (isOwner || !gid) return;
    tasks.forEach(async (t) => {
      try {
        let ok = await isDone(gid, t.id);
        if (!ok && t.kind === 'goal' && t.target_minutes > 0 && progress(t) >= t.target_minutes) { await markDone(gid, t.id, me); ok = true; }
        setDone((cur) => (cur[t.id] === ok ? cur : { ...cur, [t.id]: ok }));
      } catch { /* görev şimdilik atlanır */ }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, isOwner, gid, sessions.length]);

  const add = async () => {
    const mins = Math.max(10, Math.min(3000, Number(minutes) || 0));
    if (!title.trim()) return Alert.alert('Başlık yaz', 'Örn. “Üslü sayılar 30 soru”.');
    setBusy(true);
    try { await createTask(gid, { title: title.trim(), note: note.trim(), kind, targetMinutes: mins, due: dueFrom(dueDays) }); setTitle(''); setNote(''); }
    catch (e) { Alert.alert('Eklenemedi', e instanceof Error ? e.message : 'Tekrar dener misin?'); } finally { setBusy(false); }
  };
  const toggle = async (t: TaskRow) => {
    setBusy(true);
    try { if (done[t.id]) await undoDone(gid, t.id); else await markDone(gid, t.id, me); setDone((c) => ({ ...c, [t.id]: !c[t.id] })); }
    catch (e) { Alert.alert('Olmadı', e instanceof Error ? e.message : 'Tekrar dener misin?'); } finally { setBusy(false); }
  };
  const showDone = async (t: TaskRow) => {
    try { setNames((c) => ({ ...c, [t.id]: [] })); const list = await doneNames(gid, t.id); setNames((c) => ({ ...c, [t.id]: list })); }
    catch { Alert.alert('Liste alınamadı'); }
  };

  return <Screen>
    <Header eyebrow={String(name ?? 'Sınıf')} title="Ödev ve hedefler" subtitle={isOwner ? 'Sınıfa ödev ya da çalışma hedefi koy; kimin tamamladığını gör.' : 'Öğretmeninin verdiği ödevler ve hedefler.'} />

    {isOwner ? <Card tone="lavender">
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {([['homework', 'Ödev'], ['goal', 'Süre hedefi']] as const).map(([k, label]) => <Pressable key={k} onPress={() => setKind(k)} style={{ flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', backgroundColor: kind === k ? colors.primary : colors.card, borderWidth: 1, borderColor: kind === k ? colors.primary : colors.border }}><Text style={{ color: kind === k ? colors.primaryForeground : colors.mutedForeground, fontWeight: '800' }}>{label}</Text></Pressable>)}
      </View>
      <Field label="Başlık" value={title} onChangeText={setTitle} placeholder={kind === 'goal' ? 'Örn. Bu hafta matematik çalış' : 'Örn. Üslü sayılar 30 soru'} />
      {kind === 'goal' ? <Field label="Hedef süre (dakika)" value={minutes} onChangeText={setMinutes} keyboardType="numeric" /> : null}
      <Field label="Not (isteğe bağlı)" value={note} onChangeText={setNote} placeholder="Kısa açıklama" />
      <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: '700' }}>Son gün</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {DUE_CHOICES.map((c) => <Pressable key={c.label} onPress={() => setDueDays(c.days)} style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, backgroundColor: dueDays === c.days ? colors.primary : colors.card, borderWidth: 1, borderColor: dueDays === c.days ? colors.primary : colors.border }}><Text style={{ color: dueDays === c.days ? colors.primaryForeground : colors.mutedForeground, fontWeight: '800', fontSize: 12 }}>{c.label}</Text></Pressable>)}
      </View>
      <PrimaryButton label="Sınıfa ekle" icon="plus" disabled={busy} onPress={add} />
    </Card> : null}

    <SectionTitle title={tasks.length ? 'Görevler' : 'Henüz görev yok'} />
    {tasks.map((t) => {
      const got = progress(t);
      const overdue = !!t.due && new Date(t.due).getTime() < Date.now();
      return <Card key={t.id}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Feather name={t.kind === 'goal' ? 'target' : 'clipboard'} size={18} color={colors.primary} />
          <Text style={{ flex: 1, color: colors.foreground, fontWeight: '800', fontSize: 16 }}>{t.title}</Text>
          {isOwner ? <Pressable hitSlop={8} onPress={() => Alert.alert('Görev silinsin mi?', '', [{ text: 'Vazgeç', style: 'cancel' }, { text: 'Sil', style: 'destructive', onPress: () => deleteTask(gid, t.id).catch(() => Alert.alert('Silinemedi')) }])}><Feather name="trash-2" size={16} color={colors.mutedForeground} /></Pressable> : null}
        </View>
        {t.note ? <Text style={{ color: colors.mutedForeground, fontSize: 13, lineHeight: 19 }}>{t.note}</Text> : null}
        <Text style={{ color: overdue ? colors.destructive : colors.mutedForeground, fontSize: 12, fontWeight: '700' }}>{t.due ? `Son gün: ${dateText(t.due)}${overdue ? ' (süre geçti)' : ''}` : ''}{t.kind === 'goal' ? `  ·  Hedef: ${t.target_minutes} dk` : ''}</Text>
        {!isOwner && t.kind === 'goal' ? <>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.border }}><View style={{ height: 8, borderRadius: 4, width: `${Math.min(100, Math.round((got / Math.max(1, t.target_minutes)) * 100))}%`, backgroundColor: done[t.id] ? colors.success : colors.primary }} /></View>
          <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>{Math.min(got, t.target_minutes)} / {t.target_minutes} dk · odak sürenden otomatik hesaplanır</Text>
        </> : null}
        {!isOwner && t.kind === 'homework' ? <PrimaryButton label={done[t.id] ? 'Tamamlandı ✓ (geri al)' : 'Tamamladım'} icon={done[t.id] ? 'rotate-ccw' : 'check'} secondary={!!done[t.id]} disabled={busy} onPress={() => toggle(t)} /> : null}
        {!isOwner && t.kind === 'goal' && done[t.id] ? <Text style={{ color: colors.success, fontWeight: '800' }}>Hedefi tamamladın ✓</Text> : null}
        {isOwner ? <>
          <PrimaryButton label="Kimler tamamladı?" icon="users" secondary onPress={() => showDone(t)} />
          {names[t.id] ? <Text style={{ color: colors.foreground, fontSize: 13, lineHeight: 19 }}>{names[t.id].length ? names[t.id].join(', ') : 'Henüz kimse tamamlamadı.'}</Text> : null}
        </> : null}
      </Card>;
    })}
  </Screen>;
}
