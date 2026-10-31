import { FirebaseAuthTypes, GoogleAuthProvider, createUserWithEmailAndPassword, onAuthStateChanged, sendEmailVerification, sendPasswordResetEmail, signInWithCredential, signInWithEmailAndPassword, signOut, updateProfile, verifyBeforeUpdateEmail } from '@react-native-firebase/auth';
import { doc, getDoc, setDoc } from '@react-native-firebase/firestore';
import { CONFIG } from '@/config';
import { auth, db, firebaseConfigured } from '@/lib/firebase';

export { deleteAccountOnServer } from '@/lib/account';

/**
 * Hesap (Firebase Authentication) + verinin bulutta saklanması (Firestore).
 * Aynı hesapla başka telefondan girilince aynı veriler açılır.
 * Eski adlar korunuyor: ekranlar Session ile çalışmaya devam eder.
 */
export interface Session { userId: string; email: string }

export const cloudConfigured = () => firebaseConfigured();

/** Firebase hata kodlarını Türkçe, anlaşılır cümleye çevirir. */
export function authMessage(e: unknown): string {
  const code = (e as { code?: string } | null)?.code ?? '';
  const map: Record<string, string> = {
    'auth/invalid-email': 'E-posta adresi hatalı.',
    'auth/email-already-in-use': 'Bu e-postayla zaten bir hesap var. Giriş yapmayı dene.',
    'auth/weak-password': 'Şifre en az 8 karakter olmalı.',
    'auth/invalid-credential': 'E-posta ya da şifre hatalı.',
    'auth/wrong-password': 'E-posta ya da şifre hatalı.',
    'auth/user-not-found': 'E-posta ya da şifre hatalı.',
    'auth/too-many-requests': 'Çok fazla deneme yapıldı. Biraz bekleyip tekrar dene.',
    'auth/network-request-failed': 'İnternet bağlantını kontrol edip tekrar dene.',
    'auth/requires-recent-login': 'Güvenlik için çıkış yapıp tekrar giriş yapman gerekiyor.',
    'auth/user-disabled': 'Bu hesap kapatılmış.',
    'auth/operation-not-allowed': 'Bu giriş yöntemi şu an kapalı. Firebase > Authentication > Sign-in method bölümünden açılmalı.',
    'auth/app-not-authorized': 'Uygulama Firebase tarafından tanınmadı. SHA-1 / SHA-256 parmak izleri eklenmemiş olabilir. (auth/app-not-authorized)',
    'auth/internal-error': 'Firebase iç hata verdi. SHA parmak izleri ve google-services.json dosyasını kontrol et. (auth/internal-error)',
  };
  if (map[code]) return map[code];
  const msg = e instanceof Error && e.message ? e.message : 'Tekrar dener misin?';
  return code && !msg.includes(code) ? `${msg} (${code})` : msg;
}

type User = FirebaseAuthTypes.User;
// Google girişinde e-posta doğrulaması gerekmez (Google kimliği zaten doğruladı); e-posta+şifre ile girenlerde zorunlu.
const verified = (u: User) => u.emailVerified || u.providerData.some((p) => p.providerId === 'google.com');
const toSession = (u: User): Session => ({ userId: u.uid, email: u.email || '' });

/** Kayıtlı oturum telefondan yüklenene kadar bekler. */
const authReady = () => new Promise<void>((resolve) => { const off = onAuthStateChanged(auth(), () => { off(); resolve(); }); });

/** Oturum açık ve e-posta doğrulanmışsa oturumu verir. */
export async function loadSession(): Promise<Session | null> {
  if (!cloudConfigured()) return null;
  try {
    await authReady();
    const u = auth().currentUser;
    return u && verified(u) ? toSession(u) : null;
  } catch { return null; }
}
export const freshSession = loadSession;

export async function getUserId(): Promise<string> {
  const s = await loadSession();
  if (!s) throw new Error('no-session');
  return s.userId;
}

export async function clearSession() { try { await signOut(auth()); } catch { /* yoksay */ } }

