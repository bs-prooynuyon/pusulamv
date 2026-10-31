import { router } from 'expo-router';
import React from 'react';
import { Pressable, Text } from 'react-native';
import { LockedAppsEditor } from '@/components/LockedAppsEditor';
import { Header, Screen } from '@/components/PlanimUI';
import { useColors } from '@/hooks/useColors';

export default function LockedAppsScreen() {
  const colors = useColors();
  return <Screen>
    <Header eyebrow="Çalışma modu" title="Hangi uygulamalar kilitlensin?" subtitle="Seçili uygulamalar ders sırasında kilitlenir. Açık kalmasını istediklerinin işaretini kaldır." />
    <LockedAppsEditor />
    <Pressable onPress={() => router.back()}><Text style={{ color: colors.primary, fontWeight: '700', textAlign: 'center' }}>Tamam</Text></Pressable>
  </Screen>;
}
