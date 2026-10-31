import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlanim } from '@/context/PlanimContext';
import { useColors } from '@/hooks/useColors';
import { aiErrorText, askAboutExam } from '@/lib/ai';
import { ChatMessage } from '@/types/planim';

/** Denemeyle ilgili yapay zekaya soru sorma. PDF varsa yapay zeka onu görerek cevaplar. */
export default function ExamAiScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { exams, updateExam } = usePlanim();
  const exam = exams.find((item) => item.id === id);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const pdf = useRef<string | undefined>(undefined);
  const scroller = useRef<ScrollView>(null);
  const chat = exam?.chat ?? [];

  if (!exam) return <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: colors.foreground }}>Deneme bulunamadı.</Text></View>;

  const context = `${exam.title}: ${exam.results.map((r) => `${r.subject} ${r.correct}D/${r.wrong}Y`).join(', ')}.${exam.weakTopics?.length ? ` Zayıf konular: ${exam.weakTopics.join(', ')}.` : ''}`;

  const send = async () => {
    const question = text.trim();
    if (!question || busy) return;
    const next: ChatMessage[] = [...chat, { role: 'user', text: question }];
    updateExam(exam.id, { chat: next });
    setText(''); setBusy(true);
    try {
      if (exam.pdfUri && pdf.current === undefined) {
        try { const FS = require('expo-file-system/legacy'); pdf.current = await FS.readAsStringAsync(exam.pdfUri, { encoding: 'base64' }); } catch { pdf.current = ''; }
      }
      const answer = await askAboutExam(next, pdf.current || undefined, context);
      updateExam(exam.id, { chat: [...next, { role: 'assistant', text: answer }] });
    } catch (error) {
      Alert.alert('Yanıt gelmedi', aiErrorText(error));
    } finally {
      setBusy(false);
      setTimeout(() => scroller.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: colors.background }}>
    <View style={{ paddingTop: insets.top + 10, paddingHorizontal: 18, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
      <Pressable onPress={() => router.back()} hitSlop={10}><Feather name="arrow-left" size={22} color={colors.foreground} /></Pressable>
      <View style={{ flex: 1 }}><Text style={{ color: colors.foreground, fontWeight: '800', fontSize: 16 }} numberOfLines={1}>{exam.title}</Text><Text style={{ color: colors.mutedForeground, fontSize: 12 }}>{exam.pdfUri ? 'PDF’i görerek cevaplar' : 'Net sonuçlarına göre cevaplar'}</Text></View>
    </View>
    <ScrollView ref={scroller} contentContainerStyle={{ padding: 18, gap: 10 }} onContentSizeChange={() => scroller.current?.scrollToEnd({ animated: true })}>
      {chat.length === 0 ? <Text style={{ color: colors.mutedForeground, lineHeight: 20 }}>Merhaba! Bu denemeyle ilgili ne sormak istersin? Örneğin “Matematik 12. soruyu nasıl çözerim?” ya da “Hangi konulara çalışmalıyım?”</Text> : null}
      {chat.map((message, index) => <View key={index} style={{ alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '88%', padding: 12, borderRadius: 16, backgroundColor: message.role === 'user' ? colors.primary : colors.card, borderWidth: message.role === 'user' ? 0 : 1, borderColor: colors.border }}>
        <Text selectable style={{ color: message.role === 'user' ? colors.primaryForeground : colors.foreground, fontSize: 15, lineHeight: 22 }}>{message.text}</Text>
      </View>)}
      {busy ? <ActivityIndicator color={colors.primary} style={{ alignSelf: 'flex-start' }} /> : null}
    </ScrollView>
    <View style={{ flexDirection: 'row', gap: 8, padding: 12, paddingBottom: insets.bottom + 12, borderTopWidth: 1, borderTopColor: colors.border }}>
      <TextInput value={text} onChangeText={setText} placeholder="Sorunu yaz…" placeholderTextColor={colors.mutedForeground} multiline style={{ flex: 1, maxHeight: 110, minHeight: 46, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, color: colors.foreground, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15 }} />
      <Pressable onPress={send} disabled={busy || !text.trim()} style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', opacity: busy || !text.trim() ? 0.45 : 1 }}><Feather name="send" size={18} color={colors.primaryForeground} /></Pressable>
    </View>
  </KeyboardAvoidingView>;
}
