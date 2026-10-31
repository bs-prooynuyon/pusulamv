import { SelectBox } from '@/components/SelectBox';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from 'react-native';
import { Card, Field, Header, PrimaryButton, Screen, styles } from '@/components/PlanimUI';
import { PlanList } from '@/components/PlanList';
import { WheelTime } from '@/components/WheelTime';
import { usePlanim } from '@/context/PlanimContext';
import { useColors } from '@/hooks/useColors';
import { aiErrorText, generateSchedule, hasAiKey } from '@/lib/ai';
import { PlanConflictModal } from '@/components/PlanConflictModal';
import { REPORT_REASONS } from '@/lib/chat';
import { myRequests, requestReport, RequestRow } from '@/lib/classes';
import { getUserId } from '@/lib/cloud';
import { deleteProgram, deleteThreadMessage, markProgramSaved, memberId, PlanLesson, ProgramRow, reportThreadMessage, sendProgram, sendThreadMessage, subscribePrograms, subscribeThread, ThreadMsg } from '@/lib/members';
import { applyPlan, findPlanClashes } from '@/lib/schedule';
import { Lesson } from '@/types/planim';
import { SUBJECTS, WEEKDAYS } from '@/types/planim';

const iso = (d: Date) => d.toISOString().slice(0, 10);
const LESSONS = [...SUBJECTS, 'Deneme'];

/**
 * Öğretmen ↔ öğrenci ekranı.
 * Öğretmen: öğrencinin onaylı raporu, rapor isteme, mesajlaşma, program hazırlayıp gönderme.
 * Öğrenci: öğretmenine mesaj, "ders programı iste", gelen programı kaydetme.
 */
