import React from 'react';
import { Text, View } from 'react-native';
import { SelectBox } from '@/components/SelectBox';
import { LGS_YEARS, lgsDateForYear } from '@/lib/lgs';
import { useColors } from '@/hooks/useColors';

const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
export const prettyDate = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return `${d} ${MONTHS[m - 1]} ${y}`; };

/** Sınav günü yerine yıl seçilir; gün buradan belirlenir. Açıklanmamışsa önceki yıla göre tahmin edilir. */
export function LgsYearPicker({ year, onChange }: { year: number; onChange: (year: number, date: string, estimated: boolean) => void }) {
  const colors = useColors();
  const info = year ? lgsDateForYear(year) : null;
  return <View style={{ gap: 8 }}>
    <SelectBox label="LGS yılı" placeholder="Yıl seçiniz..." value={year ? String(year) : ''} options={LGS_YEARS.map(String)} onSelect={(v) => { const y = Number(v); const i = lgsDateForYear(y); onChange(y, i.date, i.estimated); }} />
    {info ? <Text style={{ color: colors.mutedForeground, fontSize: 12, lineHeight: 17 }}>Sınav günü: <Text style={{ color: colors.foreground, fontWeight: '800' }}>{prettyDate(info.date)}</Text>{info.estimated ? ' (tahmini; bir önceki yıla göre hesaplandı, açıklanınca güncellenir)' : ''}</Text> : null}
  </View>;
}
