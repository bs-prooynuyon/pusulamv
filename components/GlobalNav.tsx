import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlanim } from '@/context/PlanimContext';
import { useColors } from '@/hooks/useColors';
import { middleKeys, NAV_HOME, NAV_MORE, navItem, NavItem } from '@/lib/nav';

/** Bu ekranlarda alt menü gizlenir (tam ekran dersler, klavyeli yazışmalar). */
const HIDDEN = ['/study-mode', '/lesson-start', '/lesson-summary', '/chat-room', '/exam-ai', '/ai', '/spotify-callback'];
const TAB_PATHS = ['/', '/schedule', '/focus', '/topics', '/more'];
const tabPath = (tab: string) => (tab === 'index' ? '/' : `/${tab}`);

/**
 * Alt menü: tüm ekranlarda sabit durur (eskiden Deneme, Sohbet gibi ekranlara girince kayboluyordu).
 * Ana sayfa + 3 orta ekran (sırası sabit; kişi isterse Ayarlar’dan değiştirir) + Daha.
 */
export function GlobalNav() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const pathname = usePathname() || '/';
  const { settings } = usePlanim();
  const top = `/${pathname.split('/')[1] ?? ''}`;
  if (HIDDEN.includes(top)) return null;
  const items: NavItem[] = [NAV_HOME, ...middleKeys(settings).map((k) => navItem(k)).filter((x): x is NavItem => !!x), NAV_MORE];
  const home = pathname === '/';
  const bg = colors.background;
  const line = colors.border;

  const press = (item: NavItem) => {
    const target = item.tab ? tabPath(item.tab) : item.path!;
    if (pathname === target) return;
    if (item.tab) router.navigate(target as never);
    else if (TAB_PATHS.includes(pathname)) router.push(target as never);
    else router.replace(target as never);
  };

  return <View style={{ flexDirection: 'row', backgroundColor: bg, borderTopWidth: 1, borderTopColor: line, paddingTop: 8, paddingBottom: Math.max(insets.bottom, 8) }}>
    {items.map((item) => {
      const on = item.tab ? pathname === tabPath(item.tab) : top === item.path;
      const color = on ? colors.primary : colors.mutedForeground;
      return <Pressable key={item.key} testID={`nav-${item.key}`} onPress={() => press(item)} style={{ flex: 1, alignItems: 'center', gap: 3, paddingVertical: 4 }}>
        <Feather name={item.icon} size={22} color={color} />
        <Text numberOfLines={1} style={{ fontSize: 11, fontWeight: on ? '800' : '600', color }}>{item.title}</Text>
      </Pressable>;
    })}
  </View>;
}