export default function MemberScreen() {
  const colors = useColors();
  const { settings, topics, lessons, addLesson, removeLesson, exams, sessions } = usePlanim();
  const [clash, setClash] = useState<{ p: ProgramRow; existing: Lesson[]; clashCount: number } | null>(null);
  const { classId, studentId, name } = useLocalSearchParams<{ classId: string; studentId?: string; name?: string }>();
  const teacher = settings.role === 'teacher';
  const me = settings.studentName || (teacher ? 'Öğretmen' : 'Öğrenci');
  const [myId, setMyId] = useState('');
  const [thread, setThread] = useState<ThreadMsg[]>([]);
  const [programs, setPrograms] = useState<ProgramRow[]>([]);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  // Program hazırlama (öğretmen)
  const [compose, setCompose] = useState(false);
  const [rows, setRows] = useState<PlanLesson[]>([]);
  const [day, setDay] = useState(0);
  const [subject, setSubject] = useState<string>(SUBJECTS[1]);
  const [from, setFrom] = useState('17:00');
  const [to, setTo] = useState('18:00');
  const [title, setTitle] = useState('Haftalık ders programı');
  const [note, setNote] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [rangeFrom, setRangeFrom] = useState(iso(new Date(Date.now() - 13 * 86400000)));
  const [rangeTo, setRangeTo] = useState(iso(new Date()));

  const sid = teacher ? (studentId ?? '') : myId;
  const mid = sid ? memberId(classId, sid) : '';

  useEffect(() => { getUserId().then(setMyId).catch(() => undefined); }, []);
  const loadRequests = useCallback(async () => { try { setRequests((await myRequests()).filter((r) => r.class_id === classId && (!teacher || r.student_id === studentId))); } catch { /* çevrimdışı */ } }, [classId, studentId, teacher]);
  useEffect(() => { loadRequests(); }, [loadRequests]);
  useEffect(() => {
    if (!mid) return;
    const a = subscribeThread(mid, setThread, () => undefined);
    const b = subscribePrograms(mid, setPrograms, () => undefined);
    return () => { a(); b(); };
  }, [mid]);

  const run = async (fn: () => Promise<unknown>, ok?: string) => { setBusy(true); try { await fn(); if (ok) Alert.alert(ok); } catch (e) { Alert.alert('Olmadı', e instanceof Error ? e.message : 'Tekrar dener misin?'); } finally { setBusy(false); } };
  const send = (body: string, kind: 'text' | 'program-request' = 'text') => run(async () => { await sendThreadMessage(mid, myId, me, body, kind); if (kind === 'text') setText(''); });

  const menu = (m: ThreadMsg) => {
    const buttons: { text: string; style?: 'default' | 'cancel' | 'destructive'; onPress?: () => void }[] = [];
    if (m.sender_id !== myId) buttons.push({ text: 'Şikayet et', onPress: () => Alert.alert('Neden şikayet ediyorsun?', 'Şikayet uygulama yöneticisine iletilir.', [...REPORT_REASONS.map((reason) => ({ text: reason, onPress: () => reportThreadMessage(m, myId, reason, teacher ? 'Öğretmen-öğrenci yazışması' : 'Öğrenci-öğretmen yazışması').then(() => Alert.alert('Şikayetin iletildi', 'Teşekkürler, inceleyeceğiz.')).catch(() => Alert.alert('Gönderilemedi', 'Tekrar dener misin?')) })), { text: 'Vazgeç', style: 'cancel' as const }]) });
    if (m.sender_id === myId || teacher) buttons.push({ text: 'Mesajı sil', style: 'destructive', onPress: () => deleteThreadMessage(mid, m.id).catch(() => Alert.alert('Silinemedi')) });
    buttons.push({ text: 'Vazgeç', style: 'cancel' });
    Alert.alert('Mesaj', m.body.length > 80 ? `${m.body.slice(0, 80)}…` : m.body, buttons);
  };

  // ----- Öğretmen: rapor -----
  const approved = requests.filter((r) => r.status === 'approved' && r.report)[0];
  const waiting = requests.find((r) => r.status === 'pending');
  const askReport = (days: number) => run(() => requestReport(classId, studentId ?? '', iso(new Date(Date.now() - (days - 1) * 86400000)), iso(new Date())).then(loadRequests), 'İstek gönderildi. Öğrenci onaylarsa rapor burada görünür.');

  // ----- Öğretmen: program -----
  const addRow = () => { if (from >= to) return Alert.alert('Saat hatalı', 'Bitiş saati başlangıçtan sonra olmalı.'); setRows((r) => [...r, { day, name: subject, startTime: from, endTime: to, topics: [] }]); };
  const aiDraft = async () => {
    if (!(await hasAiKey())) return Alert.alert('Yapay zeka anahtarı yok', 'Ayarlar > Yapay zeka bölümüne Gemini anahtarını ekle.');
    setAiBusy(true);
    try {
      const r = approved?.report;
      const ctx = r ? `Öğrencinin son raporu: ${r.focusMinutes} dk odak, ${r.examCount} deneme (ort. ${r.avgNet.toFixed(1)} net), ${r.solved} soru (${r.correct} doğru, ${r.wrong} yanlış).` : 'Öğrencinin raporu yok.';
      const request = `Çalışabileceği günler: ${WEEKDAYS.join(', ')} (0=Pzt…6=Paz). Saat aralığı 16:00-21:00. ${ctx} Öğretmenin isteği: ${note || 'dengeli bir hafta'}. Haftada bir kez Deneme dersi de koy.`;
      setRows(await generateSchedule(request));
    } catch (e) { Alert.alert('Taslak hazırlanamadı', aiErrorText(e)); } finally { setAiBusy(false); }
  };
  const sendPlan = () => run(async () => {
    if (!rows.length) throw new Error('Önce programa en az bir ders ekle.');
    await sendProgram(mid, myId, studentId ?? '', title.trim() || 'Haftalık ders programı', note.trim(), rows);
    await sendThreadMessage(mid, myId, me, `📅 Sana bir ders programı gönderdim: ${title.trim() || 'Haftalık ders programı'}`);
    setRows([]); setCompose(false);
  }, 'Program öğrenciye gönderildi');

  // ----- Öğrenci: gelen program -----
  const saveProgram = (p: ProgramRow, deleteIds: string[]) => run(async () => { setClash(null); deleteIds.forEach((id) => removeLesson(id)); const { added, skipped } = applyPlan(p.lessons, lessons.filter((l) => !deleteIds.includes(l.id)), topics, addLesson); await markProgramSaved(mid, p.id); Alert.alert('Programına kaydedildi', `${added} ders programına eklendi.${skipped ? ` ${skipped} ders, saati mevcut bir dersle çakıştığı ya da geçersiz olduğu için eklenmedi.` : ''}`, [{ text: 'Programa git', onPress: () => router.replace('/schedule' as never) }, { text: 'Tamam' }]); });
  const save = (p: ProgramRow) => { const c = findPlanClashes(p.lessons, lessons); if (c.existing.length) setClash({ p, ...c }); else saveProgram(p, []); };

  const myStats = () => `Son 7 günde ${sessions.filter((s) => s.date.slice(0, 10) >= iso(new Date(Date.now() - 6 * 86400000))).reduce((a, s) => a + s.durationMinutes, 0)} dk odak, ${exams.length} deneme kaydım var.`;
  const who = teacher ? (name || 'Öğrenci') : 'Öğretmenin';

  return <Screen>
    <PlanConflictModal visible={!!clash} existing={clash?.existing ?? []} clashCount={clash?.clashCount ?? 0} onReplace={(ids) => clash && saveProgram(clash.p, ids)} onKeep={() => clash && saveProgram(clash.p, [])} onCancel={() => setClash(null)} />
    <Header eyebrow={teacher ? 'Öğrenci' : 'Öğretmen'} title={who} subtitle={teacher ? 'Durumunu gör, mesaj yaz, ders programı hazırlayıp gönder.' : 'Mesaj yaz, ders programı iste, gelen programı kaydet.'} />

    {teacher ? <Card tone="lavender">
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Çalışma durumu</Text>
      {approved?.report ? <>
        <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>{approved.from_date} – {approved.to_date} arası (öğrencinin onayladığı rapor)</Text>
        <Text style={{ color: colors.foreground, lineHeight: 21 }}>Odak: {approved.report.focusMinutes} dk{'\n'}Deneme: {approved.report.examCount} (ort. {approved.report.avgNet.toFixed(1)} net){'\n'}Çözülen soru: {approved.report.solved} ({approved.report.correct} doğru, {approved.report.wrong} yanlış)</Text>
      </> : <Text style={{ color: colors.mutedForeground, fontSize: 13, lineHeight: 19 }}>Öğrenci onaylamadan çalışma durumu görünmez. Aşağıdan rapor isteyebilirsin.</Text>}
      {waiting ? <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: '700' }}>Onay bekliyor… ({waiting.from_date} – {waiting.to_date})</Text> : null}
      {requests[0]?.status === 'declined' && !waiting ? <Text style={{ color: colors.destructive, fontSize: 12, fontWeight: '700' }}>Öğrenci son isteği reddetti.</Text> : null}
      <PrimaryButton label="Haftalık rapor iste" icon="send" secondary disabled={busy} onPress={() => askReport(7)} />
      <PrimaryButton label="Aylık rapor iste" icon="send" secondary disabled={busy} onPress={() => askReport(30)} />
      <Field label="Özel aralık: başlangıç (YYYY-AA-GG)" value={rangeFrom} onChangeText={setRangeFrom} />
      <Field label="Özel aralık: bitiş (YYYY-AA-GG)" value={rangeTo} onChangeText={setRangeTo} />
      <PrimaryButton label="Bu tarihler için rapor iste" icon="calendar" secondary disabled={busy} onPress={() => { const ok = /^\d{4}-\d{2}-\d{2}$/; if (!ok.test(rangeFrom.trim()) || !ok.test(rangeTo.trim()) || rangeFrom.trim() > rangeTo.trim()) return Alert.alert('Tarih hatalı', 'Tarihleri YYYY-AA-GG yaz (örn. 2026-10-01); başlangıç bitişten önce olmalı.'); run(() => requestReport(classId, studentId ?? '', rangeFrom.trim(), rangeTo.trim()).then(loadRequests), 'İstek gönderildi. Öğrenci onaylarsa rapor burada görünür.'); }} />
    </Card> : null}

    <Card>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Mesajlar</Text>
      {thread.length === 0 ? <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>Henüz mesaj yok.</Text> : null}
      {thread.map((m) => { const mine = m.sender_id === myId; return <Pressable key={m.id} onLongPress={() => menu(m)} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '84%', paddingVertical: 9, paddingHorizontal: 13, borderRadius: 18, backgroundColor: mine ? colors.primary : colors.muted }}>
        {!mine ? <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '800', marginBottom: 2 }}>{m.sender_name}</Text> : null}
        <Text style={{ color: mine ? colors.primaryForeground : colors.foreground, fontSize: 14, lineHeight: 20 }}>{m.body}</Text>
        <Text style={{ color: mine ? colors.primaryForeground : colors.mutedForeground, opacity: 0.7, fontSize: 10, marginTop: 3, textAlign: 'right' }}>{new Date(m.created_at).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text>
      </Pressable>; })}
      <TextInput value={text} onChangeText={setText} placeholder="Mesaj yaz" placeholderTextColor={colors.mutedForeground} multiline maxLength={1000} style={{ minHeight: 44, maxHeight: 110, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, color: colors.foreground, fontSize: 15 }} />
      <PrimaryButton label="Gönder" icon="send" disabled={busy || !text.trim() || !myId} onPress={() => send(text.trim())} />
      {!teacher ? <PrimaryButton label="Ders programı iste" icon="calendar" secondary disabled={busy || !myId} onPress={() => send(`Hocam, bana bir ders programı hazırlayabilir misiniz? ${myStats()}`, 'program-request')} /> : null}
      <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Mesaj için basılı tut: şikayet et ya da sil.</Text>
    </Card>

    {programs.map((p) => <Card key={p.id} tone="mint">
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{p.title}</Text>
      <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>{new Date(p.created_at).toLocaleDateString('tr-TR')}{p.note ? ` · ${p.note}` : ''}{p.saved ? ' · öğrenci kaydetti' : ''}</Text>
      <PlanList lessons={p.lessons} />
      {!teacher ? <PrimaryButton label={p.saved ? 'Tekrar programıma ekle' : 'Programıma kaydet'} icon="check" disabled={busy} onPress={() => save(p)} /> : null}
      <Pressable onPress={() => Alert.alert('Program silinsin mi?', undefined, [{ text: 'Vazgeç', style: 'cancel' }, { text: 'Sil', style: 'destructive', onPress: () => deleteProgram(mid, p.id).catch(() => Alert.alert('Silinemedi')) }])}><Text style={{ color: colors.destructive, fontSize: 12, fontWeight: '800' }}>Sil</Text></Pressable>
    </Card>)}

    {teacher ? (compose ? <Card>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Program hazırla</Text>
      <Field label="Başlık" value={title} onChangeText={setTitle} />
      <Field label="Not / yapay zekaya isteğin (isteğe bağlı)" value={note} onChangeText={setNote} placeholder="Örn. Matematiğe ağırlık ver" />
      <PrimaryButton label={aiBusy ? 'Hazırlanıyor…' : 'Yapay zeka taslağı oluştur'} icon="cpu" secondary disabled={aiBusy} onPress={aiDraft} />
      {aiBusy ? <ActivityIndicator color={colors.primary} /> : null}
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Elle ders ekle</Text>
      <SelectBox label="Gün" placeholder="Gün seçiniz..." value={['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'][day] ?? ''} options={['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar']} onSelect={(v) => setDay(['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'].indexOf(v))} />
      <SelectBox label="Ders" placeholder="Ders seçiniz..." value={subject} options={[...LESSONS]} onSelect={(v) => setSubject(v as typeof subject)} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}><WheelTime label="Başlangıç" value={from} onChange={setFrom} /><WheelTime label="Bitiş" value={to} onChange={setTo} /></View>
      <PrimaryButton label="Programa ekle" icon="plus" secondary onPress={addRow} />
      {rows.length ? <>
        <PlanList lessons={rows} />
        <Pressable onPress={() => setRows([])}><Text style={{ color: colors.destructive, fontSize: 12, fontWeight: '800' }}>Satırları temizle</Text></Pressable>
      </> : <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Henüz ders eklenmedi.</Text>}
      <PrimaryButton label="Öğrenciye gönder" icon="send" disabled={busy || !rows.length} onPress={sendPlan} />
      <Pressable onPress={() => setCompose(false)}><Text style={{ color: colors.primary, fontWeight: '700', textAlign: 'center' }}>Vazgeç</Text></Pressable>
    </Card> : <PrimaryButton label="Ders programı hazırla ve gönder" icon="calendar" onPress={() => setCompose(true)} />) : null}

    <Pressable onPress={() => router.back()}><Text style={{ color: colors.primary, fontWeight: '700', textAlign: 'center' }}>Geri dön</Text></Pressable>
  </Screen>;
}
