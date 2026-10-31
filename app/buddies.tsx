import { Feather } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Alert, Pressable, Text, View } from 'react-native';
import { Card, Field, Header, PrimaryButton, Screen, SectionTitle } from '@/components/PlanimUI';
import { usePlanim } from '@/context/PlanimContext';
import { UserBadges } from '@/components/UserBadges';
import { useColors } from '@/hooks/useColors';
import { cloudConfigured } from '@/lib/cloud';
import { createRoom, RoomInvite, subscribeRoomInvites } from '@/lib/rooms';
import { acceptRequest, claimUsername, declineRequest, FriendRequest, myFriends, myProfile, Profile, publishWeekly, removeFriend, sendFriendRequest, subscribeIncoming, weekMinutesOf } from '@/lib/friends';

const fmt = (m: number) => (m >= 60 ? `${Math.floor(m / 60)} sa ${m % 60} dk` : `${m} dk`);

/** Kullanıcı adı, arkadaş istekleri ve arkadaşlar arasında haftalık çalışma sıralaması. */
export default function BuddiesScreen() {
  const colors = useColors();
  const { settings, sessions } = usePlanim();
  const [me, setMe] = useState<Profile | null>(null);
  const [friends, setFriends] = useState<Profile[]>([]);
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [roomInvites, setRoomInvites] = useState<RoomInvite[]>([]);
  const [uname, setUname] = useState('');
  const [target, setTarget] = useState('');
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const online = cloudConfigured() && settings.signedIn;
  const myMinutes = weekMinutesOf(sessions);

  const load = useCallback(async () => {
    if (!online) { setLoaded(true); return; }
    try {
      const p = await myProfile();
      setMe(p);
      if (p) { await publishWeekly(myMinutes).catch(() => undefined); setFriends(await myFriends()); }
    } catch (e) { Alert.alert('Yüklenemedi', e instanceof Error ? e.message : 'Tekrar dener misin?'); }
    setLoaded(true);
  }, [online, myMinutes]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!online) return undefined;
    let off: (() => void) | undefined; let alive = true;
    subscribeIncoming(setIncoming).then((u) => { if (alive) off = u; else u(); }).catch(() => undefined);
    return () => { alive = false; off?.(); };
  }, [online]);

  useEffect(() => {
    if (!online) return undefined;
    let off: (() => void) | undefined; let alive = true;
    subscribeRoomInvites(setRoomInvites).then((u) => { if (alive) off = u; else u(); }).catch(() => undefined);
    return () => { alive = false; off?.(); };
  }, [online]);

  const study = (roomId: string, host: boolean) => router.push(`/study-mode?minutes=45&room=${roomId}${host ? '&host=1' : ''}` as never);
  const invite = (p: Profile) => run(async () => { const id = await createRoom(p.uid, settings.studentName || me?.name || 'Arkadaşın'); study(id, true); });

  const run = async (fn: () => Promise<unknown>, ok?: string) => {
    setBusy(true);
    try { await fn(); if (ok) Alert.alert(ok); } catch (e) { Alert.alert('Olmadı', e instanceof Error ? e.message : 'Tekrar dener misin?'); } finally { setBusy(false); }
  };

  if (!online) return <Screen>
    <Header eyebrow="Birlikte daha güçlü" title="Arkadaşlar" subtitle="Kullanıcı adı seçmek ve arkadaş eklemek için hesapla giriş yapman gerekir." />
  </Screen>;

  const board = [{ uid: 'me', username: me?.username ?? '', name: 'Sen', weekMinutes: myMinutes }, ...friends].sort((a, b) => b.weekMinutes - a.weekMinutes);

  return <Screen>
    <Header eyebrow="Birlikte daha güçlü" title="Arkadaşlar" subtitle="Kullanıcı adınla arkadaş ekle, bu hafta kimin daha çok çalıştığını gör." />

    {!me && loaded ? <Card tone="lavender">
      <Text style={{ color: colors.foreground, fontWeight: '800' }}>Önce bir kullanıcı adı seç</Text>
      <Text style={{ color: colors.mutedForeground, fontSize: 13, lineHeight: 19 }}>Arkadaşların ve öğretmenin seni bu adla bulur. Küçük harf, rakam ve _ kullanabilirsin (3–20 karakter).</Text>
      <Field label="Kullanıcı adı" value={uname} onChangeText={setUname} placeholder="örn. elif_08" keyboardType="email" />
      <PrimaryButton label="Kullanıcı adını kaydet" icon="check" disabled={busy || !uname.trim()} onPress={() => run(async () => { await claimUsername(uname, settings.studentName); setUname(''); await load(); })} />
    </Card> : null}

    {me ? <>
      <Card>
        <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: '700' }}>KULLANICI ADIN</Text>
        <Text style={{ color: colors.foreground, fontSize: 20, fontWeight: '800' }}>@{me.username}</Text>
      </Card>

      {roomInvites.length ? <SectionTitle title="Çalışma odası daveti" /> : null}
      {roomInvites.map((r) => <Card key={r.id} tone="lavender">
        <Text style={{ color: colors.foreground, fontWeight: '800' }}>{r.host_name} seni birlikte çalışmaya çağırıyor</Text>
        <PrimaryButton label="Katıl ve çalışmaya başla" icon="book-open" onPress={() => study(r.id, false)} />
      </Card>)}

      {incoming.length ? <SectionTitle title="Gelen istekler" /> : null}
      {incoming.map((r) => <Card key={r.id} tone="pink">
        <Text style={{ color: colors.foreground, fontWeight: '800' }}>{r.from_name || r.from_username} (@{r.from_username}) sana arkadaşlık isteği gönderdi</Text>
        <PrimaryButton label="Kabul et" icon="check" disabled={busy} onPress={() => run(async () => { await acceptRequest(r); await load(); })} />
        <PrimaryButton label="Reddet" icon="x" secondary disabled={busy} onPress={() => run(() => declineRequest(r.id))} />
      </Card>)}

      <SectionTitle title="Arkadaş ekle" />
      <Card>
        <Field label="Arkadaşının kullanıcı adı" value={target} onChangeText={setTarget} placeholder="örn. ahmet_34" keyboardType="email" />
        <PrimaryButton label="İstek gönder" icon="user-plus" disabled={busy || !target.trim()} onPress={() => run(async () => { await sendFriendRequest(target, settings.studentName); setTarget(''); }, 'İstek gönderildi. Kabul edince arkadaş olursunuz.')} />
      </Card>

      <SectionTitle title="Bu haftanın sıralaması" />
      {friends.length === 0 ? <Text style={{ color: colors.mutedForeground }}>Henüz arkadaşın yok. Kullanıcı adıyla istek gönder; kabul edince sıralamada görünür.</Text> : null}
      <Card>
        {board.map((p, i) => <View key={p.uid} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 }}>
          <Text style={{ width: 24, color: i === 0 ? colors.warning : colors.mutedForeground, fontWeight: '800', fontSize: 16 }}>{i + 1}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.foreground, fontWeight: p.uid === 'me' ? '800' : '700' }}>{p.uid === 'me' ? 'Sen' : p.name || p.username}</Text>
            {p.uid !== 'me' && p.username ? <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>@{p.username}</Text> : null}
            {p.uid !== 'me' ? <UserBadges uid={p.uid} size={16} /> : null}
          </View>
          <Text style={{ color: colors.foreground, fontWeight: '800' }}>{fmt(p.weekMinutes)}</Text>
          {p.uid !== 'me' ? <Pressable hitSlop={8} disabled={busy} onPress={() => invite(p)}><Feather name="book-open" size={17} color={colors.primary} /></Pressable> : null}
          {p.uid !== 'me' ? <Pressable hitSlop={8} onPress={() => Alert.alert('Arkadaşlıktan çıkarılsın mı?', p.name || p.username, [{ text: 'Vazgeç', style: 'cancel' }, { text: 'Çıkar', style: 'destructive', onPress: () => run(async () => { await removeFriend(p.uid); await load(); }) }])}><Feather name="user-x" size={16} color={colors.mutedForeground} /></Pressable> : null}
        </View>)}
      </Card>
      <Text style={{ color: colors.mutedForeground, fontSize: 11, lineHeight: 16 }}>Kitap simgesi arkadaşınla birlikte çalışma odası açar. Sıralama pazartesiden başlar. Arkadaşların senin adını ve bu haftaki toplam çalışma süreni görür; başka bir şey görmezler.</Text>
    </> : null}
  </Screen>;
}
