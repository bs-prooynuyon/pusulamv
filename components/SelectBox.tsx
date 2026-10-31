import { Feather } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { styles } from '@/components/PlanimUI';
import { useColors } from '@/hooks/useColors';

const norm = (s: string) => s.toLocaleLowerCase('tr').replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c');

/**
 * Açılır seçim kutusu: "… seçiniz" düğmesine basınca altında arama kutusu ve kaydırmalı liste açılır.
 * allowCustom açıksa, listede olmayan bir yazı "olarak ekle" satırıyla seçilebilir (liste eksikse kullanıcı takılmasın).
 */
export function SelectBox({ label, placeholder, value, options, onSelect, allowCustom = false, disabled = false, maxHeight = 260 }: { label?: string; placeholder: string; value: string; options: string[]; onSelect: (v: string) => void; allowCustom?: boolean; disabled?: boolean; maxHeight?: number }) {
  const colors = useColors();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const shown = useMemo(() => { const k = norm(q.trim()); return k ? options.filter((o) => norm(o).includes(k)) : options; }, [q, options]);
  const typed = q.trim();
  const choose = (v: string) => { onSelect(v); setOpen(false); setQ(''); };

  return <View style={{ gap: 7 }}>
    {label ? <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text> : null}
    <Pressable disabled={disabled} onPress={() => setOpen((o) => !o)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, height: 48, paddingHorizontal: 14, borderRadius: 12, backgroundColor: colors.card, borderWidth: 1, borderColor: open ? colors.primary : colors.border, opacity: disabled ? 0.5 : 1 }}>
      <Text numberOfLines={1} style={{ flex: 1, color: value ? colors.foreground : colors.mutedForeground, fontSize: 15, fontWeight: value ? '700' : '500' }}>{value || placeholder}</Text>
      <Feather name={open ? 'chevron-up' : 'chevron-down'} size={17} color={colors.mutedForeground} />
    </Pressable>
    {open ? <View style={{ borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, overflow: 'hidden' }}>
      <View style={{ padding: 10 }}>
        <TextInput value={q} onChangeText={setQ} autoFocus autoCorrect={false} placeholder="Ara" placeholderTextColor={colors.mutedForeground} style={{ height: 44, borderRadius: 10, borderWidth: 2, borderColor: colors.primary, paddingHorizontal: 12, color: colors.foreground, fontSize: 15, backgroundColor: colors.background }} />
      </View>
      <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={{ maxHeight }}>
        {allowCustom && typed && !options.some((o) => norm(o) === norm(typed)) ? <Pressable onPress={() => choose(typed)} style={{ paddingVertical: 13, paddingHorizontal: 16, borderTopWidth: 1, borderTopColor: colors.border }}><Text style={{ color: colors.primary, fontSize: 15, fontWeight: '800' }}>“{typed}” olarak ekle</Text></Pressable> : null}
        {shown.map((o) => <Pressable key={o} onPress={() => choose(o)} style={{ paddingVertical: 13, paddingHorizontal: 16, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: 'row', alignItems: 'center', backgroundColor: value === o ? colors.accent : 'transparent' }}>
          <Text style={{ flex: 1, color: value === o ? colors.primary : colors.foreground, fontSize: 15, fontWeight: value === o ? '800' : '500' }}>{o}</Text>
          {value === o ? <Feather name="check" size={17} color={colors.primary} /> : null}
        </Pressable>)}
        {shown.length === 0 && !(allowCustom && typed) ? <Text style={{ padding: 16, color: colors.mutedForeground }}>Sonuç yok.</Text> : null}
      </ScrollView>
    </View> : null}
  </View>;
}
