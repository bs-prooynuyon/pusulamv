import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Field, PrimaryButton } from '@/components/PlanimUI';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlanim } from '@/context/PlanimContext';
import { UserBadges } from '@/components/UserBadges';
import { useColors } from '@/hooks/useColors';
import { blockUser, deleteMessage, GMember, groupMembers, groupReports, leaveGroup, myBlocks, Msg, REPORT_REASONS, reportMessage, ReportRow, sendMessage, subscribeMessages } from '@/lib/chat';
import { InviteRow, inviteStudent, removeInvite, requestReport, sentInvites } from '@/lib/classes';
import { getUserId } from '@/lib/cloud';

const PALETTE = ['#2f6fd0', '#7a4fd0', '#1f9d74', '#d0782f', '#c24b7a'];
const colorOf = (name: string) => PALETTE[[...name].reduce((n, c) => n + c.charCodeAt(0), 0) % PALETTE.length];
/** WhatsApp benzeri renkler (açık / koyu tema). */
const WA = {
  light: { bg: '#efeae2', header: '#008069', out: '#d9fdd3', inc: '#ffffff', text: '#111b21', time: '#667781', input: '#ffffff', chip: '#ffffffcc', chipText: '#54656f' },
  dark: { bg: '#0b141a', header: '#202c33', out: '#005c4b', inc: '#202c33', text: '#e9edef', time: '#8696a0', input: '#202c33', chip: '#182229', chipText: '#8696a0' },
};
const SEND = '#00a884';
const NAME_COLORS = ['#c0392b', '#d35400', '#8e44ad', '#16a085', '#2980b9', '#b7950b', '#c2185b', '#00897b'];
const nameColor = (name: string) => NAME_COLORS[[...name].reduce((n, c) => n + c.charCodeAt(0), 0) % NAME_COLORS.length];
const dayLabel = (iso: string) => {
  const d = new Date(iso); const t = new Date();
  if (d.toDateString() === t.toDateString()) return 'Bugün';
  const y = new Date(t.getTime() - 86400000);
  return d.toDateString() === y.toDateString() ? 'Dün' : d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
};

const isoDay = (d: Date) => d.toISOString().slice(0, 10);

/**
 * Grup sohbeti. Mesajlar canlı gelir (Firestore dinleme).
 * Sınıf sohbetinde üyeler listesi sınıf paneline dönüşür: öğretmen öğrenci davet eder, öğrencinin sayfasını açar, rapor ister;
 * öğrenci sınıftakileri görür ve öğretmenine özel yazar.
 */
