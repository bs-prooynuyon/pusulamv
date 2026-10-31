import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '@/components/Avatar';
import { BadgeDot } from '@/components/UserBadges';
import { usePlanim } from '@/context/PlanimContext';
import { useColors } from '@/hooks/useColors';
import { computeBadgeCategories, earnedBadgeIds } from '@/lib/badges';
import { cloudConfigured } from '@/lib/cloud';
import { subscribeIncoming } from '@/lib/friends';
import { useInbox } from '@/lib/inboxStore';
import { subscribeRoomInvites } from '@/lib/rooms';
import { minutesToday, streakDays } from '@/lib/stats';

/** Sayfa kaydırılsa ya da sekme değişse de üstte duran profil, seri ve günlük odak şeridi. */
export function TopBar({ transparent = false }: { transparent?: boolean }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { sessions, exams, wrongs, questionLogs, settings } = usePlanim();
  const [reqCount, setReqCount] = useState(0);
  const [roomCount, setRoomCount] = useState(0);
  const pending = reqCount + roomCount;
  // İsmin yanında seçtiğin rozetler (en fazla 3); hiç seçmediysen kazandıklarından ilk üçü. Öğretmende rozet yok.
  const chips = useMemo(() => {
    if (settings.role === 'teacher') return [] as string[];
    const earned = earnedBadgeIds(computeBadgeCategories({ sessions, exams, wrongs, questionLogs }));
    const pinned = (settings.pinnedBadges ?? []).filter((id) => earned.includes(id));
    return (pinned.length ? pinned : earned).slice(0, 3);
  }, [sessions, exams, wrongs, questionLogs, settings.pinnedBadges, settings.role]);
  const inbox = useInbox();
  useEffect(() => {
    if (!settings.signedIn || !cloudConfigured()) return undefined;
    let off: (() => void) | undefined; let off2: (() => void) | undefined; let alive = true;
    subscribeIncoming((list) => setReqCount(list.length)).then((u) => { if (alive) off = u; else u(); }).catch(() => undefined);
    subscribeRoomInvites((list) => setRoomCount(list.length)).then((u) => { if (alive) off2 = u; else u(); }).catch(() => undefined);
    return () => { alive = false; off?.(); off2?.(); };
  }, [settings.signedIn]);
  return <View style={{ paddingTop: insets.top + 8, paddingBottom: 10, paddingHorizontal: 18, backgroundColor: transparent ? 'transparent' : colors.background, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: transparent ? '#2a5a9a' : colors.border }}>
    <Pressable onPress={() => router.push('/profile' as never)}><Avatar size={38} /></Pressable>
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text style={{ color: colors.foreground, fontWeight: '800', fontSize: 14, flexShrink: 1 }} numberOfLines={1}>{settings.studentName || 'Pusulam'}</Text>
        {chips.map((id) => <BadgeDot key={id} id={id} size={16} />)}
      </View>
      <View style={{ flexDirection: 'row', gap: 14, marginTop: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Feather name="zap" size={13} color={colors.warning} /><Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: '700' }}>{streakDays(sessions)} gün seri</Text></View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Feather name="clock" size={13} color={colors.primary} /><Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: '700' }}>Bugün {minutesToday(sessions)} dk</Text></View>
      </View>
    </View>
    <Pressable onPress={() => router.push('/inbox' as never)} hitSlop={10} accessibilityLabel="Bildirimler"><Feather name="bell" size={20} color={colors.primary} />{inbox.unread > 0 ? <View style={{ position: 'absolute', top: -6, right: -8, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: colors.destructive, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 }}><Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>{inbox.unread > 9 ? '9+' : inbox.unread}</Text></View> : null}</Pressable>
    <Pressable onPress={() => router.push('/buddies' as never)} hitSlop={10}><Feather name="users" size={20} color={colors.primary} />{pending > 0 ? <View style={{ position: 'absolute', top: -6, right: -8, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: colors.destructive, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 }}><Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>{pending}</Text></View> : null}</Pressable>
    <Pressable onPress={() => router.push('/study-mode?minutes=45' as never)} hitSlop={10}><Feather name="lock" size={20} color={colors.primary} /></Pressable>
    <Pressable onPress={() => router.push('/settings')} hitSlop={10}><Feather name="settings" size={20} color={colors.mutedForeground} /></Pressable>
  </View>;
}
