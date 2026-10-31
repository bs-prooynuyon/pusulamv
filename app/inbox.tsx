import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Card, Header, PrimaryButton, Screen } from '@/components/PlanimUI';
import { usePlanim } from '@/context/PlanimContext';
import { useColors } from '@/hooks/useColors';
import { cloudConfigured } from '@/lib/cloud';
import { seenIds } from '@/lib/inbox';
import { markInboxSeen, refreshInbox, useInbox } from '@/lib/inboxStore';

const ICON = { 'report-request': 'file-text', 'class-invite': 'user-plus', 'report-approved': 'check-circle', 'report-declined': 'x-circle' } as const;

/** Bildirimler: öğrenci için rapor istekleri ve davetler, öğretmen için öğrencilerin cevapları. */
export default function InboxScreen() {
  const colors = useColors();
  const { settings } = usePlanim();
  const teacher = settings.role === 'teacher';
  const { items } = useInbox();
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const ready = settings.signedIn && cloudConfigured();

  const load = useCallback(async () => {
    if (!ready) return;
    try { setSeen(await seenIds()); await refreshInbox(teacher ? 'teacher' : 'student', false); } catch { /* çevrimdışı */ }
  }, [ready, teacher]);
  // Açılışta görülmemişleri hatırla (yeni rozeti), sonra hepsini görüldü say.
  useEffect(() => { load().then(() => markInboxSeen().catch(() => undefined)); }, [load]);

  if (!ready) return <Screen><Header eyebrow="Bildirimler" title="Bildirimler" /><Card><Text style={{ color: colors.foreground, lineHeight: 21 }}>Bildirimleri görmek için hesabınla giriş yapman gerekiyor.</Text></Card></Screen>;

  return <Screen>
    <Header eyebrow="Bildirimler" title="Bildirimler" subtitle={teacher ? 'Öğrencilerinin rapor cevapları burada görünür.' : 'Öğretmeninin rapor istekleri ve sınıf davetleri burada görünür.'} />
    {items.length === 0 ? <Card><Text style={{ color: colors.mutedForeground, lineHeight: 21 }}>{teacher ? 'Henüz cevap yok. Sınıf sohbetinden “Rapor iste (tüm sınıf)” ile öğrencilerinden haftalık rapor isteyebilirsin.' : 'Şu an bekleyen bir şey yok.'}</Text></Card> : null}
    {items.map((i) => {
      const isNew = i.actionable || !seen.has(i.id);
      return <Pressable key={i.id} onPress={() => router.push(i.href as never)}>
        <Card tone={i.actionable ? 'pink' : 'card'}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Feather name={ICON[i.kind]} size={22} color={i.kind === 'report-declined' ? colors.destructive : colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.foreground, fontWeight: '800', fontSize: 14 }}>{i.title}</Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 12, lineHeight: 18, marginTop: 2 }}>{i.body}</Text>
            </View>
            {isNew ? <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: colors.destructive }} /> : null}
          </View>
          {i.actionable ? <PrimaryButton label={i.kind === 'report-request' ? 'Cevapla' : 'Aç'} icon="arrow-right" onPress={() => router.push(i.href as never)} /> : null}
        </Card>
      </Pressable>;
    })}
    <Pressable onPress={() => router.back()}><Text style={{ color: colors.primary, fontWeight: '700', textAlign: 'center' }}>Geri dön</Text></Pressable>
  </Screen>;
}
