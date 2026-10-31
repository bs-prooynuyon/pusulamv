import { getAuth } from '@react-native-firebase/auth';
import { getFirestore } from '@react-native-firebase/firestore';
import { CONFIG } from '@/config';

/**
 * Firebase yerel (native) paketlerle çalışır. Bağlantı bilgileri derleme sırasında google-services.json'dan gelir.
 * Oturum telefonda kendiliğinden saklanır; uygulama kapanınca çıkış yapılmaz.
 */
export const firebaseConfigured = () => !!CONFIG.firebase.apiKey && !!CONFIG.firebase.projectId;

let langSet = false;
/** Doğrulama ve şifre sıfırlama mailleri Türkçe gitsin diye dil kodu bir kez ayarlanır (Firebase belgesi: Kullanıcıları yönetme). */
export const auth = () => {
  const a = getAuth();
  if (!langSet) {
    langSet = true;
    try { (a as unknown as { languageCode: string | null }).languageCode = 'tr'; } catch { /* dil ayarı mail dilini etkiler, giriş için şart değil */ }
  }
  return a;
};
export const db = () => getFirestore();
