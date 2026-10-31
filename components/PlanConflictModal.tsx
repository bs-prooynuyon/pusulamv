import { Feather } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { PrimaryButton } from '@/components/PlanimUI';
import { useColors } from '@/hooks/useColors';
import { Lesson, WEEKDAYS } from '@/types/planim';

/**
 * Gelen / önerilen programdaki bazı dersler, programındaki derslerle aynı saate denk geliyorsa sorar:
 * hangi mevcut dersler silinip yerine yenisi eklensin, hangileri kalsın.
 */
export function PlanConflictModal({ visible, existing, clashCount, onReplace, onKeep, onCancel }: {
  visible: boolean; existing: Lesson[]; clashCount: number;
  onReplace: (deleteIds: string[]) => void; onKeep: () => void; onCancel: () => void;
}) {
  const colors = useColors();
  const [sel, setSel] = useState<string[]>([]);
  useEffect(() => { if (visible) setSel([]); }, [visible]);
  const toggle = (id: string) => setSel((c) => c.includes(id) ? c.filter((x) => x !== id) : [...c, id]);
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 18 }}>
      <View style={{ maxHeight: '85%', backgroundColor: colors.card, borderRadius: 22, padding: 18, gap: 10, borderWidth: 1, borderColor: colors.border }}>
        <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: '800' }}>Bazı dersler çakışıyor</Text>
        <Text style={{ color: colors.mutedForeground, fontSize: 13, lineHeight: 19 }}>
          Yeni programdaki {clashCount} ders, programındaki aşağıdaki derslerle aynı saate denk geliyor. Yerine yenisi eklensin istediklerini seç; seçtiklerin silinir, seçmediklerin kalır.
        </Text>
        <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 6 }}>
          {existing.map((l) => {
            const on = sel.includes(l.id);
            return <Pressable key={l.id} onPress={() => toggle(l.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: on ? colors.destructive : colors.border }}>
              <Feather name={on ? 'check-square' : 'square'} size={20} color={on ? colors.destructive : colors.mutedForeground} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '800' }}>{l.name}</Text>
                <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>{WEEKDAYS[l.day]} · {l.startTime}-{l.endTime}</Text>
              </View>
              {on ? <Text style={{ color: colors.destructive, fontSize: 11, fontWeight: '800' }}>SİLİNECEK</Text> : null}
            </Pressable>;
          })}
        </ScrollView>
        <PrimaryButton label={sel.length ? `${sel.length} dersi sil, yenileri ekle` : 'Silinecek ders seç'} onPress={() => onReplace(sel)} icon="refresh-cw" disabled={!sel.length} />
        <PrimaryButton label="Çakışanları ekleme, diğerlerini ekle" onPress={onKeep} secondary />
        <PrimaryButton label="Vazgeç" onPress={onCancel} secondary />
      </View>
    </View>
  </Modal>;
}
