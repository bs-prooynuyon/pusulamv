import React from 'react';
import { Modal, Text, View } from 'react-native';
import { PrimaryButton } from '@/components/PlanimUI';
import { quoteOfToday, todayKey } from '@/constants/quotes';
import { usePlanim } from '@/context/PlanimContext';
import { useColors } from '@/hooks/useColors';

/** Güne ilk açılışta bir kez gösterilen günün sözü kartı. */
export function DailyQuote() {
  const colors = useColors();
  const { settings, updateSettings } = usePlanim();
  const today = todayKey();
  const visible = settings.onboardingComplete && settings.lastQuoteDate !== today;
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={() => updateSettings({ lastQuoteDate: today })}>
    <View style={{ flex: 1, backgroundColor: '#000000AA', justifyContent: 'center', padding: 24 }}>
      <View style={{ backgroundColor: colors.card, borderRadius: 24, padding: 24, gap: 16, borderWidth: 1, borderColor: colors.border }}>
        <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '800', letterSpacing: 1.2 }}>GÜNÜN SÖZÜ</Text>
        <Text style={{ color: colors.foreground, fontSize: 22, lineHeight: 31, fontFamily: 'Georgia', fontWeight: '700' }}>{quoteOfToday()}</Text>
        <PrimaryButton label="Güne başla" onPress={() => updateSettings({ lastQuoteDate: today })} icon="arrow-right" />
      </View>
    </View>
  </Modal>;
}