/** Yeni hesap: doğrulama e-postası yollar. Doğrulanana kadar giriş tamamlanmaz. */
/** Hesabı açar ve doğrulama maili yollar. Hesap açıldı ama mail gönderilemediyse false döner (kullanıcı "yeniden gönder"e basabilir). */
export async function signUpEmail(email: string, password: string): Promise<boolean> {
  const cred = await createUserWithEmailAndPassword(auth(), email.trim(), password);
  try { await sendEmailVerification(cred.user); return true; } catch { return false; }
}

/** Giriş. E-posta doğrulanmamışsa 'unverified' döner (doğrulama e-postası yeniden gönderilir). */
export async function signInEmail(email: string, password: string): Promise<Session | 'unverified'> {
  const cred = await signInWithEmailAndPassword(auth(), email.trim(), password);
  if (!verified(cred.user)) { try { await sendEmailVerification(cred.user); } catch { /* sık istek sınırı */ } return 'unverified'; }
  return toSession(cred.user);
}

/** "Doğruladım" butonu: kullanıcıyı yeniler, doğrulandıysa oturumu verir. */
export async function checkVerified(): Promise<Session | null> {
  const u = auth().currentUser;
  if (!u) return null;
  await u.reload();
  const fresh = auth().currentUser;
  return fresh && verified(fresh) ? toSession(fresh) : null;
}

export async function resendVerification() {
  const u = auth().currentUser;
  if (!u) throw new Error('Önce kayıt ol ya da giriş yap.');
  await sendEmailVerification(u);
}

export const sendReset = (email: string) => sendPasswordResetEmail(auth(), email.trim());

/** Google ile giriş. Telefonda hesap seçilir, kimlik belirteci Firebase'e verilir. */
export async function signInGoogle(): Promise<Session> {
  // Yerel modül yalnızca derlenmiş uygulamada var; import'u burada yapmak Expo Go'da çökmeyi önler.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { GoogleSignin, isSuccessResponse } = require('@react-native-google-signin/google-signin');
  GoogleSignin.configure({ webClientId: CONFIG.googleWebClientId });
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  // Önceki hesabı unut: her girişte hesap seçme ekranı çıksın (başka bir Google hesabıyla girilebilsin).
  try { await GoogleSignin.signOut(); } catch { /* ilk girişte oturum yok */ }
  // Telefon önceki hesabı hatırlayıp doğrudan seçmesin: izni de geri al (hesap seçme listesi yeniden açılır).
  try { await GoogleSignin.revokeAccess(); } catch { /* yoksay */ }
  const res = await GoogleSignin.signIn();
  if (!isSuccessResponse(res)) throw new Error('cancelled');
  const idToken = res.data?.idToken;
  if (!idToken) throw new Error('Google kimlik bilgisi alınamadı. Tekrar dener misin?');
  const cred = await signInWithCredential(auth(), GoogleAuthProvider.credential(idToken));
  return toSession(cred.user);
}

/** Yeni adrese doğrulama bağlantısı gider; bağlantıya tıklanınca e-posta değişir. */
export async function requestEmailChange(newEmail: string) {
  const u = auth().currentUser;
  if (!u) throw new Error('no-session');
  await verifyBeforeUpdateEmail(u, newEmail.trim());
}

export async function setDisplayName(name: string) {
  const u = auth().currentUser;
  if (u && name) { try { await updateProfile(u, { displayName: name }); } catch { /* önemsiz */ } }
}

const stateRef = (uid: string) => doc(db(), 'users', uid, 'private', 'state');
const MAX_STATE = 900_000; // Firestore belgesi 1 MiB ile sınırlı

export async function pullState<T>(): Promise<T | null> {
  const uid = await getUserId();
  const snap = await getDoc(stateRef(uid));
  const raw = snap.exists() ? (snap.data().data as string | undefined) : undefined;
  return raw ? (JSON.parse(raw) as T) : null;
}

export async function pushState(data: unknown) {
  const uid = await getUserId();
  const raw = JSON.stringify(data);
  if (raw.length > MAX_STATE) throw new Error('Veri çok büyük, buluta yazılamadı.');
  await setDoc(stateRef(uid), { data: raw, updatedAt: new Date().toISOString() });
}
