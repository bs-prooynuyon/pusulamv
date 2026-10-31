import { router } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { Card, Field, Header, PrimaryButton, Screen, styles } from '@/components/PlanimUI';
import { WheelTime } from '@/components/WheelTime';
import { usePlanim } from '@/context/PlanimContext';
import { useColors } from '@/hooks/useColors';
import { aiErrorText, generateSchedule, hasAiKey, PlannedLesson } from '@/lib/ai';
import { examTotal, sortExams } from '@/lib/lgs';
import { PlanConflictModal } from '@/components/PlanConflictModal';
import { applyPlan, findPlanClashes } from '@/lib/schedule';
import { Lesson } from '@/types/planim';
import { WEEKDAYS } from '@/types/planim';

/** Yapay zeka ile ders programı: öner → onaylarsa programa ekle, ya da PDF çıktısı al. */
export default function AiScheduleScreen() {
  const colors = useColors();
  const { topics, exams, lessons, addLesson, removeLesson, settings } = usePlanim();
  const [clash, setClash] = useState<{ existing: Lesson[]; clashCount: number } | null>(null);
  const [days, setDays] = useState<number[]>([0, 1, 2, 3, 4]);
  const [from, setFrom] = useState('17:00');
  const [to, setTo] = useState('20:00');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [plan, setPlan] = useState<PlannedLesson[] | null>(null);

  const make = async () => {
    if (!(await hasAiKey())) return Alert.alert('Yapay zeka anahtarı yok', 'Ayarlar > Yapay zeka bölümüne Gemini anahtarını ekle.');
    if (!days.length) return Alert.alert('Gün seç', 'En az bir gün seçmelisin.');
    setBusy(true);
    try {
      const missing = topics.filter((t) => t.status === 'missing').slice(0, 40).map((t) => `${t.subject}: ${t.title}`).join('; ');
      const last = sortExams(exams)[0];
      const request = `Çalışabileceğim günler: ${days.map((d) => WEEKDAYS[d]).join(', ')} (gün numaraları ${days.join(',')}). Saat aralığı: ${from}-${to}. Hedef net: ${settings.targetNet || 'belirtilmedi'}. Son deneme neti: ${last ? examTotal(last.results).toFixed(1) : 'yok'}. Eksik konularım: ${missing || 'belirtilmedi'}. Ek isteğim: ${note || 'yok'}. Haftada bir kez Deneme dersi de koy.`;
      setPlan(await generateSchedule(request));
    } catch (e) { Alert.alert('Program hazırlanamadı', aiErrorText(e)); }
    finally { setBusy(false); }
  };

  const finish = (deleteIds: string[]) => {
    if (!plan) return;
    setClash(null);
    deleteIds.forEach((id) => removeLesson(id));
    const { added, skipped } = applyPlan(plan, lessons.filter((l) => !deleteIds.includes(l.id)), topics, addLesson);
    Alert.alert('Programa eklendi', `${added} ders programına eklendi.${skipped ? ` ${skipped} ders, saati mevcut bir dersle çakıştığı ya da geçersiz olduğu için eklenmedi.` : ''}`, [{ text: 'Programa git', onPress: () => router.replace('/schedule' as never) }]);
  };

  const apply = () => {
    if (!plan) return;
    const c = findPlanClashes(plan, lessons);
    if (c.existing.length) setClash(c); else finish([]);
  };

  const exportPdf = async () => {
    if (!plan) return;
    try {
      const rows = [...plan].sort((a, b) => a.day - b.day || a.startTime.localeCompare(b.startTime)).map((l) => `<tr><td>${WEEKDAYS[l.day]}</td><td>${l.startTime}–${l.endTime}</td><td>${l.name}</td><td>${l.topics.join(', ')}</td></tr>`).join('');
      const html = `<html><body style="font-family:sans-serif;padding:24px"><h2>Haftalık ders programı</h2><table border="1" cellpadding="8" style="border-collapse:collapse;width:100%"><tr><th>Gün</th><th>Saat</th><th>Ders</th><th>Konular</th></tr>${rows}</table></body></html>`;
      const file = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri, { mimeType: 'application/pdf', dialogTitle: 'Programı paylaş' });
    } catch { Alert.alert('Çıktı hazırlanamadı', 'Tekrar dener misin?'); }
  };

  return <Screen>
    <PlanConflictModal visible={!!clash} existing={clash?.existing ?? []} clashCount={clash?.clashCount ?? 0} onReplace={finish} onKeep={() => finish([])} onCancel={() => setClash(null)} />
    <Header eyebrow="Yapay zeka koçun" title="Program hazırla" subtitle="Müsait olduğun gün ve saatleri seç; eksik konularına göre program önersin." />
    <Card>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Çalışabileceğin günler</Text>
      <View style={{ flexDirection: 'row', gap: 6 }}>{WEEKDAYS.map((d, i) => { const on = days.includes(i); return <Pressable key={d} onPress={() => setDays((c) => on ? c.filter((x) => x !== i) : [...c, i])} style={{ flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, backgroundColor: on ? colors.primary : colors.secondary }}><Text style={{ color: on ? colors.primaryForeground : colors.secondaryForeground, fontSize: 11, fontWeight: '800' }}>{d}</Text></Pressable>; })}</View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}><WheelTime label="En erken" value={from} onChange={setFrom} /><WheelTime label="En geç" value={to} onChange={setTo} /></View>
      <Field label="Ek isteğin (isteğe bağlı)" value={note} onChangeText={setNote} placeholder="Örn. Matematiğe daha çok zaman ver" />
      <PrimaryButton label={busy ? 'Hazırlanıyor…' : 'Program öner'} onPress={make} icon="cpu" disabled={busy} />
      {busy ? <ActivityIndicator color={colors.primary} /> : null}
    </Card>
    {plan ? <Card tone="mint">
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Önerilen program</Text>
      {plan.length === 0 ? <Text style={{ color: colors.mutedForeground }}>Uygun bir program çıkmadı, tekrar dene.</Text> : null}
      {[...plan].sort((a, b) => a.day - b.day || a.startTime.localeCompare(b.startTime)).map((l, i) => <View key={i} style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}><Text style={{ width: 34, color: colors.primary, fontWeight: '800' }}>{WEEKDAYS[l.day]}</Text><Text style={{ width: 96, color: colors.mutedForeground, fontSize: 12 }}>{l.startTime}–{l.endTime}</Text><View style={{ flex: 1 }}><Text style={{ color: colors.foreground, fontWeight: '800' }}>{l.name}</Text>{l.topics.length ? <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>{l.topics.join(' · ')}</Text> : null}</View></View>)}
      <PrimaryButton label="Onaylıyorum, programa ekle" onPress={apply} icon="check" disabled={!plan.length} />
      <PrimaryButton label="Çıktı al (PDF)" onPress={exportPdf} icon="file-text" secondary disabled={!plan.length} />
    </Card> : null}
    <Pressable onPress={() => router.back()}><Text style={{ color: colors.primary, fontWeight: '700', textAlign: 'center' }}>Geri dön</Text></Pressable>
  </Screen>;
}
