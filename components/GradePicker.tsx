import React from 'react';
import { SelectBox } from '@/components/SelectBox';

export const GRADES = ['Mezun', '8. Sınıf'];

/** Sınıf seçimi: "Sınıf seçiniz…" kutusu, altında arama ve kaydırmalı liste. */
export function GradePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <SelectBox label="Sınıf" placeholder="Sınıf seçiniz..." value={value} options={GRADES} onSelect={onChange} />;
}
