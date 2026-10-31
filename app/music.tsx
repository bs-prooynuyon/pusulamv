import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { Card, Field, Header, PrimaryButton, Screen } from '@/components/PlanimUI';
import { ConfirmSheet } from '@/components/ConfirmSheet';
import { usePlanim } from '@/context/PlanimContext';
import { useColors } from '@/hooks/useColors';
import { keepFile } from '@/lib/files';
import { normalizeUrl, openTrack } from '@/lib/music';

/** Müzik: çalma listeleri (örn. "Mat müzik"). Link ekle ya da indirdiğin müziği yükle. */
export default function MusicScreen() {
  const colors = useColors();
  const { playlists, addPlaylist, removePlaylist, addTrack, removeTrack } = usePlanim();
  const [newName, setNewName] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [link, setLink] = useState('');
  const [title, setTitle] = useState('');
  const [toDelete, setToDelete] = useState<string | null>(null);

  const create = () => { if (!newName.trim()) return Alert.alert('Liste adı gerekli', 'Örn. Mat müzik'); setOpenId(addPlaylist(newName.trim())); setNewName(''); };
  const addLink = (playlistId: string) => {
    if (!link.trim()) return Alert.alert('Bağlantı boş', 'YouTube, Spotify vb. bağlantı yapıştır.');
    const url = normalizeUrl(link);
    addTrack(playlistId, { title: title.trim() || url.replace(/^https?:\/\/(www\.)?/, '').slice(0, 40), url, kind: 'link' });
    setLink(''); setTitle('');
  };
  const addFile = async (playlistId: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['audio/*', 'application/ogg', 'application/octet-stream'], copyToCacheDirectory: true, multiple: false });
      const asset = result.canceled ? null : result.assets[0];
      if (!asset) return;
      const ext = (asset.name.split('.').pop() || 'mp3').toLowerCase();
      addTrack(playlistId, { title: asset.name.replace(/\.[^.]+$/, ''), url: await keepFile(asset.uri, ext), kind: 'file' });
    } catch (error) { Alert.alert('Müzik yüklenemedi', `Tekrar dener misin?\n\nHata: ${error instanceof Error ? error.message : String(error)}`); }
  };

  return <Screen>
    <Header eyebrow="Derse müzikle başla" title="Müzik" subtitle="Çalma listeleri oluştur; ders programına eklerken listeden seç." />
    <Card>
      <Field label="Yeni çalma listesi" value={newName} onChangeText={setNewName} placeholder="Örn. Mat müzik" />
      <PrimaryButton label="Liste oluştur" onPress={create} icon="plus" />
    </Card>
    {playlists.length === 0 ? <Text style={{ color: colors.mutedForeground }}>Henüz çalma listesi yok.</Text> : null}
    {playlists.map((pl) => {
      const open = openId === pl.id;
      return <Card key={pl.id}>
        <Pressable onPress={() => setOpenId(open ? null : pl.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}><Feather name="music" size={19} color={colors.primary} /></View>
          <View style={{ flex: 1 }}><Text style={{ color: colors.foreground, fontWeight: '800', fontSize: 16 }}>{pl.name}</Text><Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 2 }}>{pl.tracks.length} müzik</Text></View>
          <Pressable onPress={() => setToDelete(pl.id)} hitSlop={8}><Feather name="trash-2" size={17} color={colors.mutedForeground} /></Pressable>
          <Feather name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.mutedForeground} />
        </Pressable>
        {open ? <View style={{ gap: 10 }}>
          {pl.tracks.map((t) => <View key={t.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 12, backgroundColor: colors.muted }}>
            <Pressable onPress={() => openTrack(t)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}><Feather name={t.kind === 'file' ? 'file' : 'link'} size={15} color={colors.primary} /><Text numberOfLines={1} style={{ flex: 1, color: colors.foreground, fontWeight: '700', fontSize: 13 }}>{t.title}</Text><Feather name="play" size={15} color={colors.primary} /></Pressable>
            <Pressable onPress={() => removeTrack(pl.id, t.id)} hitSlop={8}><Feather name="x" size={16} color={colors.mutedForeground} /></Pressable>
          </View>)}
          <Field label="Müzik bağlantısı" value={link} onChangeText={setLink} placeholder="https://youtu.be/… ya da open.spotify.com/…" />
          <Field label="Adı (isteğe bağlı)" value={title} onChangeText={setTitle} placeholder="Örn. Lofi 1 saat" />
          <PrimaryButton label="Bağlantıyı ekle" onPress={() => addLink(pl.id)} icon="link" />
          <PrimaryButton label="İndirdiğim müziği yükle" onPress={() => addFile(pl.id)} icon="upload" secondary />
          <Text style={{ color: colors.mutedForeground, fontSize: 11, lineHeight: 16 }}>Bağlantılar ilgili uygulamada açılır. Yüklenen dosya, seçtiğin müzik çalarda açılır.</Text>
        </View> : null}
      </Card>;
    })}
    <Pressable onPress={() => router.back()}><Text style={{ color: colors.primary, fontWeight: '700', textAlign: 'center' }}>Geri dön</Text></Pressable>
    <ConfirmSheet visible={!!toDelete} danger title="Liste silinsin mi?" text="Çalma listesi ve içindeki müzikler silinir. Derslerden de kalkar." confirmLabel="Sil" onCancel={() => setToDelete(null)} onConfirm={() => { if (toDelete) removePlaylist(toDelete); setToDelete(null); }} />
  </Screen>;
}
