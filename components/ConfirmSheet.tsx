import React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

/** Uygulamanın tasarımına uyan onay penceresi (sistem Alert'i yerine). */
export function ConfirmSheet({ visible, title, text, confirmLabel = 'Evet', danger = false, onConfirm, onCancel }: { visible: boolean; title: string; text?: string; confirmLabel?: string; danger?: boolean; onConfirm: () => void; onCancel: () => void }) {
  const colors = useColors();
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
    <Pressable onPress={onCancel} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
      <Pressable style={{ backgroundColor: colors.card, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 22, gap: 12 }}>
        <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: danger ? colors.warnSoft : colors.accent, alignItems: 'center', justifyContent: 'center' }}><Feather name={danger ? 'trash-2' : 'help-circle'} size={22} color={danger ? colors.destructive : colors.primary} /></View>
        <Text style={{ color: colors.foreground, fontSize: 20, fontWeight: '800' }}>{title}</Text>
        {text ? <Text style={{ color: colors.mutedForeground, fontSize: 14, lineHeight: 20 }}>{text}</Text> : null}
        <Pressable onPress={onConfirm} style={{ minHeight: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: danger ? colors.destructive : colors.primary }}><Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>{confirmLabel}</Text></Pressable>
        <Pressable onPress={onCancel} style={{ minHeight: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.secondary }}><Text style={{ color: colors.secondaryForeground, fontWeight: '800', fontSize: 15 }}>Vazgeç</Text></Pressable>
      </Pressable>
    </Pressable>
  </Modal>;
}
