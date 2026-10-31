import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Card, styles } from '@/components/PlanimUI';
import { SelectBox } from '@/components/SelectBox';
import { usePlanim } from '@/context/PlanimContext';
import { useColors } from '@/hooks/useColors';
import { lockAvailable, PlanimLock } from '@/modules/planim-lock';

/** Ders başlayınca çalacak alarm sesini seçtirir; dokununca önizleme çalar. */
export function AlarmSoundPicker() {
  const colors = useColors();
  const { settings, updateSettings } = usePlanim();
  const [sounds, setSounds] = useState<Array<{ title: string; uri: string }>>([]);

  useEffect(() => {
    if (lockAvailable) setSounds(PlanimLock.getAlarmSounds());
    return () => { if (lockAvailable) PlanimLock.stopPreview(); };
  }, []);

  if (!lockAvailable) return <Card><Text style={[styles.sectionTitle, { color: colors.foreground }]}>Alarm sesi</Text><Text style={{ color: colors.mutedForeground, fontSize: 13 }}>Alarm sesi seçimi yalnızca yüklenen Android uygulamasında çalışır.</Text></Card>;

  const pick = (uri: string, title: string) => {
    updateSettings({ alarmSoundUri: uri, alarmSoundName: title });
    PlanimLock.setAlarmSound(uri);
    PlanimLock.previewSound(uri);
  };
  const options = [{ title: 'Varsayılan alarm', uri: '' }, ...sounds];

  return <Card>
    <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Alarm sesi</Text>
    <Text style={{ color: colors.mutedForeground, fontSize: 13, lineHeight: 19 }}>Ders başladığında tam ekran alarm bu sesle çalar. Dokununca ses önizlenir.</Text>
    <SelectBox placeholder="Alarm sesi seçiniz..." value={settings.alarmSoundName || 'Varsayılan alarm'} options={options.map((o) => o.title)} onSelect={(title) => { const item = options.find((o) => o.title === title); if (item) pick(item.uri, item.title); }} />
    <View><Pressable onPress={() => PlanimLock.stopPreview()}><Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>Önizlemeyi durdur</Text></Pressable></View>
  </Card>;
}
