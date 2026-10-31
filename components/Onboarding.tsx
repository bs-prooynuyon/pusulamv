import React, { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { LoginScreen } from '@/components/LoginScreen';
import { Intro } from '@/components/Intro';
import { AiKeyCard } from '@/components/AiKeyCard';
import { Avatar } from '@/components/Avatar';
import { pickProfilePhoto } from '@/lib/photo';
import { Feather } from '@expo/vector-icons';
import { Card, Field, PrimaryButton, Screen, styles } from '@/components/PlanimUI';
import { LockedAppsEditor } from '@/components/LockedAppsEditor';
import { PermissionsCard, usePermissionState } from '@/components/PermissionsCard';
import { LgsYearPicker } from '@/components/LgsYearPicker';
import { GradePicker } from '@/components/GradePicker';
import { SchoolPicker, SchoolValue } from '@/components/SchoolPicker';
import { lgsDateForYear } from '@/lib/lgs';
import { ReportSettings } from '@/components/ReportSettings';
import { ThemePicker } from '@/components/ThemePicker';
import { usePlanim } from '@/context/PlanimContext';
import { useColors } from '@/hooks/useColors';

const STEPS = [
  { eyebrow: 'HESAP', title: 'Önce giriş yapalım.', text: 'Hesabınla giriş yap; verilerin yedeklensin. İstersen hesap açmadan da devam edebilirsin.' },
  { eyebrow: 'PROFİLİN', title: 'Seni tanıyalım.', text: 'Adın, fotoğrafın ve hedeflerin; hepsini sonra Profil’den değiştirebilirsin.' },
  { eyebrow: 'İZİNLER', title: 'Alarm ve çalışma modu.', text: 'Dersin tam vaktinde çalması ve kilidin çalışması için birkaç izne ihtiyacımız var.' },
  { eyebrow: 'KİLİT', title: 'Ders sırasında hangi uygulamalar kilitlensin?', text: 'Başta hepsi seçili gelir; ders sırasında açık kalmasını istediklerinin işaretini kaldır (telefon, mesajlar ve müzik zaten açık kalır). Sonra Ayarlar\'dan değiştirebilirsin.' },
  { eyebrow: 'ÖZETLER', title: 'Özetler ne zaman gelsin?', text: 'Haftalık ve aylık özet için gün seç, istersen velinin numarasını ekle. Hepsini sonra da değiştirebilirsin.' },
  { eyebrow: 'YAPAY ZEKA', title: 'Yapay zeka yardımcın olsun.', text: 'Deneme PDF’ini okuyup netleri çıkarır, takıldığın soruları yanıtlar. Bunun için kendi Gemini API anahtarını ekle; istersen sonra Ayarlar’dan da ekleyebilirsin. 18 yaşından küçüklerde yapay zeka başta kapalıdır; ebeveyn PIN’iyle Ayarlar’dan açılır.' },
];

/** İzinler önerilir ama zorunlu değil: telefon izin ekranını açtırmıyorsa kişi “Şimdilik geç” diyebilir. */
function PermissionsStep({ onNext }: { onNext: () => void }) {
  const { missing, requiredOk } = usePermissionState();
  const colors = useColors();
  return <View style={{ gap: 12 }}>
    <PermissionsCard />
    {!requiredOk ? <Text style={{ color: colors.mutedForeground, fontSize: 12, lineHeight: 17, textAlign: 'center' }}>Eksik izinler: {missing.join(', ')}. Bunlar olmadan alarm ve kilit tam çalışmaz; istersen şimdilik geçip sonra Ayarlar’dan verebilirsin.</Text> : null}
    <PrimaryButton label={requiredOk ? 'Devam' : 'Şimdilik geç'} onPress={onNext} icon="arrow-right" secondary={!requiredOk} />
  </View>;
}

export function Onboarding() {
  const colors = useColors();
  const { settings, updateSettings } = usePlanim();
  const [step, setStep] = useState(0);
  const [introDone, setIntroDone] = useState(!!settings.signedIn);
  const [name, setName] = useState(settings.studentName);
  const defaultYear = new Date().getMonth() >= 5 ? new Date().getFullYear() + 1 : new Date().getFullYear();
  const [role, setRole] = useState<'student' | 'teacher'>(settings.role === 'teacher' ? 'teacher' : 'student');
  const [year, setYear] = useState(settings.examYear || defaultYear);
  const [grade, setGrade] = useState(settings.studentGrade ?? '');
  const [target, setTarget] = useState<SchoolValue>({ city: settings.targetCity, district: settings.targetDistrict, school: settings.targetSchool });
  const [work, setWork] = useState<SchoolValue>({ city: settings.schoolCity, district: settings.schoolDistrict, school: settings.schoolName });
  const [targetNet, setTargetNet] = useState(settings.targetNet ? String(settings.targetNet) : '85');

  const saveProfile = () => {
    const missing: string[] = [];
    if (name.trim().length < 2) missing.push('adın');
    if (role === 'student' && !grade) missing.push('sınıfın');
    if (!work.city || !work.school.trim()) missing.push(role === 'teacher' ? 'çalıştığın okul' : 'okuduğun okul');
    if (role === 'student' && (!target.city || !target.school.trim())) missing.push('hedef lise');
    if (role === 'student' && !(Number(targetNet) > 0)) missing.push('hedef net');
    if (missing.length) return Alert.alert('Bilgilerini tamamla', `Devam etmek için şunları doldur: ${missing.join(', ')}.`);
    if (role === 'teacher') {
      updateSettings({ role: 'teacher', studentName: name.trim(), schoolCity: work.city, schoolDistrict: work.district.trim(), schoolName: work.school.trim() });
      updateSettings({ onboardingComplete: true });
      return;
    }
    const info = lgsDateForYear(year);
    updateSettings({
      role: 'student',
      studentGrade: grade,
      studentName: name.trim(),
      examYear: year,
      examDate: info.date,
      examDateEstimated: info.estimated,
      targetCity: target.city,
      targetDistrict: target.district.trim(),
      targetSchool: target.school.trim(),
      targetNet: Number(targetNet),
      schoolCity: work.city,
      schoolDistrict: work.district.trim(),
      schoolName: work.school.trim(),
    });
    setStep(2);
  };

  const finish = () => updateSettings({ onboardingComplete: true });
  const info = STEPS[step];

  if (step === 0 && !introDone) return <Intro onDone={() => setIntroDone(true)} />;
  if (step === 0) return <LoginScreen onDone={() => setStep(1)} />;

  return <Screen>
    <View style={{ flex: 1, justifyContent: 'center', paddingVertical: 28 }}>
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <View style={{ width: 68, height: 68, borderRadius: 25, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Text style={{ fontSize: 31, color: colors.primary }}>✦</Text>
        </View>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>{info.eyebrow}</Text>
        <Text style={[styles.title, { color: colors.foreground, textAlign: 'center' }]}>{info.title}</Text>
        <Text style={{ color: colors.mutedForeground, fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 8 }}>{info.text}</Text>
        <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 8 }}>Adım {step + 1} / {STEPS.length}</Text>
      </View>

      {step === 1 ? <Card tone="pink">
        <Pressable onPress={async () => { const photo = await pickProfilePhoto(); if (photo) updateSettings({ profilePhoto: photo }); }} style={{ alignSelf: 'center' }}>
          <Avatar size={92} />
          <View style={{ position: 'absolute', right: -2, bottom: -2, width: 30, height: 30, borderRadius: 15, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}><Feather name="camera" size={14} color={colors.primaryForeground} /></View>
        </Pressable>
        <Text style={{ color: colors.mutedForeground, fontSize: 12, textAlign: 'center' }}>Fotoğraf eklemezsen boş profil görünür.</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>{([['student', 'Öğrenciyim'], ['teacher', 'Öğretmenim']] as const).map(([key, label]) => <Pressable key={key} onPress={() => setRole(key)} style={{ flex: 1, alignItems: 'center', paddingVertical: 13, borderRadius: 14, backgroundColor: role === key ? colors.primary : colors.card, borderWidth: 1, borderColor: role === key ? colors.primary : colors.border }}><Text style={{ color: role === key ? colors.primaryForeground : colors.foreground, fontWeight: '800' }}>{label}</Text></Pressable>)}</View>
        <Field label="Adın" value={name} onChangeText={setName} placeholder={role === 'teacher' ? 'Örn. Ayşe Öğretmen' : 'Örn. Elif'} />
        {role === 'student' ? <>
          <GradePicker value={grade} onChange={setGrade} />
          <LgsYearPicker year={year} onChange={(y) => setYear(y)} />
          <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: '700' }}>Hedeflediğin lise</Text>
          <SchoolPicker value={target} onChange={setTarget} schoolLabel="Hedef lise" level="lise" />
          <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: '700' }}>Şu an okuduğun okul (okul grubu için)</Text>
          <SchoolPicker value={work} onChange={setWork} schoolLabel="Okulun" level={role === 'teacher' ? 'hepsi' : 'ortaokul'} />
          <Field label="Hedef netin" value={targetNet} onChangeText={setTargetNet} placeholder="85" keyboardType="numeric" />
        </> : <>
          <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: '700' }}>Çalıştığın okul</Text>
          <SchoolPicker value={work} onChange={setWork} />
          <Text style={{ color: colors.mutedForeground, fontSize: 12, lineHeight: 17 }}>Öğretmen olarak sınıf kurabilir, sohbette öğrencilerinle yazışabilir ve öğrencilerinin onayıyla çalışma raporu isteyebilirsin.</Text>
        </>}
        <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: '700' }}>Tema ve renk</Text>
        <ThemePicker />
        <PrimaryButton label="Devam" onPress={saveProfile} icon="arrow-right" />
      </Card> : null}

      {step === 2 ? <View style={{ gap: 12 }}>
        <PermissionsStep onNext={() => setStep(3)} />
      </View> : null}

      {step === 3 ? <View style={{ gap: 12 }}>
        <LockedAppsEditor />
        <PrimaryButton label="Devam" onPress={() => setStep(4)} icon="arrow-right" />
      </View> : null}

      {step === 4 ? <View style={{ gap: 12 }}>
        <Card><ReportSettings /></Card>
        <PrimaryButton label="Devam" onPress={() => setStep(5)} icon="arrow-right" />
      </View> : null}

      {step === 5 ? <View style={{ gap: 12 }}>
        <AiKeyCard />
        <PrimaryButton label="Planımı oluşturalım" onPress={finish} icon="check" />
        <PrimaryButton label="Şimdilik atla" onPress={finish} secondary />
      </View> : null}

      <Text style={{ color: colors.mutedForeground, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 15 }}>{settings.signedIn ? 'Bilgilerin hesabına bağlı olarak saklanır.' : 'Hesapsız kullanırsan bilgilerin yalnızca bu telefonda saklanır.'}</Text>
    </View>
  </Screen>;
}
