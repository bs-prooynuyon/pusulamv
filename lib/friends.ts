import { collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, query, setDoc, where, writeBatch } from '@react-native-firebase/firestore';
import { getUserId } from '@/lib/cloud';
import { db } from '@/lib/firebase';

/**
 * Kullanıcı adı ve arkadaşlık.
 * usernames/{ad}            → { uid }                (ad → kişi; benzersizlik buradan gelir)
 * profiles/{uid}            → { username, name, weekKey, weekMinutes }
 * friendRequests/{ben_o}    → bekleyen istek
 * friendships/{kisaId_uzunId} → { uids: [a, b] }     (kabul edilmiş arkadaşlık)
 */
const now = () => new Date().toISOString();
const at = async <T,>(label: string, p: Promise<T>): Promise<T> => {
  try { return await p; } catch (e) { throw new Error(`[${label}] ${(e as { code?: string })?.code ?? (e instanceof Error ? e.message : 'hata')}`); }
};

export const normalizeUsername = (s: string) => s.trim().replace(/^@/, '').toLowerCase();
export const validUsername = (u: string) => /^[a-z0-9_]{3,20}$/.test(u);
export const USERNAME_HELP = 'Kullanıcı adı 3–20 karakter olmalı; yalnızca küçük harf (a-z), rakam ve alt çizgi (_) kullanılabilir.';

const pairId = (a: string, b: string) => [a, b].sort().join('_');

/** Bu haftanın başlangıcı (pazartesi) YYYY-AA-GG olarak. */
export function weekKey(d = new Date()) {
  const m = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  m.setDate(m.getDate() - ((m.getDay() + 6) % 7));
  return `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}-${String(m.getDate()).padStart(2, '0')}`;
}
export function weekMinutesOf(sessions: { date: string; durationMinutes: number }[]) {
  const key = weekKey();
  return sessions.filter((s) => weekKey(new Date(s.date)) === key).reduce((sum, s) => sum + s.durationMinutes, 0);
}

export interface Profile { uid: string; username: string; name: string; weekMinutes: number }
const toProfile = (uid: string, r: Record<string, unknown> | undefined): Profile => ({
  uid, username: String(r?.username ?? ''), name: String(r?.name ?? ''),
  weekMinutes: r && r.weekKey === weekKey() ? Number(r.weekMinutes ?? 0) : 0,
});

export async function myProfile(): Promise<Profile | null> {
  const uid = await getUserId();
  const snap = await at('profil okuma', getDoc(doc(db(), 'profiles', uid)));
  return snap.exists() && snap.data()?.username ? toProfile(uid, snap.data()) : null;
}

/** Kullanıcı adını alır ya da değiştirir. Eski ad serbest kalır. */
export async function claimUsername(raw: string, name: string): Promise<string> {
  const u = normalizeUsername(raw);
  if (!validUsername(u)) throw new Error(USERNAME_HELP);
  const uid = await getUserId();
  const mine = await at('profil okuma', getDoc(doc(db(), 'profiles', uid)));
  const old = mine.exists() ? String(mine.data()?.username ?? '') : '';
  if (old === u) { await at('profil yazma', setDoc(doc(db(), 'profiles', uid), { name: name.slice(0, 40) }, { merge: true })); return u; }
  const taken = await at('ad kontrolü', getDoc(doc(db(), 'usernames', u)));
  if (taken.exists()) throw new Error('Bu kullanıcı adı alınmış. Başka bir tane dene.');
  const batch = writeBatch(db());
  batch.set(doc(db(), 'usernames', u), { uid, createdAt: now() });
  batch.set(doc(db(), 'profiles', uid), { username: u, name: name.slice(0, 40), updatedAt: now() }, { merge: true });
  if (old) batch.delete(doc(db(), 'usernames', old));
  await at('kullanıcı adı alma', batch.commit());
  return u;
}

