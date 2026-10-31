import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Card, Header, PrimaryButton, Screen } from '@/components/PlanimUI';
import { usePlanim } from '@/context/PlanimContext';
import { useColors } from '@/hooks/useColors';
import { aiErrorText, askAssistant, hasAiKey } from '@/lib/ai';
import { AiChat, deleteChat, listChats, newChatId, saveChat } from '@/lib/aiHistory';
import { ChatMessage } from '@/types/planim';

/** Tek "Yapay zeka" sayfası: programa, deneme analizine ve soru çözümüne buradan gidilir; altta serbest sohbet vardır. Sohbetler telefonda saklanır; geçmişten açılır ya da silinir. */
export default function AiScreen() {
  const colors = useColors();
  const { settings } = usePlanim();
  const teacher = settings.role === 'teacher';
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [chatId, setChatId] = useState(() => newChatId());
  const [history, setHistory] = useState<AiChat[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const scroller = useRef<ScrollView>(null);
  const role = teacher ? 'teacher' : 'student';
  useEffect(() => { listChats(role).then(setHistory); }, [role]);

  const startNew = () => { if (busy) return; setChatId(newChatId()); setMessages([]); setText(''); setShowHistory(false); };
  const openChat = (c: AiChat) => { if (busy) return; setChatId(c.id); setMessages(c.messages); setShowHistory(false); setTimeout(() => scroller.current?.scrollToEnd({ animated: false }), 80); };
  const removeChat = (c: AiChat) => Alert.alert('Sohbet silinsin mi?', c.title, [{ text: 'Vazgeç', style: 'cancel' }, { text: 'Sil', style: 'destructive', onPress: async () => { setHistory(await deleteChat(role, c.id)); if (c.id === chatId) { setChatId(newChatId()); setMessages([]); } } }]);

  const tools: { title: string; subtitle: string; icon: keyof typeof Feather.glyphMap; route: string }[] = teacher ? [] : [
    { title: 'Program hazırla', subtitle: 'Müsait günlerine göre ders programı önersin', icon: 'calendar', route: '/ai-schedule' },
    { title: 'Deneme analizi', subtitle: 'Denemeni seç; PDF’i yapay zeka okusun', icon: 'edit-3', route: '/exams' },
    { title: 'Yanlış soru çözümü', subtitle: 'Sorunun fotoğrafını çek, adım adım çözsün', icon: 'layers', route: '/wrongs' },
  ];

  const send = async () => {
    const body = text.trim();
    if (!body || busy) return;
    if (!(await hasAiKey())) return Alert.alert('Yapay zeka anahtarı yok', 'Ayarlar > Yapay zeka bölümüne Gemini anahtarını ekle.');
    const next: ChatMessage[] = [...messages, { role: 'user', text: body }];
    setMessages(next); setText(''); setBusy(true);
    try {
      const answer = await askAssistant(next, role);
      const done: ChatMessage[] = [...next, { role: 'assistant', text: answer.trim() || 'Yanıt alınamadı, tekrar dener misin?' }];
      setMessages(done);
      setHistory(await saveChat(role, chatId, done));
    }
    catch (e) { Alert.alert('Yanıt alınamadı', aiErrorText(e)); setMessages(messages); setText(body); }
    finally { setBusy(false); setTimeout(() => scroller.current?.scrollToEnd({ animated: true }), 80); }
  };

  return <Screen>
    <Header eyebrow={teacher ? 'Öğretmen asistanı' : 'Yapay zeka koçun'} title="Yapay zeka" subtitle={teacher ? 'Ders planı, ölçme-değerlendirme ve öğrenci iletişimi için asistanla konuş. Öğrenciye program taslağını, sınıf sohbetinde öğrencinin sayfasından hazırlarsın.' : 'Program, deneme analizi, soru çözümü ve sohbet tek yerde.'} />
    {tools.map((t) => <Pressable key={t.route} onPress={() => router.push(t.route as never)}><Card><View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
      <View style={{ width: 45, height: 45, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent }}><Feather name={t.icon} size={20} color={colors.primary} /></View>
      <View style={{ flex: 1 }}><Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '800' }}>{t.title}</Text><Text style={{ color: colors.mutedForeground, fontSize: 13, marginTop: 4 }}>{t.subtitle}</Text></View>
      <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
    </View></Card></Pressable>)}
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '800' }}>Sohbet</Text>
        <View style={{ flexDirection: 'row', gap: 16 }}>
          <Pressable onPress={() => setShowHistory((v) => !v)} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}><Feather name="clock" size={15} color={colors.primary} /><Text style={{ color: colors.primary, fontWeight: '800', fontSize: 13 }}>Geçmiş{history.length ? ` (${history.length})` : ''}</Text></Pressable>
          <Pressable onPress={startNew} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}><Feather name="plus" size={15} color={colors.primary} /><Text style={{ color: colors.primary, fontWeight: '800', fontSize: 13 }}>Yeni</Text></Pressable>
        </View>
      </View>
      {showHistory ? (history.length === 0
        ? <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>Henüz kayıtlı sohbet yok. Bir şey sorduğunda sohbet otomatik kaydedilir; yalnızca bu telefonda saklanır.</Text>
        : <View style={{ gap: 2 }}>{history.map((c) => <View key={c.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, borderTopWidth: 1, borderTopColor: colors.border }}>
          <Pressable style={{ flex: 1 }} onPress={() => openChat(c)}><Text numberOfLines={1} style={{ color: c.id === chatId ? colors.primary : colors.foreground, fontWeight: '700', fontSize: 14 }}>{c.title}</Text><Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 2 }}>{new Date(c.updatedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} · {Math.ceil(c.messages.length / 2)} soru</Text></Pressable>
          <Pressable onPress={() => removeChat(c)} hitSlop={10} accessibilityLabel="Sohbeti sil"><Feather name="trash-2" size={16} color={colors.destructive} /></Pressable>
        </View>)}</View>) : null}
      {messages.length === 0 ? <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>{teacher ? 'Örn. “8. sınıf matematik için haftalık tekrar planı öner.”' : 'Örn. “Üslü ifadeleri kolay bir örnekle anlatır mısın?”'}</Text> : null}
      <ScrollView ref={scroller} style={{ maxHeight: 360 }} nestedScrollEnabled contentContainerStyle={{ gap: 8 }}>
        {messages.map((m, i) => <View key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '88%', paddingVertical: 9, paddingHorizontal: 13, borderRadius: 18, backgroundColor: m.role === 'user' ? colors.primary : colors.muted }}>
          <Text selectable style={{ color: m.role === 'user' ? colors.primaryForeground : colors.foreground, fontSize: 14, lineHeight: 20 }}>{m.text}</Text>
        </View>)}
        {busy ? <ActivityIndicator color={colors.primary} /> : null}
      </ScrollView>
      <TextInput value={text} onChangeText={setText} placeholder="Bir şey sor" placeholderTextColor={colors.mutedForeground} multiline maxLength={1500} style={{ minHeight: 44, maxHeight: 110, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, color: colors.foreground, fontSize: 15 }} />
      <PrimaryButton label={busy ? 'Düşünüyor…' : 'Gönder'} icon="send" disabled={busy || !text.trim()} onPress={send} />
      {messages.length ? <Pressable onPress={startNew}><Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: '700', textAlign: 'center' }}>Yeni sohbet başlat (bu sohbet geçmişte kalır)</Text></Pressable> : null}
    </Card>
    <Pressable onPress={() => router.back()}><Text style={{ color: colors.primary, fontWeight: '700', textAlign: 'center' }}>Geri dön</Text></Pressable>
  </Screen>;
}
