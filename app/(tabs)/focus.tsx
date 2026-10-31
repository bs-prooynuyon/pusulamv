import { Feather } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { Card, Header, IconButton, PrimaryButton, Screen, SectionTitle } from '@/components/PlanimUI';
import { WheelNumber } from '@/components/WheelNumber';
import { usePlanim } from '@/context/PlanimContext';
import { useColors } from '@/hooks/useColors';

export default function FocusScreen() {
  const colors = useColors();
  const { addFocusSession, sessions } = usePlanim();
  const [workMinutes, setWorkMinutes] = useState(25);
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const elapsedMin = () => Math.floor((workMinutes * 60 - remaining) / 60);
  /** Süre dolmadan bitirilirse geçen süre yine kaydedilir. */
  const finishNow = () => { const mins = elapsedMin(); setRunning(false); if (mins >= 1) { addFocusSession(mins); setCelebrating(true); } setRemaining(workMinutes * 60); };
  const today = new Date().toISOString().slice(0, 10);
  const todayMinutes = sessions.filter((item) => item.date.slice(0, 10) === today).reduce((sum, item) => sum + item.durationMinutes, 0);
  useEffect(() => {
    if (!running) return undefined;
    const timer = setInterval(() => setRemaining((value) => {
      if (value <= 1) {
        clearInterval(timer);
        setRunning(false);
        addFocusSession(workMinutes);
        setCelebrating(true);
        return workMinutes * 60;
      }
      return value - 1;
    }), 1000);
    return () => clearInterval(timer);
  }, [running, workMinutes, addFocusSession]);
  const display = useMemo(() => `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`, [remaining]);
  const progress = 1 - remaining / (workMinutes * 60);

  return <Screen topBar>
    <Header eyebrow="Kendine ayırdığın zaman" title="Odaklanma" subtitle="Sadece şu ana dön. Gerisi biraz bekleyebilir. Kilit simgesi seçili süreyle çalışma modunu hemen başlatır." right={<IconButton name="lock" onPress={() => router.push(`/study-mode?minutes=${workMinutes}` as never)} color={colors.primary} />} />
    <Card style={{ alignItems: 'center', paddingVertical: 28, marginTop: 8 }}><View style={{ width: 216, height: 216, borderRadius: 108, borderWidth: 13, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}><View style={{ position: 'absolute', left: -13, top: -13, width: 216, height: 216, borderRadius: 108, borderWidth: 13, borderColor: colors.primary, borderRightColor: 'transparent', borderBottomColor: progress > 0.5 ? colors.primary : 'transparent', transform: [{ rotate: `${progress * 320 - 40}deg` }] }} /><Text style={{ color: colors.foreground, fontSize: 45, fontWeight: '800', letterSpacing: 1 }}>{display}</Text><Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 6 }}>{running ? 'Odaklanıyorsun' : 'Hazır olduğunda başla'}</Text></View><View style={{ flexDirection: 'row', gap: 10, marginTop: 24 }}><PrimaryButton label={running ? 'Duraklat' : 'Başlat'} onPress={() => setRunning((value) => !value)} icon={running ? 'pause' : 'play'} />{(running || elapsedMin() >= 1) ? <PrimaryButton label="Bitir" onPress={finishNow} icon="check" secondary /> : null}<Pressable onPress={() => { setRunning(false); setRemaining(workMinutes * 60); }} style={{ width: 48, height: 47, borderRadius: 15, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center' }}><Feather name="rotate-ccw" size={18} color={colors.secondaryForeground} /></Pressable></View></Card>
    <SectionTitle title="Seans süresi" />{!running ? <Card style={{ alignItems: 'center' }}><WheelNumber value={workMinutes} min={1} max={240} suffix="dakika" onChange={(minutes) => { setWorkMinutes(minutes); setRemaining(minutes * 60); }} /></Card> : null}<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><View style={{ flexDirection: 'row', gap: 8 }}>{[25, 40, 60, 90].map((minutes) => <Pressable key={minutes} onPress={() => { setWorkMinutes(minutes); setRemaining(minutes * 60); setRunning(false); }} style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, backgroundColor: workMinutes === minutes ? colors.primary : colors.card, borderWidth: 1, borderColor: workMinutes === minutes ? colors.primary : colors.border }}><Text style={{ color: workMinutes === minutes ? colors.primaryForeground : colors.mutedForeground, fontSize: 12, fontWeight: '800' }}>{minutes} dk</Text></Pressable>)}</View></View>
    <Card><View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: colors.mintSoft, alignItems: 'center', justifyContent: 'center' }}><Feather name="bar-chart-2" size={20} color={colors.success} /></View><View><Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: '700' }}>BUGÜN TOPLAM</Text><Text style={{ color: colors.foreground, fontSize: 22, fontWeight: '800', marginTop: 2 }}>{todayMinutes} dakika <Text style={{ color: colors.success, fontSize: 13 }}>odak</Text></Text></View></View></Card>
    {celebrating ? <Card tone="pink"><View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><Feather name="award" size={25} color={colors.primary} /><View style={{ flex: 1 }}><Text style={{ color: colors.foreground, fontWeight: '800', fontSize: 16 }}>Seans tamamlandı!</Text><Text style={{ color: colors.mutedForeground, fontSize: 13, marginTop: 3 }}>Bugün kendin için güzel bir şey yaptın.</Text></View><Pressable onPress={() => setCelebrating(false)}><Feather name="x" size={18} color={colors.mutedForeground} /></Pressable></View></Card> : null}
  </Screen>;
}