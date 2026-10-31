import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Card, Field, Header, PrimaryButton, Screen, styles } from '@/components/PlanimUI';
import { usePlanim } from '@/context/PlanimContext';
import { QUESTION_COUNTS, SUBJECTS, Subject } from '@/types/planim';
import { useColors } from '@/hooks/useColors';
import { showInterstitialIfDue } from '@/lib/ads';
import { keepFile } from '@/lib/files';
import { aiErrorText, analyzeExamPdf, hasAiKey } from '@/lib/ai';
import { ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NetChart } from '@/components/NetChart';
import { examTotal, fmtNet, sayisalNet, sortExams, sozelNet } from '@/lib/lgs';

export default function ExamsScreen() {
  const colors = useColors();
  const { exams, settings, addExam } = usePlanim();
  const [pdfUri, setPdfUri] = useState<string | undefined>();
  const [analysis, setAnalysis] = useState<string | undefined>();
  const [weak, setWeak] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState(false);
  const [mode, setMode] = useState<'weekly' | 'monthly'>('weekly');
  const [examDate, setExamDate] = useState(new Date().toISOString().slice(0, 10));
  const sorted = useMemo(() => sortExams(exams), [exams]);
  const todayKey = new Date().toISOString().slice(0, 10);
  const monthKey = todayKey.slice(0, 7);
  // Haftalık: son 5 hafta, Aylık: son 6 ay. Her nokta bir deneme.
  const since = new Date(Date.now() - (mode === 'weekly' ? 35 : 183) * 86400000).toISOString().slice(0, 10);
  const inRange = sorted.filter((e) => e.date >= since && e.date <= todayKey).reverse().slice(-8);
  const labels = inRange.map((e) => new Date(`${e.date}T00:00:00`).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }));
  const series = [{ name: 'Sözel', color: '#5aa9ff', values: inRange.map((e) => sozelNet(e.results)) }, { name: 'Sayısal', color: '#f0a24b', values: inRange.map((e) => sayisalNet(e.results)) }];
  const monthExams = sorted.filter((e) => e.date.startsWith(monthKey));
  const best = monthExams.reduce<typeof sorted[number] | null>((b, e) => !b || examTotal(e.results) > examTotal(b.results) ? e : b, null);
  const [title, setTitle] = useState('Deneme sınavı');
  const [correct, setCorrect] = useState<Record<Subject, string>>({ Türkçe: '0', Matematik: '0', 'Fen Bilimleri': '0', İnkılap: '0', 'Din Kültürü': '0', İngilizce: '0' });
  const [wrong, setWrong] = useState<Record<Subject, string>>({ Türkçe: '0', Matematik: '0', 'Fen Bilimleri': '0', İnkılap: '0', 'Din Kültürü': '0', İngilizce: '0' });
  /** PDF seç → kalıcı kopya → yapay zekaya okut → formu doldur. */
  const pickPdf = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
      const asset = result.canceled ? null : result.assets[0];
      if (!asset) return;
      if (asset.size && asset.size > 20 * 1024 * 1024) return Alert.alert('PDF çok büyük', 'En fazla 20 MB’lık bir PDF analiz edilebilir.');
      const uri = await keepFile(asset.uri, 'pdf');
      setPdfUri(uri); setAdding(true); setTitle(asset.name.replace(/\.pdf$/i, '')); setAnalysis(undefined); setWeak([]);
      if (!(await hasAiKey())) { Alert.alert('PDF eklendi', 'Netleri yapay zekayla okutmak için Ayarlar > Yapay zeka bölümüne Gemini anahtarını ekle. Şimdilik netleri elle girebilirsin; PDF denemeyle birlikte saklanır.'); return; }
      setBusy(true);
      try {
        const FS = require('expo-file-system/legacy');
        const base64 = await FS.readAsStringAsync(uri, { encoding: 'base64' });
        const found = await analyzeExamPdf(base64);
        if (found.title) setTitle(found.title);
        const nextC: Record<string, string> = {}; const nextW: Record<string, string> = {};
        found.results.forEach((r) => { if (SUBJECTS.includes(r.subject)) { nextC[r.subject] = String(r.correct); nextW[r.subject] = String(r.wrong); } });
        setCorrect((cur) => ({ ...cur, ...nextC } as Record<Subject, string>)); setWrong((cur) => ({ ...cur, ...nextW } as Record<Subject, string>));
        setAnalysis(found.summary); setWeak(found.weakTopics ?? []);
        Alert.alert(found.results.length ? 'Netler okundu' : 'Net bulunamadı', found.results.length ? 'Sayıları kontrol edip denemeyi kaydet.' : 'PDF’te sonuç yok gibi görünüyor; netleri elle girebilirsin. Yine de yapay zekaya soru sorabilirsin.');
      } catch (error) { Alert.alert('PDF analiz edilemedi', aiErrorText(error)); }
      finally { setBusy(false); }
    } catch (error) { Alert.alert('PDF eklenemedi', `Tekrar dener misin?\n\nHata: ${error instanceof Error ? error.message : String(error)}`); }
  };
  const save = () => { addExam({ pdfUri, analysis, weakTopics: weak.length ? weak : undefined, title, date: /^\d{4}-\d{2}-\d{2}$/.test(examDate.trim()) ? examDate.trim() : new Date().toISOString().slice(0, 10), results: SUBJECTS.map((subject) => { const c = Number(correct[subject]) || 0; const w = Number(wrong[subject]) || 0; return { subject, correct: c, wrong: w, net: c - w / settings.netDivisor }; }) }); setAdding(false); setPdfUri(undefined); setAnalysis(undefined); setWeak([]); showInterstitialIfDue(); };
  return <Screen><Header eyebrow="Denemeler" title="Deneme sonuçları" subtitle="Her deneme, nerede olduğunu ve nereye gittiğini gösterir." />
    {best ? <LinearGradient colors={['#17335c', '#102542']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 22, borderWidth: 1, borderColor: '#2f5a96', padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
      <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: '#f0c24b', alignItems: 'center', justifyContent: 'center' }}><Feather name="award" size={26} color="#3a2a00" /></View>
      <View style={{ flex: 1 }}><Text style={{ color: '#f0c24b', fontSize: 11, fontWeight: '800', letterSpacing: 1.2 }}>BU AYIN EN İYİ DENEMESİ</Text><Text numberOfLines={1} style={{ color: '#fff', fontSize: 17, fontWeight: '800', marginTop: 4 }}>{best.title}</Text></View>
      <View style={{ alignItems: 'flex-end' }}><Text style={{ color: '#fff', fontSize: 28, fontWeight: '800', lineHeight: 30 }}>{fmtNet(examTotal(best.results))}</Text><Text style={{ color: '#b4c8e6', fontSize: 11, marginTop: 2 }}>net</Text></View>
    </LinearGradient> : null}
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{mode === 'weekly' ? 'Haftalık' : 'Aylık'} net grafiği</Text>
        <View style={{ flexDirection: 'row', backgroundColor: colors.muted, borderRadius: 12, padding: 3 }}>
          {([['weekly', 'Haftalık'], ['monthly', 'Aylık']] as const).map(([key, label]) => <Pressable key={key} onPress={() => setMode(key)} style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10, backgroundColor: mode === key ? colors.primary : 'transparent' }}><Text style={{ fontSize: 12, fontWeight: '800', color: mode === key ? colors.primaryForeground : colors.mutedForeground }}>{label}</Text></Pressable>)}
        </View>
      </View>
      <NetChart labels={labels} series={series} />
    </Card>
    <View style={{ flexDirection: 'row', gap: 10 }}>
      <View style={{ flex: 1 }}><PrimaryButton label="Yeni deneme" onPress={() => setAdding((value) => !value)} /></View>
      <View style={{ flex: 1 }}><PrimaryButton label={busy ? 'Analiz ediliyor…' : 'PDF’ten ekle'} onPress={pickPdf} secondary disabled={busy} /></View>
    </View>
    {busy ? <ActivityIndicator color={colors.primary} /> : null}
    {adding ? <Card tone="pink"><Text style={[styles.sectionTitle, { color: colors.foreground }]}>Yeni deneme</Text><Field label="Deneme adı" value={title} onChangeText={setTitle} /><Field label="Deneme tarihi (YYYY-AA-GG)" value={examDate} onChangeText={setExamDate} placeholder="2026-10-23" />{pdfUri ? <Text style={{ color: colors.success, fontSize: 12, fontWeight: '700' }}>PDF eklendi</Text> : null}{analysis ? <Text style={{ color: colors.foreground, fontSize: 13, lineHeight: 19 }}>{analysis}</Text> : null}{weak.length ? <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Zayıf konular: {weak.join(', ')}</Text> : null}<Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Doğru / yanlış sayılarını gir</Text><View style={{ gap: 8 }}>{SUBJECTS.map((subject) => <View key={subject} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Text style={{ color: colors.foreground, fontSize: 13, flex: 1 }}>{subject} <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>/{QUESTION_COUNTS[subject]}</Text></Text><View style={{ width: 62 }}><Field label="" value={correct[subject]} onChangeText={(value) => setCorrect((current) => ({ ...current, [subject]: value }))} keyboardType="numeric" /></View><Text style={{ color: colors.mutedForeground }}>·</Text><View style={{ width: 62 }}><Field label="" value={wrong[subject]} onChangeText={(value) => setWrong((current) => ({ ...current, [subject]: value }))} keyboardType="numeric" /></View></View>)}</View><Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Net = doğru − (yanlış ÷ {settings.netDivisor})</Text><PrimaryButton label="Denemeyi kaydet" onPress={save} icon="check" /></Card> : null}
    {sorted.length ? <Card style={{ paddingVertical: 4, gap: 0 }}>
      {sorted.map((exam, i) => <Pressable key={exam.id} onPress={() => router.push(`/exam-detail?id=${exam.id}` as never)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.border }}>
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={{ color: colors.foreground, fontSize: 15, fontWeight: '800' }}>{exam.title}</Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 3 }}>{new Date(`${exam.date}T00:00:00`).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} · Sözel {fmtNet(sozelNet(exam.results))} · Sayısal {fmtNet(sayisalNet(exam.results))}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}><Text style={{ color: colors.foreground, fontSize: 20, fontWeight: '800' }}>{fmtNet(examTotal(exam.results))}</Text><Text style={{ color: colors.mutedForeground, fontSize: 11 }}>toplam net</Text></View>
        <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
      </Pressable>)}
    </Card> : <Text style={{ color: colors.mutedForeground, fontSize: 13, textAlign: 'center' }}>Henüz deneme yok. “Yeni deneme” ile ilkini ekle.</Text>}
    <Pressable onPress={() => router.back()}><Text style={{ color: colors.primary, fontWeight: '700', textAlign: 'center', marginTop: 2 }}>Geri dön</Text></Pressable>
  </Screen>;
}