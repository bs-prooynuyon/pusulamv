import { Feather } from '@expo/vector-icons';
import { pickProfilePhoto } from '@/lib/photo';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { Card, Screen, styles } from '@/components/PlanimUI';
import { ThemePicker } from '@/components/ThemePicker';
import { usePlanim } from '@/context/PlanimContext';
import { useColors } from '@/hooks/useColors';
import { classMembers, myClasses } from '@/lib/classes';
import { examTotal, fmtNet, lgsCountdown, sortExams } from '@/lib/lgs';
import { streakDays } from '@/lib/stats';

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  const colors = useColors();
  return <Card style={{ flexBasis: '47%', flexGrow: 1, gap: 6, padding: 16 }}>
    <Text style={{ color: colors.foreground, fontSize: 26, fontWeight: '800' }}>{value}</Text>
    <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: '800', letterSpacing: 1.1 }}>{label}</Text>
    {hint ? <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>{hint}</Text> : null}
  </Card>;
}

function Row({ icon, label, onPress, open }: { icon: keyof typeof Feather.glyphMap; label: string; onPress: () => void; open?: boolean }) {
  const colors = useColors();
  return <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16 }}>
    <Feather name={icon} size={20} color={colors.mutedForeground} />
    <Text style={{ flex: 1, color: colors.foreground, fontSize: 16, fontWeight: '700' }}>{label}</Text>
    <Feather name={open ? 'chevron-down' : 'chevron-right'} size={19} color={colors.mutedForeground} />
  </Pressable>;
}

const fmtDuration = (min: number) => (min >= 60 ? `${Math.floor(min / 60)} sa ${min % 60} dk` : `${min} dk`);

export default function ProfileScreen() {
  const colors = useColors();
  const { settings, updateSettings, sessions, exams } = usePlanim();
  const teacher = settings.role === 'teacher';
  const [themeOpen, setThemeOpen] = useState(false);
  const [classCount, setClassCount] = useState<number | null>(null);
  const [studentCount, setStudentCount] = useState<number | null>(null);

  useEffect(() => {
    if (!teacher || !settings.signedIn) return;
    let alive = true;
    (async () => {
      try {
        const [c, m] = await Promise.all([myClasses(), classMembers()]);
        if (alive) { setClassCount(c.length); setStudentCount(m.length); }
      } catch { /* çevrimdışıyken sayılar gösterilmez */ }
    })();
    return () => { alive = false; };
  }, [teacher, settings.signedIn]);

  const pickPhoto = async () => { const photo = await pickProfilePhoto(); if (photo) updateSettings({ profilePhoto: photo }); };

  const lgs = lgsCountdown(settings);
  const weekMinutes = sessions.filter((s) => Date.now() - new Date(s.date).getTime() < 7 * 86400000).reduce((sum, s) => sum + s.durationMinutes, 0);
  const lastExam = sortExams(exams)[0];
  const sub = teacher
    ? [settings.schoolName, settings.schoolCity].filter(Boolean).join(' · ') || 'Okul bilgisi eklenmemiş'
    : settings.targetSchool || 'Hedef lise belirlenmedi';

  return <Screen>
    <Pressable onPress={() => router.back()} hitSlop={10} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44 }}><Feather name="chevron-left" size={20} color={colors.mutedForeground} /><Text style={{ color: colors.mutedForeground, fontWeight: '700' }}>Geri</Text></Pressable>
    <Text style={[styles.title, { color: colors.foreground, fontSize: 32 }]}>Profilim</Text>
    <View style={{ borderRadius: 24, backgroundColor: colors.primary, padding: 22, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
      <Pressable onPress={pickPhoto}>
        <View style={{ borderRadius: 40, borderWidth: 2, borderColor: colors.primaryForeground, padding: 2 }}><Avatar size={68} /></View>
        <View style={{ position: 'absolute', right: -2, bottom: -2, width: 26, height: 26, borderRadius: 13, backgroundColor: colors.primaryForeground, alignItems: 'center', justifyContent: 'center' }}><Feather name="camera" size={14} color={colors.primary} /></View>
      </Pressable>
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={{ color: colors.primaryForeground, fontSize: 22, fontWeight: '800' }}>{settings.studentName || 'Profilim'}</Text>
        <View style={{ alignSelf: 'flex-start', marginTop: 6, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, backgroundColor: colors.primaryForeground }}><Text style={{ color: colors.primary, fontSize: 11, fontWeight: '800' }}>{teacher ? 'ÖĞRETMEN' : settings.studentGrade ? `${settings.studentGrade}. SINIF` : 'ÖĞRENCİ'}</Text></View>
        <Text numberOfLines={2} style={{ color: colors.primaryForeground, opacity: 0.85, fontSize: 13, marginTop: 6 }}>{sub}{!teacher && settings.targetNet ? ` · hedef ${settings.targetNet} net` : ''}</Text>
        {settings.email ? <Text numberOfLines={1} style={{ color: colors.primaryForeground, opacity: 0.7, fontSize: 12, marginTop: 3 }}>{settings.email}</Text> : null}
      </View>
    </View>

    {teacher ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
      <Stat label="SINIFLARIM" value={classCount === null ? '–' : String(classCount)} />
      <Stat label="ÖĞRENCİLERİM" value={studentCount === null ? '–' : String(studentCount)} />
      {!settings.signedIn ? <Text style={{ color: colors.mutedForeground, fontSize: 12, flexBasis: '100%' }}>Sınıf ve öğrenci sayıları için hesabınla giriş yapmalısın.</Text> : null}
    </View> : <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
      <Stat label={`${lgs.year} LGS’YE GÜN`} value={String(lgs.days)} hint={lgs.estimated ? 'tahmini tarih' : undefined} />
      <Stat label="BU HAFTA ODAK" value={fmtDuration(weekMinutes)} />
      <Stat label="SON DENEME NETİ" value={lastExam ? fmtNet(examTotal(lastExam.results)) : '–'} hint={lastExam ? lastExam.title : 'henüz deneme yok'} />
      <Stat label="ÇALIŞMA SERİSİ" value={`${streakDays(sessions)} gün`} />
    </View>}

    <Card style={{ paddingVertical: 2, paddingHorizontal: 18, gap: 0 }}>
      {teacher ? <><Row icon="message-circle" label="Sohbet ve sınıflarım" onPress={() => router.push('/chat' as never)} /><View style={{ height: 1, backgroundColor: colors.border }} /></> : null}
      {!teacher ? <><Row icon="award" label="Rozetlerim" onPress={() => router.push('/badges' as never)} /><View style={{ height: 1, backgroundColor: colors.border }} /></> : null}
      <Row icon="droplet" label="Tema ve renk" open={themeOpen} onPress={() => setThemeOpen((v) => !v)} />
      {themeOpen ? <View style={{ paddingBottom: 14 }}><ThemePicker /></View> : null}
      <View style={{ height: 1, backgroundColor: colors.border }} />
      <Row icon="edit-2" label="Bilgilerimi düzenle" onPress={() => router.push('/settings')} />
      <View style={{ height: 1, backgroundColor: colors.border }} />
      <Row icon="settings" label="Ayarlar" onPress={() => router.push('/settings')} />
    </Card>
  </Screen>;
}
