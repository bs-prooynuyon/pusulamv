import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

/** Galeriden kare bir profil fotoğrafı seçer; küçük bir base64 verisi döndürür (iptal ederse null). */
export async function pickProfilePhoto(): Promise<string | null> {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.3, base64: true });
    const asset = result.canceled ? null : result.assets[0];
    return asset?.base64 ? `data:image/jpeg;base64,${asset.base64}` : null;
  } catch {
    Alert.alert('Fotoğraf seçilemedi', 'Tekrar deneyebilirsin.');
    return null;
  }
}
