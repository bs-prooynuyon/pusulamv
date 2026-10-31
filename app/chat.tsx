import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, Share, Text, View } from 'react-native';
import { Card, Field, PrimaryButton, Screen, Header, styles } from '@/components/PlanimUI';
import { TermsText } from '@/components/Consent';
import { usePlanim } from '@/context/PlanimContext';
import { useColors } from '@/hooks/useColors';
import { acceptInvite, BlockRow, createClassGroup, createGroup, ensureClassGroups, Group, groupMembers, joinByCode, joinSchoolGroup, KIND_LABEL, myBlocks, myGroups, schoolKey, syncClassGroups, syncRole, unblockUser } from '@/lib/chat';
import { answerRequest, InviteRow, myInvites, myRequests, removeInvite, ReportSummary, RequestRow } from '@/lib/classes';
import { cloudConfigured, getUserId } from '@/lib/cloud';
import { examTotal } from '@/lib/lgs';

const PALETTE = ['#2f6fd0', '#7a4fd0', '#1f9d74', '#d0782f', '#c24b7a'];
const colorOf = (name: string) => PALETTE[[...name].reduce((n, c) => n + c.charCodeAt(0), 0) % PALETTE.length];
type Tab = 'all' | Group['kind'];
const TAB_LABEL: [Tab, string][] = [['all', 'Tümü'], ['school', 'Okul'], ['class', 'Sınıf'], ['student', 'Gruplar'], ['dm', 'Birebir']];

/**
 * Sohbet: Okul, Sınıf, Öğrenci grupları ve Birebir sohbetler ayrı bölümlerde.
 * Sınıf da burada: öğretmen sınıf kurunca sohbet grubu da kurulur; öğrenci kodla girince sınıftaki herkes üyeler listesinde görünür ve yazışılır.
 * Öğretmen daveti, rapor isteği ve öğrenci sayfası (program, rapor) sınıf sohbetinin içinden açılır.
 */
