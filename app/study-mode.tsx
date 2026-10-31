import { Feather } from '@expo/vector-icons';
import { useKeepAwake } from 'expo-keep-awake';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, BackHandler, Linking, Modal, Pressable, Text, View } from 'react-native';
import { usePlanim } from '@/context/PlanimContext';
import { useSpotify } from '@/context/SpotifyContext';
import { useColors } from '@/hooks/useColors';
import { CONFIG } from '@/config';
import { leaveRoom, Mate, publishPresence, subscribePresence } from '@/lib/rooms';
import { playUri } from '@/lib/spotify';
import { whatsappUrl } from '@/lib/whatsapp';
import { lockAvailable, PlanimLock } from '@/modules/planim-lock';

function endTimestamp(endTime: string) {
  const [hours, minutes] = endTime.split(':').map(Number);
  const end = new Date();
  end.setHours(hours || 0, minutes || 0, 0, 0);
  return end.getTime();
}

const STUDY_KEY = 'pusulam.study.v1';
interface SavedStudy { sig: string; startedAt: number; baseTarget: number; breakMs: number; breakStart: number; breakUntil: number }

const clock = (seconds: number) => `${String(Math.floor(seconds / 3600)).padStart(2, '0')}:${String(Math.floor((seconds % 3600) / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

type Sheet = null | 'choice' | 'break' | 'friends';

/**
 * Çalışma modu. Ders alarmından ya da kilit simgesinden (süre seçerek) açılır.
 * Kilit simgesine dokununca: mola / dersi bitirdim / geri dön sorulur.
 */
export default function StudyModeScreen() {
  useKeepAwake();
  const colors = useColors();
  const { id, minutes, room, host } = useLocalSearchParams<{ id?: string; minutes?: string; room?: string; host?: string }>();
  const roomId = room ? String(room) : '';
  const { lessons, addFocusSession, settings, friends } = usePlanim();
  const spotify = useSpotify();
  const lesson = lessons.find((item) => item.id === id);
  const [now, setNow] = useState(Date.now());
  const [lockOk, setLockOk] = useState(true);
  const [missing, setMissing] = useState<string[]>([]);
  const [noApps, setNoApps] = useState(false);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [breakUntil, setBreakUntil] = useState(0);
  const [mates, setMates] = useState<Mate[]>([]);
  /** Çalışma oturumunun başlangıcı ve bitişi. Telefona kaydedilir; ekran yeniden açılsa da mola ve süre kaybolmaz. */
  const [boot, setBoot] = useState<null | { startedAt: number; baseTarget: number; restored: boolean }>(null);
  const sig = lesson ? `l:${lesson.id}` : 'manual';
  const breakMs = useRef(0);
  const breakStart = useRef(0);
  const [breakTotal, setBreakTotal] = useState(0);

  const manualMinutes = Math.max(1, Number(minutes) || 45);
  const title = lesson?.name ?? 'Çalışma';
  const startedAt = boot?.startedAt ?? 0;
  const baseTarget = boot?.baseTarget ?? 0;
  /** Mola boyunca ders sayacı durur: biten molalar + süren molanın o ana kadarki kısmı bitiş zamanına eklenir. */
  const openBreakMs = breakStart.current ? Math.max(0, Math.min(now, breakUntil) - breakStart.current) : 0;
  const target = baseTarget + breakTotal + openBreakMs;
  const remaining = Math.max(0, Math.ceil((target - now) / 1000));
  const breakLeft = Math.max(0, Math.ceil((breakUntil - now) / 1000));
  const onBreak = breakLeft > 0;
  const over = remaining === 0 ? Math.max(0, Math.floor((now - target) / 1000)) : 0;

  const persist = (extra: Partial<SavedStudy> = {}) => {
    if (!boot) return;
    const data: SavedStudy = { sig, startedAt: boot.startedAt, baseTarget: boot.baseTarget, breakMs: breakMs.current, breakStart: breakStart.current, breakUntil, ...extra };
    AsyncStorage.setItem(STUDY_KEY, JSON.stringify(data)).catch(() => undefined);
  };

  /** Molada geçen süre çalışmadan sayılmaz. */
  const closeBreak = () => {
    if (breakStart.current) { breakMs.current += Math.max(0, Math.min(Date.now(), breakUntil) - breakStart.current); breakStart.current = 0; setBreakTotal(breakMs.current); }
    setBreakUntil(0);
    persist({ breakMs: breakMs.current, breakStart: 0, breakUntil: 0 });
    if (lockAvailable) PlanimLock.setBreak(0);
  };

  const finish = (save: boolean) => {
    AsyncStorage.removeItem(STUDY_KEY).catch(() => undefined);
    if (roomId) leaveRoom(roomId, settings.studentName || 'Arkadaşın', host === '1').catch(() => undefined);
    if (lockAvailable) PlanimLock.stopLock();
    if (save) {
      const openBreak = breakStart.current ? Math.max(0, Math.min(Date.now(), breakUntil) - breakStart.current) : 0;
      const spent = Math.round((Date.now() - startedAt - breakMs.current - openBreak) / 60000);
      if (spent >= 1) addFocusSession(spent);
    }
    if (save && lesson) router.replace(`/lesson-summary?id=${lesson.id}` as never);
    else router.replace('/');
  };

  // Önce kayıtlı oturum var mı bak: varsa kaldığı yerden devam eder (mola dahil), yoksa yeni oturum başlatır.
  useEffect(() => {
    let alive = true;
    (async () => {
      let saved: SavedStudy | null = null;
      try { const raw = await AsyncStorage.getItem(STUDY_KEY); saved = raw ? JSON.parse(raw) as SavedStudy : null; } catch { saved = null; }
      const t = Date.now();
      if (saved && saved.sig === sig && t - saved.startedAt < 12 * 3600000) {
        let ms = saved.breakMs;
        let until = saved.breakUntil;
        let start = saved.breakStart;
        if (start && until <= t) { ms += Math.max(0, until - start); start = 0; until = 0; }
        breakMs.current = ms; breakStart.current = start;
        if (!alive) return;
        setBreakTotal(ms); setBreakUntil(until);
        setBoot({ startedAt: saved.startedAt, baseTarget: saved.baseTarget, restored: true });
        return;
      }
      const started = t;
      const target = lesson ? Math.max(endTimestamp(lesson.endTime), started + 60000) : started + manualMinutes * 60000;
      AsyncStorage.setItem(STUDY_KEY, JSON.stringify({ sig, startedAt: started, baseTarget: target, breakMs: 0, breakStart: 0, breakUntil: 0 } as SavedStudy)).catch(() => undefined);
      if (alive) setBoot({ startedAt: started, baseTarget: target, restored: false });
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!lockAvailable || !boot) return;
    const absent: string[] = [];
    if (!PlanimLock.hasUsageAccess()) absent.push('Kullanım erişimi');
    if (!PlanimLock.hasOverlayAccess()) absent.push('Diğer uygulamaların üzerinde göster');
    setMissing(absent);
    if (absent.length) { setLockOk(false); return; }
    // "Açık kalacak" listesi + telefon/mesaj/rehber + müzik dışındaki her uygulama kilitlenir.
    const allowed = Array.from(new Set([...settings.alwaysAllowedApps, ...PlanimLock.getEmergencyPackages(), ...CONFIG.musicApps]));
    const blocked = PlanimLock.getLaunchableApps().map((app) => app.pkg).filter((pkg) => !allowed.includes(pkg));
    setNoApps(blocked.length === 0);
    // Kilit servisi zaten çalışıyorsa yeniden kurma: yoksa süren mola ve arkadaş penceresi silinir.
    if (!(boot.restored && PlanimLock.isLockRunning())) {
      PlanimLock.startLock({
        blocked,
        allowed,
        friend: settings.friendApps.length ? settings.friendApps : CONFIG.friendStudyDefaults,
        // Uygulama mola sırasında yeniden açıldıysa, molanın o ana kadarki kısmı da bitişe eklenir (kalanı setBreak ekler).
        endAt: boot.baseTarget + breakMs.current + (breakStart.current ? Math.max(0, Math.min(Date.now(), breakUntil) - breakStart.current) : 0),
        lessonName: title,
      });
      if (breakUntil > Date.now()) PlanimLock.setBreak(breakUntil);
    }
    const check = setInterval(() => setLockOk(PlanimLock.isLockRunning()), 3000);
    return () => clearInterval(check);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boot]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => { setSheet((current) => current === null ? 'choice' : null); return true; });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Süre dolunca otomatik bitmez: kişi "bitirdim" diyene kadar geçen süre kaydedilir.
  useEffect(() => {
    if (breakUntil && breakLeft === 0) closeBreak();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [breakLeft, breakUntil]);

  // Çalışma odası: arkadaşların durumunu dinle, kendi durumunu 30 saniyede bir yaz.
  useEffect(() => {
    if (!roomId) return undefined;
    let off: (() => void) | undefined; let alive = true;
    subscribePresence(roomId, setMates).then((u) => { if (alive) off = u; else u(); }).catch(() => undefined);
    return () => { alive = false; off?.(); };
  }, [roomId]);
  useEffect(() => {
    if (!roomId) return undefined;
    const send = () => publishPresence(roomId, settings.studentName || 'Arkadaşın', onBreak ? 'break' : 'studying').catch(() => undefined);
    send();
    const timer = setInterval(send, 30000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, onBreak]);

  const startBreak = (mins: number) => {
    // Süren bir mola varsa önce kapat: o ana kadar geçen kısım kaybolup dersten düşmesin.
    if (breakStart.current) closeBreak();
    const until = Date.now() + mins * 60000;
    breakStart.current = Date.now();
    setBreakUntil(until);
    persist({ breakStart: breakStart.current, breakUntil: until });
    if (lockAvailable) PlanimLock.setBreak(until);
    setSheet(null);
  };
  const endBreak = () => closeBreak();

  const callFriend = (phone: string, name: string) => {
    if (lockAvailable) PlanimLock.setFriendWindow(Date.now() + 30 * 60000);
    setSheet(null);
    Linking.openURL(whatsappUrl(phone, `Hadi birlikte ders çalışalım! Pusulam’da çalışma modundayım. 📚`)).catch(() => Alert.alert('WhatsApp açılamadı', `${name} ile sohbeti açmak için WhatsApp kurulu olmalı.`));
  };

  const pill = (icon: keyof typeof Feather.glyphMap, label: string, onPress: () => void, strong = false) => <Pressable onPress={onPress} style={{ flexDirection: 'row', gap: 8, alignItems: 'center', paddingVertical: 12, paddingHorizontal: 18, borderRadius: 16, backgroundColor: strong ? colors.primary : colors.secondary }}>
    <Feather name={icon} size={16} color={strong ? colors.primaryForeground : colors.primary} />
    <Text style={{ color: strong ? colors.primaryForeground : colors.primary, fontWeight: '800' }}>{label}</Text>
  </Pressable>;
  const sheetButton = (label: string, onPress: () => void, tone: 'primary' | 'plain' | 'danger' = 'plain', icon?: keyof typeof Feather.glyphMap) => <Pressable key={label} onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 50, borderRadius: 15, backgroundColor: tone === 'primary' ? colors.primary : colors.secondary }}>
    {icon ? <Feather name={icon} size={17} color={tone === 'primary' ? colors.primaryForeground : tone === 'danger' ? colors.destructive : colors.secondaryForeground} /> : null}
    <Text style={{ color: tone === 'primary' ? colors.primaryForeground : tone === 'danger' ? colors.destructive : colors.secondaryForeground, fontWeight: '800', fontSize: 15 }}>{label}</Text>
  </Pressable>;

  if (!boot) return <View style={{ flex: 1, backgroundColor: colors.background }} />;

  return <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 14 }}>
    <StatusBar hidden />
    {pill('users', 'Arkadaşımı çağır', () => setSheet('friends'))}
    <Pressable onPress={() => setSheet('choice')} hitSlop={14} style={{ width: 76, height: 76, borderRadius: 38, backgroundColor: onBreak ? colors.warnSoft : colors.accent, alignItems: 'center', justifyContent: 'center' }}>
      <Feather name={onBreak ? 'coffee' : 'lock'} size={32} color={onBreak ? colors.warning : colors.primary} />
    </Pressable>
    <Text style={{ color: colors.primary, fontWeight: '800', letterSpacing: 1.4, fontSize: 12 }}>{onBreak ? 'MOLA' : 'ÇALIŞMA MODU'}</Text>
    <Text style={{ color: colors.foreground, fontSize: 32, fontFamily: 'Georgia', fontWeight: '700', textAlign: 'center' }}>{title}</Text>
    <Text style={{ color: over ? colors.success : colors.foreground, fontSize: 56, fontWeight: '800', letterSpacing: 2 }}>{over ? `+${clock(over)}` : clock(remaining)}</Text>
    {onBreak ? <View style={{ alignItems: 'center', gap: 10 }}><Text style={{ color: colors.warning, fontWeight: '800', fontSize: 16 }}>Mola bitmesine {Math.floor(breakLeft / 60)}:{String(breakLeft % 60).padStart(2, '0')}</Text>{pill('play', 'Molayı bitir', endBreak, true)}</View>
      : <Text style={{ color: over ? colors.success : colors.mutedForeground, textAlign: 'center', lineHeight: 20, fontWeight: over ? '800' : '400' }}>{over ? 'Süre doldu ama devam ediyorsun, harika! Bitirince kilide dokunup "bitirdim" de; geçen süre kaydedilir.' : 'Sadece şu ana odaklan. Mola, bitirme ya da geri dönmek için kilide dokun.'}</Text>}
    {lockAvailable && !lockOk ? <View style={{ padding: 12, borderRadius: 14, backgroundColor: colors.secondary }}><Text style={{ color: colors.destructive, fontWeight: '800', textAlign: 'center' }}>Uygulama kilidi şu an çalışmıyor</Text><Text style={{ color: colors.mutedForeground, fontSize: 12, textAlign: 'center', marginTop: 4, lineHeight: 17 }}>{missing.length ? `Eksik izin: ${missing.join(', ')}. Ayarlar > İzinler bölümünden aç.` : 'Telefon uygulamayı arka planda durdurmuş olabilir. Pil kısıtlamasını kapatıp yeniden başlat.'}</Text></View> : null}
    {lockAvailable && lockOk && noApps ? <Pressable onPress={() => router.push('/locked-apps' as never)} style={{ padding: 12, borderRadius: 14, backgroundColor: colors.warnSoft }}><Text style={{ color: colors.warning, fontWeight: '800', textAlign: 'center' }}>Kilitlenecek uygulama kalmadı; hepsini açık bıraktın. Düzenlemek için dokun.</Text></Pressable> : null}
    {!lockAvailable ? <Text style={{ color: colors.mutedForeground, fontSize: 12, textAlign: 'center' }}>Uygulama kilidi yalnızca yüklenen Android uygulamasında çalışır.</Text> : null}
    {roomId ? <View style={{ padding: 12, borderRadius: 14, backgroundColor: colors.secondary, gap: 4, alignSelf: 'stretch' }}>
      <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 12, letterSpacing: 1 }}>ÇALIŞMA ODASI</Text>
      {mates.filter((m) => m.state !== 'left').length === 0 ? <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>Arkadaşının katılması bekleniyor…</Text> : null}
      {mates.filter((m) => m.state !== 'left').map((m) => <Text key={m.uid} style={{ color: colors.foreground, fontWeight: '700' }}>{m.name}: {!m.fresh ? 'bağlantı yok' : m.state === 'break' ? 'molada ☕' : 'çalışıyor 📚'}</Text>)}
      {mates.some((m) => m.state === 'left') ? <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>{mates.filter((m) => m.state === 'left').map((m) => m.name).join(', ')} odadan ayrıldı.</Text> : null}
    </View> : null}
    {lesson?.spotifyTrackUri && spotify.connected ? pill('music', 'Müziği tekrar çal', () => playUri(lesson.spotifyTrackUri!).catch(() => undefined)) : null}

    <Modal visible={sheet !== null} transparent animationType="fade" onRequestClose={() => setSheet(null)}>
      <Pressable onPress={() => setSheet(null)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <Pressable style={{ backgroundColor: colors.card, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 20, gap: 10 }}>
          {sheet === 'choice' ? <>
            <Text style={{ color: colors.foreground, fontSize: 20, fontWeight: '800', fontFamily: 'Georgia' }}>Ne yapmak istiyorsun?</Text>
            {onBreak ? sheetButton('Molayı bitir, derse dön', () => { setSheet(null); endBreak(); }, 'plain', 'play') : sheetButton('Mola vereceğim', () => setSheet('break'), 'plain', 'coffee')}
            {sheetButton(lesson ? 'Dersi bitirdim' : 'Çalışmayı bitirdim', () => { setSheet(null); finish(true); }, 'plain', 'check-circle')}
            {sheetButton('Geri dön, çalışmaya devam', () => setSheet(null), 'primary', 'arrow-left')}
          </> : null}
          {sheet === 'break' ? <>
            <Text style={{ color: colors.foreground, fontSize: 20, fontWeight: '800', fontFamily: 'Georgia' }}>Mola ne kadar olsun?</Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>Mola boyunca kilit kalkar, süre bitince kendiliğinden geri döner.</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>{[5, 10, 15].map((m) => <View key={m} style={{ flex: 1 }}>{sheetButton(`${m} dk`, () => startBreak(m), 'plain')}</View>)}</View>
            {sheetButton('Geri', () => setSheet('choice'), 'plain', 'arrow-left')}
          </> : null}
          {sheet === 'friends' ? <>
            <Text style={{ color: colors.foreground, fontSize: 20, fontWeight: '800', fontFamily: 'Georgia' }}>Arkadaşını çağır</Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>WhatsApp sohbeti açılır; “arkadaş uygulamaları” olarak seçtiklerin 30 dakika boyunca kilitlenmez.</Text>
            {friends.length === 0 ? <Text style={{ color: colors.mutedForeground }}>Henüz arkadaş eklenmedi.</Text> : null}
            {friends.map((friend) => sheetButton(friend.name, () => callFriend(friend.phone, friend.name), 'plain', 'message-circle'))}
            {sheetButton('Arkadaş ekle', () => { setSheet(null); router.push('/friends'); }, 'plain', 'user-plus')}
            {sheetButton('Kapat', () => setSheet(null), 'primary')}
          </> : null}
        </Pressable>
      </Pressable>
    </Modal>
  </View>;
}
