import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TopBar } from '@/components/TopBar';
import { useColors } from '@/hooks/useColors';

export function Screen({ children, scroll = true, style, topBar = false }: { children: React.ReactNode; scroll?: boolean; style?: ViewStyle; topBar?: boolean }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const content = <View style={[styles.screenContent, { paddingTop: topBar ? 14 : insets.top + 14, paddingBottom: 40 }, style]}>{children}</View>;
  if (scroll) {
    return <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={{ flexGrow: 1 }} stickyHeaderIndices={topBar ? [0] : undefined} showsVerticalScrollIndicator={false}>
      {topBar ? <TopBar /> : null}
      {content}
    </ScrollView>;
  }
  return <View style={[styles.screen, { backgroundColor: colors.background }]}>{topBar ? <TopBar /> : null}{content}</View>;
}

export function Header({ eyebrow, title, subtitle, right }: { eyebrow?: string; title: string; subtitle?: string; right?: React.ReactNode }) {
  const colors = useColors();
  return <View style={styles.headerRow}>
    <View style={{ flex: 1 }}>
      {eyebrow ? <Text style={[styles.eyebrow, { color: colors.primary }]}>{eyebrow.toUpperCase()}</Text> : null}
      <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
      {subtitle ? <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{subtitle}</Text> : null}
    </View>
    {right}
  </View>;
}

export function Card({ children, style, tone = 'card' }: { children: React.ReactNode; style?: ViewStyle; tone?: 'card' | 'pink' | 'mint' | 'lavender' }) {
  const colors = useColors();
  const background = tone === 'pink' ? colors.accent : tone === 'mint' ? colors.mintSoft : tone === 'lavender' ? colors.lavenderSoft : colors.card;
  return <View style={[styles.card, { backgroundColor: background, borderColor: colors.border }, style]}>{children}</View>;
}

export function PrimaryButton({ label, onPress, icon, secondary = false, disabled = false }: { label: string; onPress: () => void; icon?: keyof typeof Feather.glyphMap; secondary?: boolean; disabled?: boolean }) {
  const colors = useColors();
  return <Pressable testID={`button-${label}`} onPress={onPress} disabled={disabled} style={({ pressed }) => [styles.button, { backgroundColor: secondary ? colors.secondary : colors.primary, opacity: disabled ? 0.45 : pressed ? 0.78 : 1 }]} >
    {icon ? <Feather name={icon} size={17} color={secondary ? colors.secondaryForeground : colors.primaryForeground} /> : null}
    <Text style={[styles.buttonText, { color: secondary ? colors.secondaryForeground : colors.primaryForeground }]}>{label}</Text>
  </Pressable>;
}

export function IconButton({ name, onPress, color }: { name: keyof typeof Feather.glyphMap; onPress: () => void; color?: string }) {
  const colors = useColors();
  return <Pressable testID={`icon-${name}`} onPress={onPress} hitSlop={10} style={({ pressed }) => [styles.iconButton, { backgroundColor: colors.secondary, opacity: pressed ? 0.65 : 1 }]}><Feather name={name} size={19} color={color ?? colors.foreground} /></Pressable>;
}

export function Field({ label, value, onChangeText, placeholder, keyboardType = 'default', secure = false }: { label: string; value: string; onChangeText: (value: string) => void; placeholder?: string; keyboardType?: 'default' | 'numeric' | 'email'; secure?: boolean }) {
  const colors = useColors();
  return <View style={{ gap: 7 }}>
    <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
    <TextInput value={value} onChangeText={onChangeText} secureTextEntry={secure} placeholder={placeholder} placeholderTextColor={colors.mutedForeground} keyboardType={keyboardType === 'email' ? 'email-address' : keyboardType} autoCapitalize={keyboardType === 'email' ? 'none' : undefined} autoCorrect={keyboardType === 'email' ? false : undefined} style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]} />
  </View>;
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const colors = useColors();
  return <View style={styles.sectionRow}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>{action && onAction ? <Pressable onPress={onAction}><Text style={[styles.link, { color: colors.primary }]}>{action}</Text></Pressable> : null}</View>;
}

/** Ayarlar tarzı bölüm: küçük büyük harfli etiket + kart. */
export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const colors = useColors();
  return <View style={{ gap: 8 }}>
    <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: '800', letterSpacing: 1.4, marginLeft: 2 }}>{title.toLocaleUpperCase('tr')}</Text>
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, gap: 14 }]}>{children}</View>
  </View>;
}

/** Kart içinde dokunulabilir satır: etiket + ok. `tone` ile uyarı renkleri. */
export function NavRow({ label, onPress, tone = 'normal', last = false }: { label: string; onPress: () => void; tone?: 'normal' | 'warn' | 'danger'; last?: boolean }) {
  const colors = useColors();
  const color = tone === 'danger' ? colors.destructive : tone === 'warn' ? colors.warning : colors.foreground;
  return <Pressable onPress={onPress} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', paddingBottom: last ? 0 : 14, borderBottomWidth: last ? 0 : 1, borderBottomColor: colors.border, opacity: pressed ? 0.7 : 1 })}>
    <Text style={{ flex: 1, color, fontSize: 15, fontWeight: '700' }}>{label}</Text>
    <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
  </Pressable>;
}

export const styles = StyleSheet.create({
  screen: { flex: 1 },
  screenContent: { paddingHorizontal: 18, gap: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 2 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.1, marginBottom: 6 },
  title: { fontSize: 31, fontWeight: '800', lineHeight: 37 },
  subtitle: { fontSize: 14, lineHeight: 20, marginTop: 5 },
  card: { borderRadius: 20, padding: 17, borderWidth: 1, gap: 12 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  link: { fontSize: 13, fontWeight: '700' },
  button: { minHeight: 47, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 18 },
  buttonText: { fontSize: 15, fontWeight: '700' },
  iconButton: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  fieldLabel: { fontSize: 12, fontWeight: '700' },
  input: { height: 48, borderRadius: 14, paddingHorizontal: 14, borderWidth: 1, fontSize: 15 },
});