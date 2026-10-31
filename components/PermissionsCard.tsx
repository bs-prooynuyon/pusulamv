import { Feather } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { AppState, Linking, Platform, Pressable, Switch, Text, View } from 'react-native';
import { Card, PrimaryButton } from '@/components/PlanimUI';
import { usePlanim } from '@/context/PlanimContext';
import { useColors } from '@/hooks/useColors';
import { lockAvailable, PlanimLock } from '@/modules/planim-lock';
import { getNotificationPermission, PermissionState, requestNotificationPermission } from '@/lib/notifications';

function Row({ icon, title, text, status, action, onPress }: { icon: keyof typeof Feather.glyphMap; title: string; text: string; status?: 'ok' | 'todo'; action: string; onPress: () => void }) {
  const colors = useColors();
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
    <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}>
      <Feather name={icon} size={18} color={status === 'ok' ? colors.success : colors.primary} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={{ color: colors.foreground, fontWeight: '800', fontSize: 14 }}>{title}</Text>
      <Text style={{ color: colors.mutedForeground, fontSize: 12, lineHeight: 17, marginTop: 2 }}>{text}</Text>
    </View>
    {status === 'ok'
      ? <Feather name="check-circle" size={22} color={colors.success} />
      : <Pressable onPress={onPress} hitSlop={8} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: colors.primary }}><Text style={{ color: colors.primaryForeground, fontWeight: '800', fontSize: 12 }}>{action}</Text></Pressable>}
  </View>;
}

/** İzinlerin güncel durumu. Ayarlardan dönünce ve her 1,5 sn'de yenilenir (tikler kendiliğinden çıksın). */
export function usePermissionState() {
  const [notifications, setNotifications] = useState<PermissionState>('undetermined');
  const [usageOk, setUsageOk] = useState(false);
  const [overlayOk, setOverlayOk] = useState(false);
  const [fsiOk, setFsiOk] = useState(false);
  const refresh = useCallback(() => {
    getNotificationPermission().then(setNotifications).catch(() => undefined);
    try { setUsageOk(PlanimLock.hasUsageAccess()); setOverlayOk(PlanimLock.hasOverlayAccess()); setFsiOk(PlanimLock.canUseFullScreenIntent()); } catch { /* yoksay */ }
  }, []);
  useEffect(() => {
    refresh();
    const sub = AppState.addEventListener('change', (state) => { if (state === 'active') refresh(); });
    const timer = setInterval(refresh, 1500);
    return () => { sub.remove(); clearInterval(timer); };
  }, [refresh]);
  const missing: string[] = [];
  if (notifications !== 'granted') missing.push('Bildirimler');
  if (lockAvailable && !usageOk) missing.push('Kullanım erişimi');
  if (lockAvailable && !overlayOk) missing.push('Diğer uygulamaların üzerinde göster');
  return { notifications, setNotifications, usageOk, overlayOk, fsiOk, refresh, missing, requiredOk: missing.length === 0 };
}

