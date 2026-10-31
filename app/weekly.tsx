import { Feather } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import { Alert, Linking, Text, View } from 'react-native';
import { Card, Header, PrimaryButton, Screen, styles } from '@/components/PlanimUI';
import { ReportSettings } from '@/components/ReportSettings';
import { usePlanim } from '@/context/PlanimContext';
import { useColors } from '@/hooks/useColors';
import { buildReportHtml, currentRange, ReportKind, reportFileName, studiedTopicStats } from '@/lib/report';
import { whatsappUrl } from '@/lib/whatsapp';

/** Dosyayı 17-23_eylul_haftalik_ozet.pdf gibi adlandırır. Başaramazsa özgün dosyayı döndürür. */
async function renameFile(uri: string, name: string) {
  try {
    const FS = require('expo-file-system/legacy');
    const target = `${FS.cacheDirectory}${name}`;
    await FS.deleteAsync(target, { idempotent: true });
    await FS.moveAsync({ from: uri, to: target });
    return target as string;
  } catch {
    return uri;
  }
}

export default function WeeklyScreen() {
  const colors = useColors();
  const { exams, topics, sessions, questionLogs, settings, updateSettings } = usePlanim();
  const [busy, setBusy] = useState<ReportKind | null>(null);
  const stats = studiedTopicStats(questionLogs, topics, currentRange('weekly'));
  const html = (kind: ReportKind) => buildReportHtml({ kind, studentName: settings.studentName, primary: colors.primary, sessions, exams, topics, logs: questionLogs });

  const preview = async (kind: ReportKind) => {
    try { await Print.printAsync({ html: html(kind) }); } catch { Alert.alert('Önizleme açılamadı', 'Tekrar dener misin?'); }
  };
  const send = async (kind: ReportKind, force = false) => {
    if (!settings.parentConsent && !force) {
      Alert.alert('Veliye gönderme izni kapalı', 'Raporu WhatsApp ile veliye göndermek için izin vermen gerekiyor. İzin verirsen gönderebilirsin; vermezsen sana haftalık hatırlatma gelir.', [{ text: 'Vazgeç', style: 'cancel' }, { text: 'İzin ver ve gönder', onPress: () => { updateSettings({ parentConsent: true }); send(kind, true); } }]);
      return;
    }
    setBusy(kind);
    try {
      const { start, end } = currentRange(kind);
      const file = await Print.printToFileAsync({ html: html(kind) });
      const uri = await renameFile(file.uri, reportFileName(kind, start, end));
      if (!(await Sharing.isAvailableAsync())) { Alert.alert('Paylaşım yok', 'Bu cihazda paylaşma desteklenmiyor.'); return; }
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Veliye gönder' });
    } catch {
      Alert.alert('PDF hazırlanamadı', 'Tekrar dener misin?');
    } finally {
      setBusy(null);
    }
  };
  const openParent = () => {
    if (!settings.parentPhone) return Alert.alert('Veli numarası yok', 'Aşağıdan velinin numarasını yaz.');
    Linking.openURL(whatsappUrl(settings.parentPhone)).catch(() => Alert.alert('WhatsApp açılamadı', 'Telefonda WhatsApp kurulu mu?'));
  };
  const block = (kind: ReportKind, title: string) => <Card>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><Feather name="file-text" size={19} color={colors.primary} /><Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text></View>
    <PrimaryButton label="İndirmeden önizle" onPress={() => preview(kind)} icon="eye" secondary />
    <PrimaryButton label={busy === kind ? 'Hazırlanıyor…' : 'Veliye gönder (PDF)'} onPress={() => send(kind)} icon="send" disabled={busy !== null} />
  </Card>;

  return <Screen>
    <Header eyebrow="Emeğine dışarıdan bak" title="Özetler" subtitle="Haftalık ve aylık özetini önce kendin gör, sonra velinle paylaş." />
    <Card>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Bu hafta çalıştığın konular</Text>
      {stats.length === 0 ? <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>Bu hafta henüz çalışılan konu girilmedi. Ders bitince çalıştığın konuları ve soru sayılarını yazabilirsin.</Text> : null}
      {stats.map((item) => <View key={item.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ flex: 1 }}><Text style={{ color: colors.foreground, fontWeight: '800', fontSize: 14 }}>{item.title}</Text><Text style={{ color: colors.mutedForeground, fontSize: 11 }}>{item.subject}</Text></View>
        {item.solved ? <Text style={{ fontSize: 12, fontWeight: '800' }}><Text style={{ color: colors.success }}>{item.correct} D</Text><Text style={{ color: colors.mutedForeground }}> · </Text><Text style={{ color: colors.destructive }}>{item.wrong} Y</Text><Text style={{ color: colors.mutedForeground }}> · {item.blank} B · {item.solved} soru</Text></Text> : <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>soru girilmedi</Text>}
      </View>)}
    </Card>
    {block('weekly', 'Bu haftanın özeti')}
    {block('monthly', 'Bu ayın özeti')}
    <Card>
      <Text style={{ color: colors.mutedForeground, fontSize: 12, lineHeight: 18 }}>PDF’i senin WhatsApp’ından sen göndermiş olursun: “Veliye gönder”e basınca paylaşım listesi açılır, WhatsApp’ı ve velinin sohbetini seç. Uygulama kendi başına hiçbir yere dosya göndermez.</Text>
      <PrimaryButton label="Velinin WhatsApp sohbetini aç" onPress={openParent} icon="message-circle" secondary />
    </Card>
    <Card><Text style={[styles.sectionTitle, { color: colors.foreground }]}>Rapor ayarları</Text><ReportSettings /></Card>
  </Screen>;
}