export default function ChatScreen() {
  const colors = useColors();
  const { settings, updateSettings, sessions, exams, questionLogs } = usePlanim();
  const teacher = settings.role === 'teacher';
  const me = settings.studentName || (teacher ? 'Öğretmen' : 'Öğrenci');
  const ready = cloudConfigured() && settings.signedIn;
  const [groups, setGroups] = useState<Group[]>([]);
  const [dmNames, setDmNames] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [blocks, setBlocks] = useState<BlockRow[]>([]);
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [tab, setTab] = useState<Tab>('all');
  const [creating, setCreating] = useState(false);
  const hasSchool = !!(settings.schoolCity && settings.schoolName);

  const load = useCallback(async () => {
    if (!ready || !settings.chatRulesAccepted) return;
    try {
      await syncRole(settings.role || 'student', me);
      // Eski sürümde kurulmuş / katılınmış sınıfların sohbet grubunu tamamla.
      if (teacher) await ensureClassGroups(me); else await syncClassGroups(me);
      const list = await myGroups();
      setGroups(list);
      setBlocks(await myBlocks());
      if (!teacher) { setInvites(await myInvites().catch(() => [] as InviteRow[])); setRequests(await myRequests().catch(() => [] as RequestRow[])); }
      // Birebir sohbetin başlığı karşıdaki kişinin adıdır.
      const uid = await getUserId();
      const names: Record<string, string> = {};
      await Promise.all(list.filter((g) => g.kind === 'dm').map(async (g) => {
        try { const other = (await groupMembers(g.id)).find((m) => m.user_id !== uid); if (other) names[g.id] = other.user_name; } catch { /* yoksay */ }
      }));
      setDmNames(names);
    } catch (e) { Alert.alert('Yüklenemedi', e instanceof Error ? e.message : 'Tekrar dener misin?'); }
  }, [ready, settings.chatRulesAccepted, settings.role, me, teacher]);
  useEffect(() => { load(); }, [load]);

  const run = async (fn: () => Promise<unknown>) => { setBusy(true); try { await fn(); await load(); } catch (e) { Alert.alert('Olmadı', e instanceof Error ? e.message : 'Tekrar dener misin?'); } finally { setBusy(false); } };
  const titleOf = (g: Group) => g.kind === 'dm' ? (dmNames[g.id] ? `${dmNames[g.id]} ile sohbet` : 'Birebir sohbet (arkadaşın bekleniyor)') : g.name;
  const open = (g: Group) => router.push(`/chat-room?id=${g.id}&name=${encodeURIComponent(titleOf(g))}&kind=${g.kind}&owner=${g.owner_id ?? ''}&code=${g.code ?? ''}` as never);
  const pending = requests.filter((r) => r.status === 'pending' && r.student_id !== r.teacher_id);
  /** Öğrencinin, öğretmenin istediği tarih aralığı için hazırlanan rapor özeti. Yalnızca öğrenci onaylarsa gider. */
  const buildReport = (r: RequestRow): ReportSummary => {
    const inRange = (d: string) => d.slice(0, 10) >= r.from_date && d.slice(0, 10) <= r.to_date;
    const ex = exams.filter((e) => inRange(e.date));
    const logs = questionLogs.filter((l) => inRange(l.date));
    return {
      studentName: settings.studentName,
      focusMinutes: sessions.filter((s) => inRange(s.date)).reduce((a, s) => a + s.durationMinutes, 0),
      examCount: ex.length,
      avgNet: ex.length ? ex.reduce((a, e) => a + examTotal(e.results), 0) / ex.length : 0,
      solved: logs.reduce((a, l) => a + l.solved, 0), correct: logs.reduce((a, l) => a + l.correct, 0), wrong: logs.reduce((a, l) => a + l.wrong, 0),
    };
  };
  const back = <Pressable onPress={() => router.back()}><Text style={{ color: colors.primary, fontWeight: '700', textAlign: 'center' }}>Geri dön</Text></Pressable>;

  if (!ready) return <Screen><Header eyebrow="Sohbet" title="Sohbet" /><Card><Text style={{ color: colors.foreground, lineHeight: 21 }}>Sohbet için hesabınla giriş yapman gerekiyor. Ayarlar’dan giriş yapıp tekrar dene.</Text></Card>{back}</Screen>;
  if (!settings.chatRulesAccepted) return <Screen><Header eyebrow="Sohbet" title="Sohbet kuralları" subtitle="Sohbete girmeden önce kuralları kabul etmelisin." /><TermsText /><PrimaryButton label="Kuralları kabul ediyorum" icon="check" onPress={() => updateSettings({ chatRulesAccepted: true })} />{back}</Screen>;

  const of = (kind: Group['kind']) => groups.filter((g) => g.kind === kind);
  const section = (label: string, kind: Group['kind'], empty: string) => {
    if (tab !== 'all' && tab !== kind) return null;
    const list = of(kind);
    return <View key={kind} style={{ gap: 8 }}>
      <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: '800', letterSpacing: 1.4, marginLeft: 2 }}>{label}</Text>
      {list.length === 0 ? <Text style={{ color: colors.mutedForeground, fontSize: 13, marginLeft: 2 }}>{empty}</Text> : <Card style={{ paddingVertical: 2, paddingHorizontal: 16, gap: 0 }}>
        {list.map((g, i) => { const title = titleOf(g); return <Pressable key={g.id} onPress={() => open(g)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.border }}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colorOf(title), alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontSize: 19, fontWeight: '800' }}>{(title.trim()[0] ?? '?').toLocaleUpperCase('tr')}</Text></View>
          <View style={{ flex: 1, minWidth: 0 }}><Text numberOfLines={1} style={{ color: colors.foreground, fontWeight: '800', fontSize: 15 }}>{title}</Text><Text numberOfLines={1} style={{ color: colors.mutedForeground, fontSize: 13, marginTop: 3 }}>{KIND_LABEL[g.kind]}{g.code && g.owner_id ? ` · kod ${g.code}` : ''}</Text></View>
          <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
        </Pressable>; })}
      </Card>}
    </View>;
  };

  const startDm = () => run(async () => {
    const gid = await createGroup(me, me, 'dm');
    const mine = (await myGroups()).find((g) => g.id === gid);
    const c = mine?.code ?? '';
    Alert.alert('Birebir sohbet hazır', `Arkadaşına bu kodu ver: ${c}\n\nO, “Koda katıl” bölümüne yazınca sohbet başlar.`, [{ text: 'Kodu paylaş', onPress: () => Share.share({ message: `Pusulam’da benimle birebir sohbet için kod: ${c}` }).catch(() => undefined) }, { text: 'Tamam' }]);
  });

  const tabs = TAB_LABEL.filter(([k]) => !teacher || k === 'all' || k === 'school' || k === 'class');
  return <Screen>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <View><Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: '800', letterSpacing: 1.6 }}>SOHBET</Text><Text style={[styles.title, { color: colors.foreground, fontSize: 32, lineHeight: 36, marginTop: 6 }]}>Sohbet</Text></View>
      <Pressable accessibilityLabel="Yeni sohbet" onPress={() => setCreating((v) => !v)} style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}><Feather name={creating ? 'x' : 'plus'} size={22} color={colors.primaryForeground} /></Pressable>
    </View>
    <View style={{ flexDirection: 'row', backgroundColor: colors.muted, borderRadius: 14, padding: 3, gap: 2 }}>
      {tabs.map(([key, label]) => <Pressable key={key} onPress={() => setTab(key)} style={{ flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 11, backgroundColor: tab === key ? colors.primary : 'transparent' }}><Text style={{ fontSize: 13, fontWeight: tab === key ? '800' : '700', color: tab === key ? colors.primaryForeground : colors.mutedForeground }}>{label}</Text></Pressable>)}
    </View>

    {invites.map((i) => <Card key={i.id} tone="lavender"><Text style={{ color: colors.foreground, fontWeight: '800' }}>{i.teacher_name} seni sınıfına davet etti</Text><Text style={{ color: colors.mutedForeground, fontSize: 13, lineHeight: 19 }}>{i.class_name}. Kabul edersen sınıf sohbetine girersin, öğretmenin sana yazabilir ve rapor isteyebilir. Rapor yine yalnızca senin onayınla gider.</Text>
      <PrimaryButton label="Kabul et" icon="check" disabled={busy} onPress={() => run(() => acceptInvite(i, me))} />
      <PrimaryButton label="Reddet" icon="x" secondary disabled={busy} onPress={() => run(() => removeInvite(i.id))} /></Card>)}
    {pending.map((r) => <Card key={r.id} tone="pink"><Text style={{ color: colors.foreground, fontWeight: '800' }}>Öğretmenin rapor istiyor</Text><Text style={{ color: colors.mutedForeground, fontSize: 13, lineHeight: 19 }}>{r.from_date} – {r.to_date} arası odak süren, denemelerin ve çözdüğün sorular paylaşılacak.</Text>
      <PrimaryButton label="Onayla ve gönder" icon="check" disabled={busy} onPress={() => run(() => answerRequest(r.id, 'approved', buildReport(r)))} />
      <PrimaryButton label="Reddet" icon="x" secondary disabled={busy} onPress={() => run(() => answerRequest(r.id, 'declined', null))} /></Card>)}

    {creating ? (teacher
      ? <Card><Field label="Yeni sınıf" value={name} onChangeText={setName} placeholder="Örn. 8-A LGS" /><Text style={{ color: colors.mutedForeground, fontSize: 12, lineHeight: 17 }}>Sınıf kurulunca sohbet grubu da hazır olur. Öğrenciler aynı kodla hem sınıfa hem sohbete girer.</Text><PrimaryButton label="Sınıf kur" icon="plus" disabled={busy || !name.trim()} onPress={() => run(async () => { await createClassGroup(name.trim(), me); setName(''); setCreating(false); })} /></Card>
      : <Card><Field label="Yeni öğrenci grubu" value={name} onChangeText={setName} placeholder="Örn. Matematik çalışma" /><PrimaryButton label="Grup kur" icon="plus" disabled={busy || !name.trim()} onPress={() => run(async () => { await createGroup(name.trim(), me); setName(''); setCreating(false); })} /><PrimaryButton label="Birebir sohbet başlat" icon="user-plus" secondary disabled={busy} onPress={() => { setCreating(false); startDm(); }} /></Card>) : null}

    {section('OKUL GRUBU', 'school', hasSchool ? 'Okul grubuna henüz girmedin.' : 'Okul grubu için Ayarlar’dan okulunu seç.')}
    {(tab === 'all' || tab === 'school') && hasSchool && of('school').length === 0 ? <PrimaryButton label={`${settings.schoolName} grubuna gir`} icon="home" disabled={busy} onPress={() => run(() => joinSchoolGroup(schoolKey(settings.schoolCity, settings.schoolDistrict, settings.schoolName), `${settings.schoolName} (${settings.schoolDistrict || settings.schoolCity})`, me))} /> : null}
    {section('SINIFLAR', 'class', teacher ? 'Henüz sınıf kurmadın. Sağ üstteki + ile kur; sınıfa dokununca öğrencilerini görür, onlara yazarsın.' : 'Öğretmeninin verdiği kodla katıl; sınıf arkadaşların ve öğretmenin burada görünür.')}
    {!teacher ? <>
      {section('ÖĞRENCİ GRUPLARI', 'student', 'Arkadaşlarınla çalışma grubu kurabilirsin (sağ üstteki +).')}
      {section('BİREBİR SOHBETLER', 'dm', 'Bir arkadaşınla ikiniz arasında özel sohbet başlatabilirsin (sağ üstteki +).')}
    </> : null}

    <Card><Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '800' }}>Koda katıl</Text><Text style={{ color: colors.mutedForeground, fontSize: 13, marginTop: -6 }}>Öğretmeninin ya da arkadaşının verdiği kodla sınıfa ya da gruba katıl.</Text><View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-end' }}><View style={{ flex: 1 }}><Field label="" value={code} onChangeText={(v) => setCode(v.toUpperCase())} placeholder="6 haneli kod" /></View><View style={{ width: 96 }}><PrimaryButton label="Katıl" disabled={busy || code.trim().length < 4} onPress={() => run(async () => { await joinByCode(code, me); setCode(''); })} /></View></View></Card>

    {teacher ? <Card tone="lavender"><Text style={{ color: colors.foreground, fontWeight: '800' }}>Öğrencilerle yazışma ve takip</Text><Text style={{ color: colors.mutedForeground, fontSize: 13, lineHeight: 19 }}>Bir sınıfı aç, üstteki kişi simgesine dokun. Öğrenci davet edebilir, öğrencinin üstüne dokunup özel mesaj yazabilir, rapor isteyebilir ve program gönderebilirsin.</Text></Card> : null}

    {blocks.length ? <Card><Text style={{ color: colors.foreground, fontWeight: '800' }}>Engellediklerim</Text>{blocks.map((b) => <View key={b.blocked_id} style={{ flexDirection: 'row', alignItems: 'center' }}><Text style={{ flex: 1, color: colors.foreground }}>{b.blocked_name || 'Kullanıcı'}</Text><Pressable onPress={() => run(async () => { await unblockUser(await getUserId(), b.blocked_id); })}><Text style={{ color: colors.primary, fontWeight: '800', fontSize: 12 }}>Engeli kaldır</Text></Pressable></View>)}</Card> : null}
    {back}
  </Screen>;
}
