import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Card, Header, Screen } from '@/components/PlanimUI';
import { useColors } from '@/hooks/useColors';
import { usePlanim } from '@/context/PlanimContext';
import { middleKeys, navKeyForPath } from '@/lib/nav';

type MoreRoute = '/profile' | '/exams' | '/wrongs' | '/friends' | '/weekly' | '/settings' | '/music' | '/ai-schedule' | '/chat' | '/feedback' | '/ai';

type Item = { title: string; subtitle: string; icon: keyof typeof Feather.glyphMap; route: MoreRoute };
const studentItems: Item[] = [
  { title: 'Profilim', subtitle: 'Fotoğrafın, hedefin ve özetin', icon: 'user', route: '/profile' },
  { title: 'Deneme sonuçları', subtitle: 'Netlerini kaydet ve gelişimini gör', icon: 'edit-3', route: '/exams' },
  { title: 'Yanlış soru deposu', subtitle: 'Yanlışlarını ekle, hafta sonu tekrar çöz', icon: 'layers', route: '/wrongs' },
  { title: 'Müzik', subtitle: 'Çalma listeleri; derse müzikle başla', icon: 'music', route: '/music' },
  { title: 'Yapay zeka', subtitle: 'Program, deneme analizi, soru çözümü ve sohbet', icon: 'cpu', route: '/ai' },
  { title: 'Sohbet', subtitle: 'Okul, sınıf, arkadaş grupları ve birebir sohbet', icon: 'message-circle', route: '/chat' },
  { title: 'Arkadaşlarım', subtitle: 'WhatsApp ile birlikte çalış', icon: 'users', route: '/friends' },
  { title: 'Haftalık özet', subtitle: 'Bu haftaki emeğine birlikte bakalım', icon: 'trending-up', route: '/weekly' },
  { title: 'Şikayet / öneri', subtitle: 'Hata, öneri ya da şikayetini bize ilet', icon: 'flag', route: '/feedback' },
  { title: 'Ayarlar', subtitle: 'LGS tarihi, hedefin ve bildirimler', icon: 'settings', route: '/settings' },
];
const teacherItems: Item[] = [
  { title: 'Profilim', subtitle: 'Adın ve okulun', icon: 'user', route: '/profile' },
  { title: 'Sohbet', subtitle: 'Sınıflar, öğrenciler, okul grubu ve mesajlar', icon: 'message-circle', route: '/chat' },
  { title: 'Yapay zeka', subtitle: 'Asistanla konuş, program taslağı hazırla', icon: 'cpu', route: '/ai' },
  { title: 'Şikayet / öneri', subtitle: 'Hata, öneri ya da şikayetini bize ilet', icon: 'flag', route: '/feedback' },
  { title: 'Ayarlar', subtitle: 'Hesap, okul ve bildirimler', icon: 'settings', route: '/settings' },
];

export default function MoreScreen() {
  const colors = useColors();
  const { settings } = usePlanim();
  const onBar = new Set(middleKeys(settings));
  // Alt menüde zaten görünen ekranlar burada tekrar edilmez.
  const list = (settings.role === 'teacher' ? teacherItems : studentItems).filter((item) => { const k = navKeyForPath(item.route); return !(k && onBar.has(k)); });
  const open = (route: string) => router.push(route as never);
  return <Screen topBar><Header eyebrow="Kendine göre düzenle" title="Daha fazlası" subtitle="Alt menüde olmayan bölümler burada." /><View style={{ gap: 10 }}>{list.map((item) => <Pressable key={item.route} onPress={() => open(item.route)}><Card><View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}><View style={{ width: 45, height: 45, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent }}><Feather name={item.icon} size={20} color={colors.primary} /></View><View style={{ flex: 1 }}><Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '800' }}>{item.title}</Text><Text style={{ color: colors.mutedForeground, fontSize: 13, marginTop: 4 }}>{item.subtitle}</Text></View><Feather name="chevron-right" size={18} color={colors.mutedForeground} /></View></Card></Pressable>)}</View></Screen>;
}