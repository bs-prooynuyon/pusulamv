import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Linking, Text, View } from 'react-native';
import { Card, PrimaryButton, Screen } from '@/components/PlanimUI';
import { usePlanim } from '@/context/PlanimContext';
import { useSpotify } from '@/context/SpotifyContext';
import { useColors } from '@/hooks/useColors';
import { friendlySpotifyError, playUri } from '@/lib/spotify';
import { openTrack } from '@/lib/music';

export default function LessonStartScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { lessons, settings, playlists } = usePlanim();
  const spotify = useSpotify();
  const [busy, setBusy] = useState(false);
  const lesson = lessons.find((item) => item.id === id);

  const playlist = playlists.find((item) => item.id === lesson?.playlistId);
  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  if (!lesson) {
    return <Screen><View style={{ flex: 1, justifyContent: 'center', gap: 16 }}><Text style={{ color: colors.foreground, fontSize: 18, fontWeight: '800', textAlign: 'center' }}>Bu ders programda bulunamadı.</Text><PrimaryButton label="Ana sayfa" onPress={() => router.replace('/')} /></View></Screen>;
  }

  const begin = async () => {
    setBusy(true);
    try {
      if (playlist?.tracks[0]) await openTrack(playlist.tracks[0]);
      else if (lesson.spotifyTrackUri) {
        if (spotify.connected) await playUri(lesson.spotifyTrackUri);
        else await Linking.openURL(lesson.spotifyTrackUri);
      }
    } catch (cause) {
      Alert.alert('Müzik başlatılamadı', friendlySpotifyError(cause));
    } finally {
      setBusy(false);
    }
    if (settings.studyLockEnabled) router.replace(`/study-mode?id=${lesson.id}` as never);
    else close();
  };

  return <Screen scroll={false} style={{ flex: 1, justifyContent: 'center' }}>
    <View style={{ alignItems: 'center', gap: 14 }}>
      <View style={{ width: 86, height: 86, borderRadius: 30, backgroundColor: colors.destructive, alignItems: 'center', justifyContent: 'center' }}><Feather name="bell" size={38} color="#fff" /></View>
      <Text style={{ color: colors.destructive, fontWeight: '800', letterSpacing: 1.2, fontSize: 12 }}>DERS VAKTİ</Text>
      <Text style={{ color: colors.foreground, fontSize: 34, fontFamily: 'Georgia', fontWeight: '700', textAlign: 'center' }}>{lesson.name}</Text>
      <Text style={{ color: colors.mutedForeground, fontSize: 15 }}>{lesson.startTime} – {lesson.endTime}{lesson.place ? ` · ${lesson.place}` : ''}</Text>
    </View>
    {playlist ? <Card tone="mint" style={{ marginTop: 26 }}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><Feather name="music" size={18} color={colors.success} /><Text style={{ color: colors.success, fontWeight: '800', flex: 1 }}>{playlist.name} çalacak</Text></View></Card> : null}
    {!playlist && lesson.spotifyTrackUri ? <Card tone="mint" style={{ marginTop: 26 }}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><Feather name="music" size={18} color={colors.success} /><Text style={{ color: colors.success, fontWeight: '800', flex: 1 }}>{lesson.spotifyName || 'Seçtiğin müzik'} çalacak</Text></View></Card> : null}
    <View style={{ gap: 10, marginTop: 26 }}>
      <PrimaryButton label={busy ? 'Başlatılıyor…' : settings.studyLockEnabled ? 'Başladım · Çalışma modunu aç' : 'Başladım'} onPress={begin} icon="play" disabled={busy} />
      <PrimaryButton label="Kapat" onPress={close} icon="x" secondary />
    </View>
  </Screen>;
}
