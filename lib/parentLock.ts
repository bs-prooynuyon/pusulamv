import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const PIN_KEY = 'pusulam_parent_pin';
const AI_KEY = 'pusulam_ai_enabled';
const TRY_KEY = 'pusulam_pin_tries';
const MAX_TRIES = 5;
const LOCK_MS = 5 * 60_000;

async function hash(pin: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${pin}`);
}

export const validPin = (pin: string) => /^\d{4}$/.test(pin);

export async function hasParentPin(): Promise<boolean> {
  try { return !!(await SecureStore.getItemAsync(PIN_KEY)); } catch { return false; }
}

async function readTries(): Promise<{ fails: number; until: number }> {
  try { return JSON.parse((await SecureStore.getItemAsync(TRY_KEY)) || '') as { fails: number; until: number }; } catch { return { fails: 0, until: 0 }; }
}

/** PIN çok kez yanlış girilince kısa süre kilitlenir; kalan dakikayı döner (0 = kilitli değil). */
export async function pinLockMinutes(): Promise<number> {
  const t = await readTries();
  return t.until > Date.now() ? Math.ceil((t.until - Date.now()) / 60_000) : 0;
}

export async function verifyParentPin(pin: string): Promise<boolean> {
  try {
    if (await pinLockMinutes()) return false;
    const raw = await SecureStore.getItemAsync(PIN_KEY);
    if (!raw) return false;
    const i = raw.indexOf(':');
    const ok = (await hash(pin, raw.slice(0, i))) === raw.slice(i + 1);
    if (ok) { await SecureStore.deleteItemAsync(TRY_KEY); return true; }
    const t = await readTries();
    const fails = t.fails + 1;
    await SecureStore.setItemAsync(TRY_KEY, JSON.stringify(fails >= MAX_TRIES ? { fails: 0, until: Date.now() + LOCK_MS } : { fails, until: 0 }));
    return false;
  } catch { return false; }
}

/** İlk kez PIN koyar. PIN zaten varsa değiştirmek için eski PIN gerekir. */
export async function setParentPin(pin: string, oldPin?: string): Promise<boolean> {
  if (!validPin(pin)) return false;
  if (await hasParentPin() && !(await verifyParentPin(oldPin ?? ''))) return false;
  const salt = Math.random().toString(36).slice(2) + Date.now().toString(36);
  await SecureStore.setItemAsync(PIN_KEY, `${salt}:${await hash(pin, salt)}`);
  return true;
}

/** Yapay zekâ açık mı? Ayar hiç yapılmadıysa açık sayılır (reşit olmayanlar için initAiDefault kapatır). */
export async function aiAllowed(): Promise<boolean> {
  try { return (await SecureStore.getItemAsync(AI_KEY)) !== '0'; } catch { return true; }
}

/** İlk açılışta bir kez: ayar yoksa ve kullanıcı 18 yaşından küçükse yapay zekâyı kapalı başlatır. */
export async function initAiDefault(birthYear?: number): Promise<void> {
  try {
    if ((await SecureStore.getItemAsync(AI_KEY)) !== null) return;
    if (birthYear && new Date().getFullYear() - birthYear < 18) await SecureStore.setItemAsync(AI_KEY, '0');
  } catch { /* yoksay */ }
}

/** Açmak ya da kapatmak için ebeveyn PIN'i gerekir. */
export async function setAiEnabled(on: boolean, pin: string): Promise<boolean> {
  if (!(await verifyParentPin(pin))) return false;
  await SecureStore.setItemAsync(AI_KEY, on ? '1' : '0');
  return true;
}