export function PermissionsCard() {
  const colors = useColors();
  const { settings, updateSettings } = usePlanim();
  const { notifications, setNotifications, usageOk, overlayOk, fsiOk, missing } = usePermissionState();

  const askNotifications = async () => {
    const result = await requestNotificationPermission();
    setNotifications(result);
    if (result !== 'granted') Linking.openSettings();
  };

  const nextStep = async () => {
    if (notifications !== 'granted') return askNotifications();
    if (lockAvailable && !usageOk) return PlanimLock.openUsageAccessSettings();
    if (lockAvailable && !overlayOk) return PlanimLock.openOverlaySettings();
  };

  return <Card tone="lavender">
    {missing.length ? <Pressable onPress={nextStep} style={{ paddingVertical: 14, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center' }}><Text style={{ color: colors.primaryForeground, fontWeight: '800' }}>Sıradaki izni ver ({missing.length} eksik)</Text></Pressable> : <Text style={{ color: colors.success, fontWeight: '800', textAlign: 'center' }}>Gerekli tüm izinler tamam ✓</Text>}
    <Row icon="bell" title="Bildirimler" text="Ders başlayınca alarm ve ders öncesi hatırlatma için." status={notifications === 'granted' ? 'ok' : 'todo'} action="İzin ver" onPress={askNotifications} />
    {Platform.OS === 'android' ? <>
      {lockAvailable ? <>
        <Row icon="maximize" title="Tam ekran alarm" text="Ders alarmı kilitli ekranda bile tüm ekranı kaplasın." status={fsiOk ? 'ok' : 'todo'} action="Aç" onPress={() => PlanimLock.openFullScreenIntentSettings()} />
        <Row icon="eye" title="Kullanım erişimi" text="Ders sırasında hangi uygulamanın açık olduğunu görebilmek için. Mesaj veya içerik okunmaz. Açılan listede “Pusulam”ı bulup anahtarı aç." status={usageOk ? 'ok' : 'todo'} action="Aç" onPress={() => PlanimLock.openUsageAccessSettings()} />
        <Row icon="layers" title="Diğer uygulamaların üzerinde göster" text="Kilitli bir uygulama açılırsa üstüne kilit ekranını koymak için." status={overlayOk ? 'ok' : 'todo'} action="Aç" onPress={() => PlanimLock.openOverlaySettings()} />
      </> : <Row icon="clock" title="Tam zamanlı alarm" text='Açılan ekranda “Alarmlar ve hatırlatıcılar” iznini aç; ders tam saatinde çalsın.' action="Aç" onPress={() => Linking.openSettings()} />}
      <Row icon="battery-charging" title="Pil kısıtlaması yok" text='Uygulamayı “Kısıtlanmamış” yap; telefon arka planda alarmı ve kilidi engellemesin.' status={settings.batteryAsked ? 'ok' : 'todo'} action="Aç" onPress={() => { updateSettings({ batteryAsked: true }); Linking.sendIntent('android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS').catch(() => Linking.openSettings()); }} />
    </> : null}
    {Platform.OS === 'android' && lockAvailable && (!usageOk || !overlayOk) ? <View style={{ padding: 12, borderRadius: 14, backgroundColor: colors.warnSoft, gap: 6 }}>
      <Text style={{ color: colors.warning, fontWeight: '800', fontSize: 13 }}>Anahtar gri mi, açılmıyor mu?</Text>
      <Text style={{ color: colors.mutedForeground, fontSize: 12, lineHeight: 18 }}>Android, dışarıdan yüklenen uygulamalarda bu izinleri önce kapatır. Uygulama bilgisi ekranını aç, sağ üstteki ⋮ (üç nokta) simgesine dokun, “Kısıtlanmış ayarlara izin ver” de. Sonra izni tekrar aç.</Text>
      <Pressable onPress={() => Linking.openSettings()} style={{ alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: colors.primary }}><Text style={{ color: colors.primaryForeground, fontWeight: '800', fontSize: 12 }}>Uygulama bilgisini aç</Text></Pressable>
    </View> : null}
    <View style={{ height: 1, backgroundColor: colors.border }} />
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}>
        <Feather name="lock" size={18} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.foreground, fontWeight: '800', fontSize: 14 }}>Çalışma modu kilidi</Text>
        <Text style={{ color: colors.mutedForeground, fontSize: 12, lineHeight: 17, marginTop: 2 }}>Ders saatinde “Başladım” dediğinde seçtiğin uygulamalar ders bitene kadar açılmaz. Telefon, mesaj ve rehber her zaman açık kalır. Erken bitirmek için basılı tutman gerekir.</Text>
      </View>
      <Switch value={settings.studyLockEnabled} onValueChange={(value) => updateSettings({ studyLockEnabled: value })} trackColor={{ true: colors.primary }} />
    </View>
    <Text style={{ color: colors.mutedForeground, fontSize: 11, lineHeight: 16 }}>Hangi uygulamaların açık kalacağını Ayarlar → Kilitlenecek uygulamalar bölümünden seçersin; gerisi kilitlenir.</Text>
  </Card>;
}
