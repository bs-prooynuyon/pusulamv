import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { Card, PrimaryButton, Screen, styles } from '@/components/PlanimUI';
import { usePlanim } from '@/context/PlanimContext';
import { useColors } from '@/hooks/useColors';
import { estimateScore, examTotal, fmtNet, sayisalNet, sozelNet } from '@/lib/lgs';
import { QUESTION_COUNTS } from '@/types/planim';

/** Deneme detayı: toplam net, ders ders sonuç, zayıf konular. */
export default function ExamDetailScreen() {
  const colors = useColors();
  const { exams } = usePlanim();
  const { id } = useLocalSearchParams<{ id: string }>();
  const exam = exams.find((e) => e.id === id);
  const back = <Pressable onPress={() => router.back()} hitSlop={10} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44 }}><Feather name="chevron-left" size={20} color={colors.mutedForeground} /><Text style={{ color: colors.mutedForeground, fontSize: 15, fontWeight: '700' }}>Deneme sonuçları</Text></Pressable>;
  if (!exam) return <Screen>{back}<Text style={{ color: colors.foreground }}>Bu deneme bulunamadı.</Text></Screen>;
  const openPdf = async (uri: string) => {
    try { if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'PDF’i aç' }); } catch { Alert.alert('PDF açılamadı', 'Telefonda bir PDF okuyucu uygulaması var mı?'); }
  };
  return <Screen>
    {back}
    <View>
      <Text style={{ color: colors.foreground, fontSize: 30, fontWeight: '800', lineHeight: 34 }}>{exam.title}</Text>
      <Text style={{ color: colors.mutedForeground, fontSize: 14, marginTop: 6 }}>{new Date(`${exam.date}T00:00:00`).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })} · tahmini {estimateScore(exam.results)} puan</Text>
    </View>
    <LinearGradient colors={['#17335c', '#102542']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 22, borderWidth: 1, borderColor: '#2f5a96', padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <View><Text style={{ color: '#b4c8e6', fontSize: 11, fontWeight: '800', letterSpacing: 1.2 }}>TOPLAM NET</Text><Text style={{ color: '#fff', fontSize: 44, fontWeight: '800', lineHeight: 50, marginTop: 4 }}>{fmtNet(examTotal(exam.results))}</Text></View>
      <View style={{ gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#5aa9ff' }} /><Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>Sözel {fmtNet(sozelNet(exam.results))}</Text></View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#f0a24b' }} /><Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>Sayısal {fmtNet(sayisalNet(exam.results))}</Text></View>
      </View>
    </LinearGradient>
    <Card style={{ paddingVertical: 6, gap: 0 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 12, paddingBottom: 6 }}>
        <Text style={{ flex: 1, color: colors.mutedForeground, fontSize: 12, fontWeight: '800', letterSpacing: 1 }}>DERS</Text>
        <Text style={{ width: 46, textAlign: 'center', color: colors.mutedForeground, fontSize: 12, fontWeight: '800', letterSpacing: 1 }}>DOĞRU</Text>
        <Text style={{ width: 46, textAlign: 'center', color: colors.mutedForeground, fontSize: 12, fontWeight: '800', letterSpacing: 1 }}>YANLIŞ</Text>
        <Text style={{ width: 56, textAlign: 'right', color: colors.mutedForeground, fontSize: 12, fontWeight: '800', letterSpacing: 1 }}>NET</Text>
      </View>
      {exam.results.map((r, i) => <View key={r.subject} style={{ paddingVertical: 12, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.border }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ flex: 1, color: colors.foreground, fontSize: 15, fontWeight: '800' }}>{r.subject}</Text>
          <Text style={{ width: 46, textAlign: 'center', color: '#3ddc97', fontSize: 14, fontWeight: '700' }}>{r.correct}</Text>
          <Text style={{ width: 46, textAlign: 'center', color: '#ff7a7a', fontSize: 14, fontWeight: '700' }}>{r.wrong}</Text>
          <Text style={{ width: 56, textAlign: 'right', color: colors.foreground, fontSize: 16, fontWeight: '800' }}>{fmtNet(r.net)}</Text>
        </View>
        <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.border, marginTop: 8 }}><View style={{ height: 6, borderRadius: 3, backgroundColor: '#5aa9ff', width: `${Math.max(0, Math.min(100, (r.net / QUESTION_COUNTS[r.subject]) * 100))}%` }} /></View>
      </View>)}
    </Card>
    {exam.analysis ? <Card><Text style={[styles.sectionTitle, { color: colors.foreground }]}>Yapay zeka özeti</Text><Text style={{ color: colors.mutedForeground, fontSize: 13, lineHeight: 19 }}>{exam.analysis}</Text></Card> : null}
    {exam.weakTopics?.length ? <>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>Yanlış yaptığın konular</Text><Text style={{ color: colors.mutedForeground, fontSize: 13, fontWeight: '700' }}>{exam.weakTopics.length} konu</Text></View>
      <Card style={{ paddingVertical: 6, gap: 0 }}>{exam.weakTopics.map((t, i) => <View key={`${t}-${i}`} style={{ paddingVertical: 12, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.border }}><Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '600' }}>{t}</Text></View>)}</Card>
    </> : null}
    <View style={{ flexDirection: 'row', gap: 10 }}>
      <View style={{ flex: 1 }}><PrimaryButton label="Yanlış sorulara ekle" onPress={() => router.push('/wrongs' as never)} /></View>
      <View style={{ flex: 1 }}><PrimaryButton label="Yapay zekaya sor" onPress={() => router.push(`/exam-ai?id=${exam.id}` as never)} secondary /></View>
    </View>
    {exam.pdfUri ? <PrimaryButton label="PDF’i aç" onPress={() => openPdf(exam.pdfUri!)} icon="file-text" secondary /> : null}
  </Screen>;
}
