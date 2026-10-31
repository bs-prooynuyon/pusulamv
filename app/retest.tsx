import { Image, Text, View } from 'react-native';
import React, { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Card, Header, PrimaryButton, Screen } from '@/components/PlanimUI';
import { usePlanim } from '@/context/PlanimContext';
import { useColors } from '@/hooks/useColors';
import { dueWrongs } from '@/lib/retest';

/** Yanlış defterinden otomatik tekrar testi: zorlandıkların önce gelir, üç kez üst üste çözdüklerin rotasyondan çıkar. */
export default function RetestScreen() {
  const colors = useColors();
  const { wrongs, updateWrong } = usePlanim();
  const queue = useMemo(() => dueWrongs(wrongs, 10), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [right, setRight] = useState(0);
  const item = queue[index];

  if (!queue.length) return <Screen>
    <Header eyebrow="Tekrar zamanı" title="Tekrar testi" subtitle="Şu an tekrar edilecek soru yok. Yeni yanlışlar ekledikçe ya da bir hafta geçtikçe burada görünür." />
    <PrimaryButton label="Yanlış deposuna dön" onPress={() => router.back()} icon="arrow-left" />
  </Screen>;

  if (!item) return <Screen>
    <Header eyebrow="Test bitti" title={`${right} / ${queue.length} doğru`} subtitle={right === queue.length ? 'Harika, hepsini çözdün!' : 'Çözemediklerin yine tekrar listesinde kalacak.'} />
    <PrimaryButton label="Tamam" onPress={() => router.back()} icon="check" />
  </Screen>;

  const answer = (ok: boolean) => {
    const streak = ok ? (item.correctStreak ?? 0) + 1 : 0;
    updateWrong(item.id, ok
      ? { understood: true, correctStreak: streak, reviewedAt: new Date().toISOString() }
      : { understood: false, failCount: item.failCount + 1, correctStreak: 0, reviewedAt: new Date().toISOString() });
    if (ok) setRight((n) => n + 1);
    setRevealed(false); setIndex((n) => n + 1);
  };

  return <Screen>
    <Header eyebrow={`Soru ${index + 1} / ${queue.length}`} title={item.subject} subtitle="Önce kendin çöz, sonra çözümü kontrol et." />
    <Card>
      <Image source={{ uri: item.photo }} style={{ width: '100%', height: 300, borderRadius: 14, backgroundColor: colors.muted }} resizeMode="contain" />
      {!revealed ? <PrimaryButton label="Çözümü göster" icon="eye" onPress={() => setRevealed(true)} /> : <>
        {item.friendAnswer || item.aiAnswer ? <View style={{ padding: 12, borderRadius: 12, backgroundColor: colors.accent, gap: 4 }}>
          {item.friendAnswer ? <Text style={{ color: colors.foreground, fontSize: 14, lineHeight: 20 }}>Arkadaşının cevabı: {item.friendAnswer}</Text> : null}
          {item.aiAnswer ? <Text style={{ color: colors.foreground, fontSize: 14, lineHeight: 20 }}>Yapay zeka: {item.aiAnswer}</Text> : null}
        </View> : <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>Bu soruya kayıtlı çözüm yok. Kendi çözümünü kontrol et.</Text>}
        <Text style={{ color: colors.foreground, fontWeight: '800' }}>Doğru çözebildin mi?</Text>
        <PrimaryButton label="Evet, çözdüm" icon="check" onPress={() => answer(true)} />
        <PrimaryButton label="Hayır, yapamadım" icon="x" secondary onPress={() => answer(false)} />
      </>}
    </Card>
  </Screen>;
}
