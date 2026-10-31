import { router } from 'expo-router';
import React from 'react';
import { Pressable, Text } from 'react-native';
import { PrivacyText } from '@/components/Consent';
import { Header, Screen } from '@/components/PlanimUI';
import { useColors } from '@/hooks/useColors';

export default function PrivacyScreen() {
  const colors = useColors();
  return <Screen>
    <Header eyebrow="Gizlilik" title="Hangi bilgiler toplanıyor?" />
    <PrivacyText />
    <Pressable onPress={() => router.back()}><Text style={{ color: colors.primary, fontWeight: '700', textAlign: 'center' }}>Geri dön</Text></Pressable>
  </Screen>;
}
