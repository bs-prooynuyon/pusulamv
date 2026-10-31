import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Card, Field, PrimaryButton } from '@/components/PlanimUI';
import { useSpotify } from '@/context/SpotifyContext';
import { usePlanim } from '@/context/PlanimContext';
import { useColors } from '@/hooks/useColors';

export function SpotifyCard() {
  const colors = useColors();
  const { settings } = usePlanim();
  const spotify = useSpotify();
  const [clientId, setClientId] = useState(settings.spotifyClientId);

  return <Card tone="mint">
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}>
        <Feather name="music" size={20} color={colors.success} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.foreground, fontWeight: '800', fontSize: 15 }}>Spotify hesabı</Text>
        <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 3, lineHeight: 17 }}>
          {spotify.connected ? `Bağlı: ${spotify.userName || 'Spotify hesabın'}` : 'Ders başlayınca seçtiğin müzik otomatik çalsın.'}
        </Text>
      </View>
    </View>
    {!spotify.connected && spotify.needsClientId && !settings.spotifyClientId ? <Field label="Kurulum kodu (Client ID)" value={clientId} onChangeText={setClientId} placeholder="Developer Dashboard'dan kopyala" /> : null}
    {spotify.error ? <Text style={{ color: colors.destructive, fontSize: 12, lineHeight: 17 }}>{spotify.error}</Text> : null}
    {spotify.connected
      ? <PrimaryButton label="Bağlantıyı kes" onPress={spotify.disconnect} icon="x" secondary />
      : <PrimaryButton label={spotify.busy ? 'Bağlanıyor…' : 'Spotify ile eşle'} onPress={() => spotify.connect(clientId)} icon="link" disabled={spotify.busy} />}
    <Text style={{ color: colors.mutedForeground, fontSize: 11, lineHeight: 16 }}>Müziği doğrudan başlatmak için Spotify Premium gerekir. Ücretsiz hesapta Spotify açılır, oynat tuşuna senin basman gerekir.</Text>
  </Card>;
}
