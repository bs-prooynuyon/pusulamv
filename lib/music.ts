import { Alert, Linking } from 'react-native';
import { Track } from '@/types/planim';

/** Link ise ilgili uygulamada (YouTube, Spotify…), dosya ise "birlikte aç" listesiyle açar. */
export async function openTrack(track: Track) {
  try {
    if (track.kind === 'file') {
      const Sharing = require('expo-sharing');
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(track.url, { dialogTitle: 'Müzik çalar seç' });
      return;
    }
    await Linking.openURL(track.url);
  } catch {
    Alert.alert('Müzik açılamadı', 'Bağlantıyı ya da müzik uygulamasını kontrol et.');
  }
}

export const normalizeUrl = (value: string) => { const v = value.trim(); return /^https?:\/\//i.test(v) || /^spotify:/i.test(v) ? v : `https://${v}`; };
