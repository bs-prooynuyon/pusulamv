import { SelectBox } from '@/components/SelectBox';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { Card, Header, PrimaryButton, Screen } from '@/components/PlanimUI';
import { usePlanim } from '@/context/PlanimContext';
import { useColors } from '@/hooks/useColors';
import { sendFeedback } from '@/lib/chat';
import { cloudConfigured, getUserId } from '@/lib/cloud';

const CATEGORIES = ['Hata', 'Öneri', 'Şikayet'];

/** Uygulama hakkında hata / öneri / şikayet. Hesap varsa sunucuya, yoksa paylaşım menüsüne gider. */
export default function FeedbackScreen() {
  const colors = useColors();
  const { settings } = usePlanim();
  const [category, setCategory] = useState('Hata');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const online = cloudConfigured() && settings.signedIn;

  const send = async () => {
    const body = text.trim();
    if (body.length < 5) return Alert.alert('Biraz daha yaz', 'Ne olduğunu en az birkaç kelimeyle anlat.');
    setBusy(true);
    try {
      if (!online) { Alert.alert('Giriş gerekli', 'Şikayet ve önerin bize doğrudan ulaşsın diye önce hesabınla giriş yapman gerekiyor. Ayarlar’dan giriş yapıp tekrar dene.'); return; }
      await sendFeedback(await getUserId(), category, body);
      setText('');
      Alert.alert('Teşekkürler', 'Mesajın bize ulaştı.', [{ text: 'Tamam', onPress: () => router.back() }]);
    } catch (e) { Alert.alert('Gönderilemedi', `İnternetini kontrol edip tekrar dener misin?\n(${(e as { code?: string })?.code ?? 'hata'})`); }
    finally { setBusy(false); }
  };

  return <Screen>
    <Header eyebrow="Bize ulaş" title="Şikayet / öneri" subtitle="Bir hata mı buldun, önerin ya da şikayetin mi var? Yaz, bize ulaşsın." />
    <Card>
      <SelectBox placeholder="Tür seçiniz..." value={category} options={[...CATEGORIES]} onSelect={(v) => setCategory(v as typeof category)} />
      <TextInput value={text} onChangeText={setText} multiline maxLength={2000} placeholder="Neler oldu? Hangi ekranda?" placeholderTextColor={colors.mutedForeground} textAlignVertical="top" style={{ minHeight: 140, borderRadius: 16, padding: 14, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, color: colors.foreground, fontSize: 15, lineHeight: 21 }} />
      <PrimaryButton label={busy ? 'Gönderiliyor…' : 'Gönder'} onPress={send} icon="send" disabled={busy} />
      {!online ? <Text style={{ color: colors.mutedForeground, fontSize: 12, lineHeight: 17 }}>Göndermek için hesabınla giriş yapmış olman gerekiyor.</Text> : null}
    </Card>
    <Pressable onPress={() => router.back()}><Text style={{ color: colors.primary, fontWeight: '700', textAlign: 'center' }}>Geri dön</Text></Pressable>
  </Screen>;
}
