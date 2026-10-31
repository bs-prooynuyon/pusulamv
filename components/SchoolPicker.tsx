import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { SelectBox } from '@/components/SelectBox';
import { PROVINCES } from '@/constants/provinces';
import { districtsOf, SchoolLevel, schoolsOf } from '@/constants/schools';

export interface SchoolValue { city: string; district: string; school: string }

/** İl → ilçe → okul: üçü de aranabilir, kaydırmalı açılır liste. Listede olmayan okul yazılarak eklenebilir. */
export function SchoolPicker({ value, onChange, schoolLabel = 'Okul', level = 'hepsi' }: { value: SchoolValue; onChange: (v: SchoolValue) => void; schoolLabel?: string; level?: SchoolLevel }) {
  const colors = useColors();
  const districts = useMemo(() => (value.city ? districtsOf(value.city) : []), [value.city]);
  const schools = useMemo(() => (value.city && value.district ? schoolsOf(value.city, value.district, level) : []), [value.city, value.district, level]);
  return <View style={{ gap: 10 }}>
    <SelectBox label="İl" placeholder="İl seçiniz..." value={value.city} options={PROVINCES} onSelect={(city) => onChange({ city, district: '', school: '' })} />
    <SelectBox label="İlçe" placeholder="İlçe seçiniz..." value={value.district} options={districts} allowCustom disabled={!value.city} onSelect={(district) => onChange({ ...value, district, school: '' })} />
    <SelectBox label={schoolLabel} placeholder="Okul seçiniz..." value={value.school} options={schools} allowCustom disabled={!value.district} onSelect={(school) => onChange({ ...value, school })} />
    <Text style={{ color: colors.mutedForeground, fontSize: 12, lineHeight: 17 }}>Okulunu bulamazsan adını yaz ve “olarak ekle”ye dokun; listede olmayan ilçe ve okullar da eklenebilir.</Text>
  </View>;
}
