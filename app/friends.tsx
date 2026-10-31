import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Linking, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Card, Field, Header, PrimaryButton, Screen } from '@/components/PlanimUI';
import { usePlanim } from '@/context/PlanimContext';
import { useColors } from '@/hooks/useColors';
import { whatsappUrl } from '@/lib/whatsapp';

export default function FriendsScreen() {
  const colors = useColors();
  const { friends, addFriend, removeFriend } = usePlanim();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const save = () => {
    if (!name.trim() || phone.replace(/\D/g, '').length < 10) return Alert.alert('Eksik bilgi', 'Arkadaşının adını ve WhatsApp numarasını yaz.');
    addFriend({ name: name.trim(), phone: phone.trim() }); setName(''); setPhone('');
  };
  const open = (phoneNumber: string) => Linking.openURL(whatsappUrl(phoneNumber)).catch(() => Alert.alert('WhatsApp açılamadı', 'Telefonda WhatsApp kurulu mu?'));
  return <Screen>
    <Header eyebrow="Birlikte daha güçlü" title="Arkadaşlarım" subtitle="Çalışma arkadaşlarının WhatsApp numaralarını kaydet, tek dokunuşla sohbeti aç." />
    <PrimaryButton label="Kullanıcı adıyla arkadaş ekle" onPress={() => router.push('/buddies' as never)} icon="users" />
    <Card tone="pink"><Field label="Adı" value={name} onChangeText={setName} placeholder="Örn. Elif" /><Field label="WhatsApp numarası" value={phone} onChangeText={setPhone} placeholder="5xx xxx xx xx" keyboardType="numeric" /><PrimaryButton label="Arkadaş ekle" onPress={save} icon="user-plus" /></Card>
    {friends.length === 0 ? <Text style={{ color: colors.mutedForeground }}>Henüz arkadaş eklenmedi.</Text> : null}
    {friends.map((friend) => <Card key={friend.id}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View><Text style={{ color: colors.foreground, fontWeight: '800', fontSize: 16 }}>{friend.name}</Text><Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 2 }}>{friend.phone}</Text></View>
        <Pressable onPress={() => removeFriend(friend.id)}><Feather name="trash-2" size={17} color={colors.mutedForeground} /></Pressable>
      </View>
      <PrimaryButton label="WhatsApp’ta aç (sesli / görüntülü arama için)" onPress={() => open(friend.phone)} icon="message-circle" />
      <Text style={{ color: colors.mutedForeground, fontSize: 11, lineHeight: 16 }}>WhatsApp, başka uygulamaların aramayı kendi başına başlatmasına izin vermiyor. Sohbet açılınca üstteki telefon ya da kamera simgesine basarsın.</Text>
    </Card>)}
  </Screen>;
}
