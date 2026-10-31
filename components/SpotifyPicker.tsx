import { Feather } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { fetchPlaylists, friendlySpotifyError, searchTracks, SpotifyItem } from '@/lib/spotify';

export function SpotifyPicker({ visible, onClose, onPick }: { visible: boolean; onClose: () => void; onPick: (item: SpotifyItem) => void }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [playlists, setPlaylists] = useState<SpotifyItem[]>([]);
  const [results, setResults] = useState<SpotifyItem[] | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    setError(null);
    fetchPlaylists().then(setPlaylists).catch((cause) => setError(friendlySpotifyError(cause))).finally(() => setLoading(false));
  }, [visible]);

  const search = async () => {
    if (!query.trim()) { setResults(null); return; }
    setLoading(true);
    setError(null);
    try { setResults(await searchTracks(query.trim())); } catch (cause) { setError(friendlySpotifyError(cause)); } finally { setLoading(false); }
  };

  const list = results ?? playlists;
  return <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top + 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, gap: 10 }}>
        <TextInput value={query} onChangeText={setQuery} onSubmitEditing={search} returnKeyType="search" placeholder="Şarkı ara…" placeholderTextColor={colors.mutedForeground} style={{ flex: 1, height: 46, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, paddingHorizontal: 14, color: colors.foreground }} />
        <Pressable onPress={onClose} hitSlop={10}><Feather name="x" size={24} color={colors.foreground} /></Pressable>
      </View>
      <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: '700', marginHorizontal: 18, marginTop: 14, marginBottom: 6 }}>{results ? 'ARAMA SONUÇLARI' : 'PLAYLISTLERİN'}</Text>
      {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} /> : null}
      {error ? <Text style={{ color: colors.destructive, marginHorizontal: 18, lineHeight: 19 }}>{error}</Text> : null}
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: insets.bottom + 24, gap: 8 }}>
        {list.map((item) => <Pressable key={item.uri} onPress={() => { onPick(item); onClose(); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 14, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
          {item.image ? <Image source={{ uri: item.image }} style={{ width: 44, height: 44, borderRadius: 8 }} /> : <View style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}><Feather name="music" size={18} color={colors.primary} /></View>}
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={{ color: colors.foreground, fontWeight: '700' }}>{item.name}</Text>
            <Text numberOfLines={1} style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 2 }}>{item.kind === 'playlist' ? 'Playlist' : 'Şarkı'} · {item.subtitle}</Text>
          </View>
        </Pressable>)}
        {!loading && !error && list.length === 0 ? <Text style={{ color: colors.mutedForeground, textAlign: 'center', marginTop: 20 }}>Sonuç bulunamadı.</Text> : null}
      </ScrollView>
    </View>
  </Modal>;
}
