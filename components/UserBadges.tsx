import { Feather } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { BADGE_INDEX } from '@/lib/badges';
import { fetchBadges, UserBadges as Data } from '@/lib/badgeCloud';

export function BadgeDot({ id, size = 18 }: { id: string; size?: number }) {
  const info = BADGE_INDEX[id];
  if (!info) return null;
  return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: info.color, alignItems: 'center', justifyContent: 'center' }}>
    <Feather name={info.icon as keyof typeof Feather.glyphMap} size={Math.round(size * 0.6)} color="#fff" />
  </View>;
}

/**
 * Bir kişinin adının yanında seçtiği rozetler (en fazla 3). Dokununca kazandığı tüm rozetler isimleriyle açılır.
 * Rozeti olmayan ya da öğretmen gibi hiç rozet yayınlamamış kişide hiçbir şey çizmez.
 */
export function UserBadges({ uid, size = 18, expandable = true }: { uid: string; size?: number; expandable?: boolean }) {
  const colors = useColors();
  const [data, setData] = useState<Data | null>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => { let alive = true; if (uid) fetchBadges(uid).then((d) => { if (alive) setData(d); }); return () => { alive = false; }; }, [uid]);
  if (!data || !data.earned.length) return null;
  const pinned = data.pinned.filter((id) => data.earned.includes(id) && BADGE_INDEX[id]).slice(0, 3);
  const chips = pinned.length ? pinned : [];
  return <View style={{ alignSelf: 'flex-start' }}>
    <Pressable disabled={!expandable} onPress={() => setOpen((v) => !v)} hitSlop={6} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      {chips.map((id) => <BadgeDot key={id} id={id} size={size} />)}
      <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: '800' }}>{chips.length ? '' : '🏅 '}{data.earned.length} rozet</Text>
    </Pressable>
    {open ? <View style={{ marginTop: 6, padding: 10, borderRadius: 12, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, gap: 6, minWidth: 200 }}>
      {data.earned.filter((id) => BADGE_INDEX[id]).map((id) => <View key={id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <BadgeDot id={id} size={22} />
        <View style={{ flex: 1 }}><Text style={{ color: colors.foreground, fontSize: 12, fontWeight: '800' }}>{BADGE_INDEX[id].title}</Text><Text style={{ color: colors.mutedForeground, fontSize: 11 }}>{BADGE_INDEX[id].desc}</Text></View>
      </View>)}
    </View> : null}
  </View>;
}
