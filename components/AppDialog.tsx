import React, { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

type Btn = { text?: string; style?: 'default' | 'cancel' | 'destructive'; onPress?: (value?: string) => void };
interface Cfg { title: string; message?: string; buttons: Btn[] }

/**
 * Sistem Alert.alert kutusunu uygulamanın kendi tasarımıyla değiştirir.
 * Kodun geri kalanı Alert.alert(...) yazmaya devam eder; DialogHost açıkken hepsi yeni görünümde çıkar.
 */
let push: ((cfg: Cfg) => void) | null = null;
const nativeAlert = Alert.alert.bind(Alert);
(Alert as unknown as { alert: unknown }).alert = (title: string, message?: string, buttons?: Btn[], options?: unknown) => {
  if (!push) return (nativeAlert as (...a: unknown[]) => void)(title, message, buttons, options);
  push({ title, message, buttons: buttons?.length ? buttons : [{ text: 'Tamam' }] });
};

export function DialogHost() {
  const colors = useColors();
  const [queue, setQueue] = useState<Cfg[]>([]);
  useEffect(() => { push = (cfg) => setQueue((q) => [...q, cfg]); return () => { push = null; }; }, []);
  const cfg = queue[0];
  const close = (btn?: Btn) => { setQueue((q) => q.slice(1)); setTimeout(() => btn?.onPress?.(), 0); };
  if (!cfg) return null;
  const cancel = cfg.buttons.find((b) => b.style === 'cancel');
  const actions = cfg.buttons.filter((b) => b !== cancel);
  return <Modal visible transparent animationType="slide" onRequestClose={() => close(cancel)}>
    <Pressable onPress={() => close(cancel)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
      <Pressable style={{ backgroundColor: colors.card, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 22, paddingTop: 12, paddingBottom: 26, gap: 14 }}>
        <View style={{ alignSelf: 'center', width: 38, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
        <View style={{ gap: 6, marginTop: 6 }}>
          <Text style={{ color: colors.foreground, fontSize: 21, fontWeight: '800', lineHeight: 27 }}>{cfg.title}</Text>
          {cfg.message ? <Text style={{ color: colors.mutedForeground, fontSize: 14.5, lineHeight: 21 }}>{cfg.message}</Text> : null}
        </View>
        <View style={{ gap: 9, marginTop: 4 }}>
          {actions.map((b, i) => {
            const danger = b.style === 'destructive';
            const main = !danger && i === actions.length - 1;
            return <Pressable key={`${b.text}-${i}`} onPress={() => close(b)} style={({ pressed }) => ({ minHeight: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.8 : 1, backgroundColor: danger ? colors.destructive : main ? colors.primary : colors.secondary })}>
              <Text style={{ fontSize: 15.5, fontWeight: '800', color: danger ? '#fff' : main ? colors.primaryForeground : colors.secondaryForeground }}>{b.text ?? 'Tamam'}</Text>
            </Pressable>;
          })}
          {cancel ? <Pressable onPress={() => close(cancel)} style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: colors.mutedForeground, fontSize: 15, fontWeight: '700' }}>{cancel.text ?? 'Vazgeç'}</Text></Pressable> : null}
        </View>
      </Pressable>
    </Pressable>
  </Modal>;
}
