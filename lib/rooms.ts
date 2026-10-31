import { collection, deleteDoc, doc, getDocs, onSnapshot, query, setDoc, updateDoc, where } from '@react-native-firebase/firestore';
import { getUserId } from '@/lib/cloud';
import { db } from '@/lib/firebase';

/**
 * Birlikte çalışma odası. İki arkadaş aynı anda çalışma modundayken birbirinin durumunu görür.
 * rooms/{id} → { uids, hostUid, hostName, status }, rooms/{id}/presence/{uid} → { name, state, updatedAt }.
 * Oda yalnızca kabul edilmiş arkadaşlar arasında açılabilir (firestore.rules).
 */
const now = () => new Date().toISOString();
const ROOM_TTL = 3 * 3600000;
const STALE = 90000;

export interface RoomInvite { id: string; host_name: string }
export interface Mate { uid: string; name: string; state: 'studying' | 'break' | 'left'; fresh: boolean }

export async function createRoom(friendUid: string, hostName: string): Promise<string> {
  const uid = await getUserId();
  const ref = doc(collection(db(), 'rooms'));
  await setDoc(ref, { uids: [uid, friendUid].sort(), hostUid: uid, hostName: hostName.slice(0, 40), status: 'open', createdAt: now() });
  return ref.id;
}

/** Bana gelen açık oda davetleri (3 saatten eski ve kapanmış odalar sayılmaz). */
export async function subscribeRoomInvites(onData: (r: RoomInvite[]) => void): Promise<() => void> {
  const uid = await getUserId();
  return onSnapshot(query(collection(db(), 'rooms'), where('uids', 'array-contains', uid)),
    (snap) => onData(snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as { status?: string; hostUid?: string; hostName?: string; createdAt?: string }) }))
      .filter((r) => r.status === 'open' && r.hostUid !== uid && Date.now() - new Date(r.createdAt ?? 0).getTime() < ROOM_TTL)
      .map((r) => ({ id: r.id, host_name: r.hostName ?? 'Arkadaşın' }))),
    () => onData([]));
}

export const closeRoom = (roomId: string) => updateDoc(doc(db(), 'rooms', roomId), { status: 'closed' });

export async function publishPresence(roomId: string, name: string, state: 'studying' | 'break' | 'left') {
  const uid = await getUserId();
  await setDoc(doc(db(), 'rooms', roomId, 'presence', uid), { name: name.slice(0, 40), state, updatedAt: Date.now() });
}

/** Odadaki diğer kişilerin durumunu canlı dinler. */
export async function subscribePresence(roomId: string, onData: (m: Mate[]) => void): Promise<() => void> {
  const uid = await getUserId();
  return onSnapshot(collection(db(), 'rooms', roomId, 'presence'),
    (snap) => onData(snap.docs.filter((d) => d.id !== uid).map((d) => {
      const r = d.data();
      return { uid: d.id, name: String(r.name ?? 'Arkadaşın'), state: (r.state === 'break' || r.state === 'left') ? r.state as 'break' | 'left' : 'studying' as const, fresh: Date.now() - Number(r.updatedAt ?? 0) < STALE };
    })),
    () => onData([]));
}

export async function leaveRoom(roomId: string, name: string, isHost: boolean) {
  try { await publishPresence(roomId, name, 'left'); } catch { /* yoksay */ }
  if (isHost) { try { await closeRoom(roomId); } catch { /* yoksay */ } }
}
export async function roomHasMembers(roomId: string) { return (await getDocs(collection(db(), 'rooms', roomId, 'presence'))).size; }

/** Kapanmış ya da 3 saatten eski odaları (ve içindeki durum kayıtlarını) siler. Uygulama açılırken çağrılır. */
export async function cleanupRooms() {
  const uid = await getUserId();
  const snap = await getDocs(query(collection(db(), 'rooms'), where('uids', 'array-contains', uid)));
  for (const d of snap.docs) {
    const r = d.data() as { status?: string; createdAt?: string };
    const old = Date.now() - new Date(r.createdAt ?? 0).getTime() >= ROOM_TTL;
    if (r.status !== 'closed' && !old) continue;
    try {
      const presence = await getDocs(collection(db(), 'rooms', d.id, 'presence'));
      await Promise.all(presence.docs.map((x) => deleteDoc(x.ref)));
      await deleteDoc(d.ref);
    } catch { /* yetki ya da bağlantı yoksa sonraki açılışta tekrar denenir */ }
  }
}
