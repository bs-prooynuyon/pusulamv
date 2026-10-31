import React, { useState } from 'react';
import { Switch, Text, View } from 'react-native';
import { SelectBox } from '@/components/SelectBox';
import { WheelTime } from '@/components/WheelTime';
import { Field, styles } from '@/components/PlanimUI';
import { usePlanim } from '@/context/PlanimContext';
import { useColors } from '@/hooks/useColors';
const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

/** Veli numarası, haftalık rapor günü/saati ve aylık rapor günü. */
export function ReportSettings() {
  const colors = useColors();
  const { settings, updateSettings } = usePlanim();
  return <View style={{ gap: 12 }}>
    <Field label="Velinin telefon numarası (örn. 5xx xxx xx xx)" value={settings.parentPhone} onChangeText={(v) => updateSettings({ parentPhone: v })} placeholder="5xx xxx xx xx" keyboardType="numeric" />
    <SelectBox label="Haftalık özet günü" placeholder="Gün seçiniz..." value={DAYS[settings.reportDay] ?? ''} options={DAYS} onSelect={(v) => updateSettings({ reportDay: DAYS.indexOf(v) })} />
    <SelectBox label="Aylık özet günü" placeholder="Gün seçiniz..." value={settings.monthlyDay ? `Ayın ${settings.monthlyDay}. günü` : ''} options={Array.from({ length: 28 }, (_, k) => `Ayın ${k + 1}. günü`)} onSelect={(v) => updateSettings({ monthlyDay: parseInt(v.replace('Ayın ', ''), 10) })} />
    <WheelTime label="Veliye gönderme / bildirim saati" value={settings.reportTime} onChange={(v) => updateSettings({ reportTime: v })} />
    <Field label="Velinin e-postası (isteğe bağlı)" value={settings.parentEmail} onChangeText={(v) => updateSettings({ parentEmail: v })} placeholder="veli@mail.com" keyboardType="email" />
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ flex: 1 }}><Text style={{ color: colors.foreground, fontWeight: '800', fontSize: 14 }}>Raporu veliye WhatsApp ile göndermeme izin ver</Text><Text style={{ color: colors.mutedForeground, fontSize: 12, lineHeight: 17, marginTop: 2 }}>Açıksan rapor hazır olunca WhatsApp’ta velinin sohbeti açılır. Kapalıysa sana haftalık hatırlatma gelir.</Text></View>
      <Switch value={settings.parentConsent} onValueChange={(v) => updateSettings({ parentConsent: v })} trackColor={{ true: colors.primary }} />
    </View>
  </View>;
}