/** Kullanıcı adından kişiyi bulur (öğretmen daveti ve arkadaş isteği için). */
export async function findByUsername(raw: string): Promise<{ uid: string; username: string } | null> {
  const u = normalizeUsername(raw);
  if (!validUsername(u)) throw new Error(USERNAME_HELP);
  const snap = await at('ad arama', getDoc(doc(db(), 'usernames', u)));
  return snap.exists() ? { uid: String(snap.data()?.uid), username: u } : null;
}

export interface FriendRequest { id: string; from_uid: string; from_name: string; from_username: string }

export async function sendFriendRequest(raw: string, myName: string) {
  const me = await myProfile();
  if (!me) throw new Error('Önce kendi kullanıcı adını seç.');
  const target = await findByUsername(raw);
  if (!target) throw new Error('Bu kullanıcı adı bulunamadı.');
  if (target.uid === me.uid) throw new Error('Kendini arkadaş olarak ekleyemezsin.');
  if ((await at('arkadaşlık kontrolü', getDoc(doc(db(), 'friendships', pairId(me.uid, target.uid))))).exists()) throw new Error('Zaten arkadaşsınız.');
  if ((await at('istek kontrolü', getDoc(doc(db(), 'friendRequests', `${target.uid}_${me.uid}`)))).exists()) throw new Error('Bu kişi sana zaten istek göndermiş. Aşağıdan kabul edebilirsin.');
  await at('istek gönderme', setDoc(doc(db(), 'friendRequests', `${me.uid}_${target.uid}`), { fromUid: me.uid, toUid: target.uid, fromName: (myName || me.name).slice(0, 40), fromUsername: me.username, createdAt: now() }));
}

/** Gelen bekleyen istekleri canlı dinler. Dönen fonksiyon dinlemeyi bırakır. */
export async function subscribeIncoming(onData: (r: FriendRequest[]) => void): Promise<() => void> {
  const uid = await getUserId();
  return onSnapshot(query(collection(db(), 'friendRequests'), where('toUid', '==', uid)),
    (snap) => onData(snap.docs.map((d) => { const r = d.data(); return { id: d.id, from_uid: String(r.fromUid), from_name: String(r.fromName ?? ''), from_username: String(r.fromUsername ?? '') }; })),
    () => onData([]));
}

export async function acceptRequest(r: FriendRequest) {
  const uid = await getUserId();
  const batch = writeBatch(db());
  batch.set(doc(db(), 'friendships', pairId(uid, r.from_uid)), { uids: [uid, r.from_uid].sort(), createdAt: now() });
  batch.delete(doc(db(), 'friendRequests', r.id));
  await at('isteği kabul etme', batch.commit());
}
export const declineRequest = (id: string) => at('isteği silme', deleteDoc(doc(db(), 'friendRequests', id)));

export async function removeFriend(otherUid: string) {
  const uid = await getUserId();
  await at('arkadaşlıktan çıkarma', deleteDoc(doc(db(), 'friendships', pairId(uid, otherUid))));
}

/** Arkadaşlar ve bu haftaki çalışma dakikaları. */
export async function myFriends(): Promise<Profile[]> {
  const uid = await getUserId();
  const snap = await at('arkadaş listesi', getDocs(query(collection(db(), 'friendships'), where('uids', 'array-contains', uid))));
  const others = snap.docs.map((d) => ((d.data().uids as string[]) ?? []).find((x) => x !== uid)).filter((x): x is string => !!x);
  const profiles = await Promise.all(others.map(async (o) => { try { const p = await getDoc(doc(db(), 'profiles', o)); return toProfile(o, p.exists() ? p.data() : undefined); } catch { return toProfile(o, undefined); } }));
  return profiles;
}

/** Bu haftaki toplam çalışma süresini profile yazar (yalnızca kullanıcı adı alınmışsa). */
export async function publishWeekly(minutes: number) {
  const uid = await getUserId();
  const ref = doc(db(), 'profiles', uid);
  const snap = await getDoc(ref);
  if (!snap.exists() || !snap.data()?.username) return;
  await setDoc(ref, { weekKey: weekKey(), weekMinutes: Math.max(0, Math.round(minutes)), updatedAt: now() }, { merge: true });
}
