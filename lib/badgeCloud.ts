import { doc, getDoc, setDoc } from '@react-native-firebase/firestore';
import { getUserId } from '@/lib/cloud';
import { db } from '@/lib/firebase';

export interface UserBadges { earned: string[]; pinned: string[] }

/** Kendi rozetlerimi profile yazar: başkaları ismimin yanında görebilsin. */
export async function publishBadges(earned: string[], pinned: string[]) {
  const uid = await getUserId();
  await setDoc(doc(db(), 'profiles', uid), { badges: earned.slice(0, 80), pinned: pinned.slice(0, 3), updatedAt: new Date().toISOString() }, { merge: true });
  cache.delete(uid);
}

const cache = new Map<string, { at: number; p: Promise<UserBadges> }>();
const TTL = 5 * 60 * 1000;

/** Bir kullanıcının rozetleri (5 dakika önbellekli; aynı kişi için art arda istek atılmaz). */
export function fetchBadges(uid: string): Promise<UserBadges> {
  const hit = cache.get(uid);
  if (hit && Date.now() - hit.at < TTL) return hit.p;
  const p = getDoc(doc(db(), 'profiles', uid)).then((snap) => {
    const d = snap.exists() ? snap.data() : undefined;
    const list = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
    return { earned: list(d?.badges), pinned: list(d?.pinned) };
  }).catch(() => ({ earned: [], pinned: [] } as UserBadges));
  cache.set(uid, { at: Date.now(), p });
  return p;
}