export default function ChatRoomScreen() {
  const colors = useColors();
  const wa = colors.isDark ? WA.dark : WA.light;
  const insets = useSafeAreaInsets();
  const { settings } = usePlanim();
  const { id, name, kind, owner, code } = useLocalSearchParams<{ id: string; name?: string; kind?: string; owner?: string; code?: string }>();
  const me = settings.studentName || 'Ben';
  const [messages, setMessages] = useState<Msg[]>([]);
  const [myId, setMyId] = useState('');
  const [text, setText] = useState('');
  const [members, setMembers] = useState<GMember[] | null>(null);
  const [sending, setSending] = useState(false);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loadError, setLoadError] = useState('');
  const [blocked, setBlocked] = useState<string[]>([]);
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [inviteTo, setInviteTo] = useState('');
  const [busy, setBusy] = useState(false);
  const isClass = kind === 'class';
  const isOwner = !!owner && owner === myId;
  const scroller = useRef<ScrollView>(null);
  const last = useRef('');

  const loadBlocks = useCallback(async () => { try { setBlocked((await myBlocks()).map((b) => b.blocked_id)); } catch { /* çevrimdışı */ } }, []);
  useEffect(() => {
    let alive = true;
    getUserId().then((uid) => { if (alive) setMyId(uid); }).catch(() => undefined);
    loadBlocks();
    const stop = subscribeMessages(id, (list) => { if (alive) { setMessages(list); setLoadError(''); } }, (e) => { if (alive) setLoadError(String((e as { code?: string })?.code ?? 'hata')); });
    return () => { alive = false; stop(); };
  }, [id, loadBlocks]);
  useEffect(() => { const newest = messages[messages.length - 1]?.id ?? ''; if (newest !== last.current) { last.current = newest; setTimeout(() => scroller.current?.scrollToEnd({ animated: true }), 50); } }, [messages]);

  const send = async () => {
    const body = text.trim();
    if (!body || !myId) return;
    setSending(true);
    try { await sendMessage(id, myId, me, body); setText(''); } catch (e) { Alert.alert('Gönderilemedi', e instanceof Error ? e.message : 'Tekrar dener misin?'); } finally { setSending(false); }
  };
  /** Silme yetkisi: herkes kendi mesajını siler; sınıf grubunda ayrıca öğretmen (grubu kuran) herkesinkini siler. */
  const canDelete = (m: Msg) => m.sender_id === myId || (isClass && isOwner);
  const remove = (m: Msg) => Alert.alert('Mesaj silinsin mi?', m.sender_id === myId ? undefined : 'Bu mesaj herkes için silinir.', [{ text: 'Vazgeç', style: 'cancel' }, { text: 'Sil', style: 'destructive', onPress: () => deleteMessage(m).catch(() => Alert.alert('Silinemedi', 'Bu mesajı silme yetkin yok.')) }]);
  /** Mesaja basılı tutunca: şikayet et / engelle (başkasının mesajı), sil (kendi mesajın ya da sınıfta öğretmensen). */
  const menu = (m: Msg) => {
    const buttons: { text: string; style?: 'default' | 'cancel' | 'destructive'; onPress?: () => void }[] = [];
    if (m.sender_id !== myId) buttons.push({ text: 'Şikayet et', onPress: () => Alert.alert('Neden şikayet ediyorsun?', 'Şikayet grubu kuran kişiye ve uygulama yöneticisine iletilir.', [...REPORT_REASONS.map((reason) => ({ text: reason, onPress: () => reportMessage(m, myId, reason, name ?? '').then(() => Alert.alert('Şikayetin iletildi', 'Teşekkürler, inceleyeceğiz.')).catch(() => Alert.alert('Gönderilemedi', 'Tekrar dener misin?')) })), { text: 'Vazgeç', style: 'cancel' as const }]) });
    if (m.sender_id !== myId) buttons.push({ text: 'Kullanıcıyı engelle', style: 'destructive', onPress: () => Alert.alert(`${m.sender_name} engellensin mi?`, 'Bu kişinin mesajlarını artık görmezsin. Engelleri Sohbet grupları ekranından kaldırabilirsin.', [{ text: 'Engelle', style: 'destructive', onPress: () => blockUser(myId, m.sender_id, m.sender_name).then(() => setBlocked((b) => [...b, m.sender_id])).catch(() => Alert.alert('Engellenemedi', 'Tekrar dener misin?')) }, { text: 'Vazgeç', style: 'cancel' }]) });
    if (canDelete(m)) buttons.push({ text: 'Mesajı sil', style: 'destructive', onPress: () => remove(m) });
    buttons.push({ text: 'Vazgeç', style: 'cancel' });
    Alert.alert('Mesaj', m.body.length > 80 ? `${m.body.slice(0, 80)}…` : m.body, buttons);
  };
  const showMembers = async () => {
    if (!members) { groupReports(id).then(setReports).catch(() => setReports([])); if (isClass && owner === myId) sentInvites().then((list) => setInvites(list.filter((i) => i.class_id === id))).catch(() => setInvites([])); } try { setMembers(members ? null : await groupMembers(id)); } catch { Alert.alert('Üyeler yüklenemedi'); } };
  const kickOrLeave = (m: GMember) => Alert.alert(m.user_id === myId ? 'Gruptan ayrılınsın mı?' : `${m.user_name} gruptan çıkarılsın mı?`, undefined, [{ text: 'Vazgeç', style: 'cancel' }, { text: m.user_id === myId ? 'Ayrıl' : 'Çıkar', style: 'destructive', onPress: () => leaveGroup(id, m.user_id, isClass ? 'class' : undefined).then(() => (m.user_id === myId ? router.back() : showMembers())).catch(() => Alert.alert('Olmadı', 'Bu işlem için yetkin yok.')) }]);

  const kindText = kind === 'school' ? 'Okul grubu' : kind === 'class' ? 'Sınıf grubu' : kind === 'dm' ? 'Birebir sohbet' : 'Öğrenci grubu';
  return <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: wa.bg }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingBottom: 10, paddingTop: insets.top + 10, backgroundColor: wa.header }}>
      <Pressable onPress={() => router.back()} hitSlop={10}><Feather name="arrow-left" size={22} color="#fff" /></Pressable>
      <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: colorOf(String(name ?? '')), alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>{(String(name ?? '').trim()[0] ?? '?').toLocaleUpperCase('tr')}</Text></View>
      <View style={{ flex: 1 }}><Text numberOfLines={1} style={{ color: '#fff', fontWeight: '700', fontSize: 17 }}>{name}</Text><Text style={{ color: '#ffffffb3', fontSize: 12 }}>{kindText}</Text></View>
      {isClass ? <Pressable onPress={() => router.push(`/tasks?gid=${id}&name=${encodeURIComponent(String(name ?? ''))}&owner=${isOwner ? 1 : 0}` as never)} hitSlop={10}><Feather name="clipboard" size={20} color="#fff" /></Pressable> : null}
      <Pressable onPress={showMembers} hitSlop={10}><Feather name="users" size={20} color="#fff" /></Pressable>
    </View>
    {members ? <View style={{ padding: 14, gap: 8, backgroundColor: colors.muted, maxHeight: 360 }}>
      <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
        {isClass ? <Text style={{ color: colors.mutedForeground, fontSize: 12, lineHeight: 17, marginBottom: 6 }}>{isOwner ? `Sınıf kodu: ${code ?? ''}. Öğrencinin adına dokun: özel mesaj, rapor ve program.` : 'Sınıftakiler. Öğretmenine özel yazmak ya da program istemek için onun adına dokun.'}</Text> : null}
        {members.map((m) => {
          const self = m.user_id === myId;
          const teacherRow = !!owner && m.user_id === owner;
          // Çıkarma yalnızca grubu kuran içindir; kurucu kendi sınıfından ayrılamaz.
          const action = self ? (isOwner && isClass ? '' : 'Ayrıl') : (isOwner ? 'Çıkar' : '');
          const openThread = isClass && ((isOwner && !self) || (!isOwner && teacherRow));
          const roleText = teacherRow || m.role === 'teacher' ? 'öğretmen' : m.role === 'student' || (isClass && owner) ? 'öğrenci' : '';
          const label = `${m.user_name}${self ? ' (sen)' : ''}${roleText ? ` · ${roleText}` : ''}`;
          return <View key={m.user_id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: 10 }}>
            {openThread
              ? <Pressable style={{ flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }} onPress={() => router.push(`/member?classId=${id}${isOwner ? `&studentId=${m.user_id}` : ''}&name=${encodeURIComponent(isOwner ? m.user_name : 'Öğretmenin')}` as never)}><Text style={{ color: colors.primary, fontWeight: '800' }}>{label}</Text><Feather name="chevron-right" size={14} color={colors.primary} /></Pressable>
              : <Text style={{ flexShrink: 1, color: colors.foreground, fontWeight: '700' }}>{label}</Text>}
            <View style={{ flex: 1 }}><UserBadges uid={m.user_id} /></View>
            {action ? <Pressable onPress={() => kickOrLeave(m)}><Text style={{ color: colors.destructive, fontSize: 12, fontWeight: '800' }}>{action}</Text></Pressable> : null}
          </View>;
        })}
        {isClass && isOwner ? <View style={{ gap: 8, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, marginTop: 6 }}>
          <Field label="Öğrenci davet et (kullanıcı adı)" value={inviteTo} onChangeText={setInviteTo} placeholder="kullanici_adi" />
          <PrimaryButton label="Davet gönder" icon="user-plus" secondary disabled={busy || !inviteTo.trim()} onPress={async () => {
            setBusy(true);
            try { await inviteStudent({ id, name: String(name ?? ''), code: String(code ?? ''), teacher_id: myId }, inviteTo, me); setInviteTo(''); setInvites(((await sentInvites()) ?? []).filter((i) => i.class_id === id)); Alert.alert('Davet gönderildi', 'Öğrenci uygulamayı açınca Sohbet ekranında görüp kabul edebilir.'); }
            catch (e) { Alert.alert('Olmadı', e instanceof Error ? e.message : 'Tekrar dener misin?'); } finally { setBusy(false); }
          }} />
          {invites.map((i) => <View key={i.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Text style={{ flex: 1, color: colors.mutedForeground, fontSize: 12 }}>Bekliyor: {i.target}</Text><Pressable hitSlop={8} onPress={() => removeInvite(i.id).then(() => setInvites((cur) => cur.filter((x) => x.id !== i.id))).catch(() => Alert.alert('Silinemedi'))}><Feather name="x" size={16} color={colors.mutedForeground} /></Pressable></View>)}
          <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: '700' }}>Rapor iste (tüm sınıf)</Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 12, lineHeight: 17 }}>Rapor, öğrencinin kendi onayıyla gelir. Tek bir öğrenci için adına dokunup aralığı seçebilirsin.</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>{[7, 14, 30].map((d) => <View key={d} style={{ flex: 1 }}><PrimaryButton label={`Son ${d} gün`} secondary disabled={busy || members.length < 2} onPress={() => Alert.alert('Rapor istensin mi?', `Sınıftaki her öğrenciye son ${d} günün raporu için istek gider.`, [{ text: 'Vazgeç', style: 'cancel' }, { text: 'İste', onPress: async () => {
            setBusy(true);
            try { const res = await Promise.allSettled(members.filter((m) => m.user_id !== myId).map((m) => requestReport(id, m.user_id, isoDay(new Date(Date.now() - (d - 1) * 86400000)), isoDay(new Date())))); const ok = res.filter((r) => r.status === 'fulfilled').length; Alert.alert(ok ? 'İstekler gönderildi' : 'İstek gönderilemedi', ok ? `${ok} öğrenciye gitti. Onaylayanların raporu, öğrencinin sayfasında görünür.${ok < res.length ? ' Bazı öğrenciler sınıf kaydında olmadığı için atlandı.' : ''}` : 'Öğrenciler sınıf kaydında görünmüyor. Öğrenci sınıf koduyla yeniden katılmalı.'); }
            catch (e) { Alert.alert('Olmadı', e instanceof Error ? e.message : 'Tekrar dener misin?'); } finally { setBusy(false); }
          } }])} /></View>)}</View>
        </View> : null}
      </ScrollView>
      {reports.length ? <View style={{ gap: 6, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8 }}><Text style={{ color: colors.destructive, fontWeight: '800', fontSize: 12 }}>ŞİKAYETLER ({reports.length})</Text>{reports.slice(0, 5).map((r) => <Text key={r.id} style={{ color: colors.foreground, fontSize: 12, lineHeight: 17 }}>{r.sender_name}: “{r.body}” — {r.reason}</Text>)}</View> : null}
    </View> : null}
    <ScrollView ref={scroller} contentContainerStyle={{ paddingHorizontal: 10, paddingVertical: 12, gap: 2 }} keyboardShouldPersistTaps="handled">
      {loadError ? <Text style={{ color: colors.destructive, textAlign: 'center', fontWeight: '700' }}>Mesajlar yüklenemedi ({loadError}). Üyeliğini ya da internetini kontrol et.</Text> : null}
      {messages.length === 0 ? <Text style={{ alignSelf: 'center', color: wa.chipText, backgroundColor: wa.chip, paddingVertical: 6, paddingHorizontal: 14, borderRadius: 10, overflow: 'hidden', marginTop: 30 }}>Henüz mesaj yok. İlk mesajı sen yaz.</Text> : null}
      {messages.filter((m) => !blocked.includes(m.sender_id)).map((m, i, list) => {
        const mine = m.sender_id === myId;
        const time = new Date(m.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        const showDay = i === 0 || dayLabel(list[i - 1].created_at) !== dayLabel(m.created_at);
        // Aynı kişinin art arda mesajları tek blok olur: ad ve avatar yalnızca ilkinde görünür.
        const first = showDay || list[i - 1].sender_id !== m.sender_id;
        const showName = !mine && first && kind !== 'dm';
        const corner = first ? 2 : 12;
        return <View key={m.id}>
          {showDay ? <Text style={{ alignSelf: 'center', color: wa.chipText, fontSize: 12, backgroundColor: wa.chip, paddingVertical: 4, paddingHorizontal: 12, borderRadius: 8, overflow: 'hidden', marginVertical: 8 }}>{dayLabel(m.created_at)}</Text> : null}
          <View style={{ flexDirection: 'row', justifyContent: mine ? 'flex-end' : 'flex-start', gap: 6, marginTop: first ? 6 : 0 }}>
            {!mine && kind !== 'dm' ? (first
              ? <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colorOf(m.sender_name), alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>{(m.sender_name.trim()[0] ?? '?').toLocaleUpperCase('tr')}</Text></View>
              : <View style={{ width: 28 }} />) : null}
            <Pressable onLongPress={() => menu(m)} delayLongPress={250} style={{ maxWidth: '80%', backgroundColor: mine ? wa.out : wa.inc, paddingTop: 6, paddingBottom: 4, paddingHorizontal: 10, borderRadius: 12, borderTopRightRadius: mine ? corner : 12, borderTopLeftRadius: mine ? 12 : corner }}>
              {showName ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}><Text style={{ color: nameColor(m.sender_name), fontSize: 13, fontWeight: '700' }}>{m.sender_name}</Text><UserBadges uid={m.sender_id} size={14} expandable={false} /></View> : null}
              <Text style={{ color: wa.text, fontSize: 15.5, lineHeight: 21 }}>{m.body}</Text>
              <View style={{ flexDirection: 'row', alignSelf: 'flex-end', alignItems: 'center', gap: 3, marginTop: 1 }}>
                <Text style={{ color: wa.time, fontSize: 11 }}>{time}</Text>
                {mine ? <Feather name="check" size={13} color={wa.time} /> : null}
              </View>
            </Pressable>
          </View>
        </View>;
      })}
      {messages.length ? <Text style={{ alignSelf: 'center', color: wa.chipText, fontSize: 11, backgroundColor: wa.chip, paddingVertical: 4, paddingHorizontal: 12, borderRadius: 8, overflow: 'hidden', marginTop: 14 }}>Mesaj için basılı tut: şikayet et{isClass && isOwner ? ', sil' : ' ya da kendi mesajını sil'}.</Text> : null}
    </ScrollView>
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 8, paddingTop: 6, paddingBottom: Math.max(insets.bottom, 8) }}>
      <TextInput value={text} onChangeText={setText} placeholder="Mesaj yaz" placeholderTextColor={wa.time} multiline maxLength={1000} style={{ flex: 1, maxHeight: 120, minHeight: 46, borderRadius: 24, paddingHorizontal: 18, paddingTop: 12, paddingBottom: 12, backgroundColor: wa.input, color: wa.text, fontSize: 16 }} />
      <Pressable onPress={send} disabled={sending || !text.trim()} style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: SEND, alignItems: 'center', justifyContent: 'center', opacity: sending || !text.trim() ? 0.5 : 1 }}><Feather name="send" size={20} color="#fff" /></Pressable>
    </View>
  </KeyboardAvoidingView>;
}
