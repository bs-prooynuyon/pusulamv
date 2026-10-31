import { router } from 'expo-router';
import React, { useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { Alert, Pressable, Switch, Text, View } from 'react-native';
import { Field, NavRow, Screen, Section, styles } from '@/components/PlanimUI';
import { PermissionsCard } from '@/components/PermissionsCard';
import { ThemePicker } from '@/components/ThemePicker';
import { AlarmSoundPicker } from '@/components/AlarmSoundPicker';
import { AccountCard } from '@/components/AccountCard';
import { AiKeyCard } from '@/components/AiKeyCard';
import { NavEditor } from '@/components/NavEditor';
import { LgsYearPicker } from '@/components/LgsYearPicker';
import { GradePicker } from '@/components/GradePicker';
import { SchoolPicker, SchoolValue } from '@/components/SchoolPicker';
import { lgsDateForYear } from '@/lib/lgs';
import { deleteAccountOnServer } from '@/lib/cloud';
import { PlanimLock } from '@/modules/planim-lock';
import { openLegal } from '@/lib/legal';
import { usePlanim } from '@/context/PlanimContext';
import { useColors } from '@/hooks/useColors';

export default function SettingsScreen() {
  const colors = useColors();
  const { settings, updateSettings, resetAll } = usePlanim();
  const teacher = settings.role === 'teacher';
  const [name, setName] = useState(settings.studentName);
  const [year, setYear] = useState(settings.examYear);
  const [grade, setGrade] = useState(settings.studentGrade ?? '');
  const [target, setTarget] = useState<SchoolValue>({ city: settings.targetCity, district: settings.targetDistrict, school: settings.targetSchool });
  const [work, setWork] = useState<SchoolValue>({ city: settings.schoolCity, district: settings.schoolDistrict, school: settings.schoolName });
  const [targetNet, setTargetNet] = useState(String(settings.targetNet));
  const [divisor, setDivisor] = useState(String(settings.netDivisor));
  const save = () => { const info = year ? lgsDateForYear(year) : null; updateSettings({ studentName: name, studentGrade: grade, ...(info ? { examYear: year, examDate: info.date, examDateEstimated: info.estimated } : {}), schoolCity: work.city, schoolDistrict: work.district.trim(), schoolName: work.school.trim(), targetCity: target.city, targetDistrict: target.district, targetSchool: target.school, targetNet: Number(targetNet) || 0, netDivisor: Number(divisor) || 3 }); Alert.alert('Kaydedildi', 'Hedeflerin güncellendi.'); };
  const deleteAccount = () => Alert.alert('Hesabın kalıcı olarak silinsin mi?', 'Hesabın ve sunucudaki tüm bilgilerin, sohbet mesajların dahil, silinir. Bu telefondaki veriler de silinir. Geri alınamaz.', [{ text: 'Vazgeç', style: 'cancel' }, { text: 'Hesabımı sil', style: 'destructive', onPress: async () => { try { if (settings.signedIn) await deleteAccountOnServer(); PlanimLock.stopLock(); resetAll(); } catch (e) { Alert.alert('Silinemedi', e instanceof Error && /giriş yap/.test(e.message) ? e.message : 'İnternetini kontrol edip tekrar dener misin? Silinemezse Şikayet / öneri bölümünden bize yaz.'); } } }]);
  const wipe = () => Alert.alert('Tüm veriler silinsin mi?', 'Ders programın, denemelerin, hedeflerin ve ayarların bu cihazdan silinir. Geri alınamaz.', [{ text: 'Vazgeç', style: 'cancel' }, { text: 'Sil', style: 'destructive', onPress: () => { PlanimLock.stopLock(); PlanimLock.getUsage(true); resetAll(); } }]);
  const dark = settings.theme === 'dark' || (settings.theme === 'system' && colors.isDark);
  return <Screen>
    <Pressable onPress={() => router.back()} hitSlop={10} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44 }}><Feather name="chevron-left" size={20} color={colors.mutedForeground} /><Text style={{ color: colors.mutedForeground, fontSize: 15, fontWeight: '700' }}>Geri dön</Text></Pressable>
    <View><Text style={[styles.title, { color: colors.foreground, fontSize: 32 }]}>Ayarlar</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Hedeflerini ve uygulama deneyimini güncel tut.</Text></View>
    <AccountCard />
    {!teacher ? <NavEditor /> : null}
    <AiKeyCard />
    <Section title="Bilgilerin">
      <Field label="Adın" value={name} onChangeText={setName} placeholder="Adın" />
      {!teacher ? <GradePicker value={grade} onChange={setGrade} /> : null}
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{teacher ? 'Çalıştığın okul' : 'Şu an okuduğun okul'}</Text>
      <SchoolPicker value={work} onChange={setWork} schoolLabel="Okul" level={teacher ? 'hepsi' : 'ortaokul'} />
    </Section>
    {!teacher ? <Section title="LGS hedefin">
      <SchoolPicker value={target} onChange={setTarget} schoolLabel="Hedef lise" level="lise" />
      <Field label="Hedef net" value={targetNet} onChangeText={setTargetNet} keyboardType="numeric" />
      <LgsYearPicker year={year} onChange={(y) => setYear(y)} />
    </Section> : null}
    {!teacher ? <Section title="Deneme hesaplama">
      <Text style={{ color: colors.mutedForeground, fontSize: 13, lineHeight: 19 }}>Net = doğru − (yanlış ÷ katsayı). Sınav kuralı değişirse buradan güncelleyebilirsin.</Text>
      <Field label="Kaç yanlış bir doğruyu götürür?" value={divisor} onChangeText={setDivisor} keyboardType="numeric" />
    </Section> : null}
    <Section title="Görünüm">
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ flex: 1, color: colors.foreground, fontSize: 15, fontWeight: '700' }}>Koyu tema</Text>
        <Switch value={dark} onValueChange={(v) => updateSettings({ theme: v ? 'dark' : 'light' })} trackColor={{ true: '#3b8bff', false: '#2a2a30' }} thumbColor="#fff" />
      </View>
      <ThemePicker />
    </Section>
    {!teacher ? <><PermissionsCard /><AlarmSoundPicker /></> : null}
    {!teacher ? <Section title="Kilit ve gizlilik"><NavRow label="Kilitlenecek uygulamalar" onPress={() => router.push('/locked-apps' as never)} last /></Section> : null}
    <Section title="Gizlilik ve hesap">
      <NavRow label="Hangi bilgiler toplanıyor?" onPress={() => openLegal('privacy')} />
      <NavRow label="Kullanım şartları" onPress={() => openLegal('terms')} />
      <NavRow label="Şikayet / öneri" onPress={() => router.push('/feedback' as never)} />
      <NavRow label="Bu telefondaki verilerimi sil" onPress={wipe} tone="warn" />
      <NavRow label="Hesabımı kalıcı olarak sil" onPress={deleteAccount} tone="danger" last />
    </Section>
    <Pressable testID="button-Ayarları kaydet" onPress={save} style={({ pressed }) => ({ height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.8 : 1 })}><Text style={{ color: colors.primaryForeground, fontSize: 17, fontWeight: '800' }}>Ayarları kaydet</Text></Pressable>
  </Screen>;
}
