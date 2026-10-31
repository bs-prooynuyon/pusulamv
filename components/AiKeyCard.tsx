import React, { useEffect, useState } from 'react';
import { Alert, Linking, Switch, Text, View } from 'react-native';
import { Card, Field, PrimaryButton, styles } from '@/components/PlanimUI';
import { useColors } from '@/hooks/useColors';
import { clearAiKey, getAiKey, saveAiKey } from '@/lib/ai';
import { aiAllowed, hasParentPin, pinLockMinutes, setAiEnabled, setParentPin, validPin } from '@/lib/parentLock';

/** Yapay zeka: ebeveyn PIN'iyle açılıp kapanır. Anahtar (öğrencinin kendi Gemini anahtarı) yalnızca bu telefonda güvenli depoda durur. */
export function AiKeyCard() {
  const colors = useColors();
  const [saved, setSaved] = useState(false);
  const [key, setKey] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [pinSet, setPinSet] = useState(false);
  const [pin1, setPin1] = useState('');
  const [pin2, setPin2] = useState('');
  const [pending, setPending] = useState<boolean | null>(null);
  const [askPin, setAskPin] = useState('');
  useEffect(() => { getAiKey().then((k) => setSaved(!!k)); aiAllowed().then(setEnabled); hasParentPin().then(setPinSet); }, []);

  const save = async () => {
    if (key.trim().length < 20) return Alert.alert('Anahtar eksik', 'Gemini API anahtarını eksiksiz yapıştır.');
    try { await saveAiKey(key); setSaved(true); setKey(''); Alert.alert('Kaydedildi', 'Yapay zeka artık deneme PDF’lerini okuyabilir ve sorularını yanıtlayabilir.'); }
    catch (e) { Alert.alert('Kaydedilemedi', `Tekrar dener misin?\n\nHata: ${e instanceof Error ? e.message : String(e)}`); }
  };
  const remove = async () => { await clearAiKey(); setSaved(false); };

  const createPin = async () => {
    if (!validPin(pin1)) return Alert.alert('PIN 4 haneli olmalı', 'Yalnızca rakam kullan, örneğin 4 rakam.');
    if (pin1 !== pin2) return Alert.alert('PIN’ler aynı değil', 'İki kutuya aynı PIN’i yaz.');
    if (await setParentPin(pin1)) { setPinSet(true); setPin1(''); setPin2(''); Alert.alert('Ebeveyn PIN’i kaydedildi', 'Yapay zekayı açıp kapatmak için artık bu PIN gerekir. PIN’i çocuğunla paylaşma.'); }
  };

  const confirm = async () => {
    if (pending === null) return;
    if (await setAiEnabled(pending, askPin)) { setEnabled(pending); setPending(null); setAskPin(''); return; }
    const wait = await pinLockMinutes();
    setAskPin('');
    Alert.alert(wait ? 'Çok fazla deneme' : 'PIN yanlış', wait ? `Çok kez yanlış PIN girildi. ${wait} dakika sonra tekrar dene.` : 'Ebeveyn PIN’ini doğru yazdığından emin ol.');
  };

  return <Card>
    <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Yapay zeka</Text>
    <Text style={{ color: colors.mutedForeground, fontSize: 13, lineHeight: 19 }}>Yapay zeka deneme PDF’ini okuyup netleri çıkarır, program önerir ve sorularını yanıtlar. 18 yaşından küçüklerde başta kapalıdır; ebeveyn PIN’iyle açılır ve kapatılır.</Text>

    <View style={{ gap: 10 }}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Ebeveyn kilidi</Text>
      {!pinSet
        ? <>
          <Text style={{ color: colors.mutedForeground, fontSize: 12, lineHeight: 18 }}>PIN’i ebeveyn belirlesin. PIN olmadan yapay zeka açılıp kapatılamaz. PIN’i unutursan uygulamayı silip yeniden kurman gerekir (veriler hesapla geri gelir).</Text>
          <Field label="Ebeveyn PIN’i (4 rakam)" value={pin1} onChangeText={(v) => setPin1(v.replace(/\D/g, '').slice(0, 4))} keyboardType="numeric" secure />
          <Field label="PIN’i tekrar yaz" value={pin2} onChangeText={(v) => setPin2(v.replace(/\D/g, '').slice(0, 4))} keyboardType="numeric" secure />
          <PrimaryButton label="PIN’i kaydet" onPress={createPin} icon="lock" disabled={pin1.length < 4 || pin2.length < 4} />
        </>
        : <>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ flex: 1, color: colors.foreground, fontSize: 15, fontWeight: '700' }}>Yapay zeka {enabled ? 'açık' : 'kapalı'}</Text>
            <Switch value={pending ?? enabled} onValueChange={(v) => { setPending(v === enabled ? null : v); setAskPin(''); }} trackColor={{ true: '#3b8bff', false: '#2a2a30' }} thumbColor="#fff" />
          </View>
          {pending !== null
            ? <>
              <Field label={`Yapay zekayı ${pending ? 'açmak' : 'kapatmak'} için ebeveyn PIN’i`} value={askPin} onChangeText={(v) => setAskPin(v.replace(/\D/g, '').slice(0, 4))} keyboardType="numeric" secure />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1 }}><PrimaryButton label="Onayla" onPress={confirm} icon="check" disabled={askPin.length < 4} /></View>
                <View style={{ flex: 1 }}><PrimaryButton label="Vazgeç" onPress={() => { setPending(null); setAskPin(''); }} secondary /></View>
              </View>
            </>
            : null}
        </>}
    </View>

    {enabled
      ? <>
        <Text style={{ color: colors.mutedForeground, fontSize: 13, lineHeight: 19 }}>Bunun için kendi Gemini API anahtarını ekle. Anahtar yalnızca bu telefonda saklanır.</Text>
        {saved
          ? <><Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '700' }}>Anahtar eklendi ✓</Text><PrimaryButton label="Anahtarı sil" onPress={remove} icon="trash-2" secondary /></>
          : <><Field label="Gemini API anahtarı" value={key} onChangeText={setKey} placeholder="AIza..." /><PrimaryButton label="Kaydet" onPress={save} icon="check" /></>}
        <PrimaryButton label="Anahtarı nereden alırım?" onPress={() => Linking.openURL('https://aistudio.google.com/apikey')} icon="external-link" secondary />
      </>
      : <Text style={{ color: colors.mutedForeground, fontSize: 13, lineHeight: 19 }}>Yapay zeka kapalı. Açmak için ebeveyn PIN’i gerekir.</Text>}
  </Card>;
}
