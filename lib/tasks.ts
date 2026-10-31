import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, limit, onSnapshot, orderBy, query, setDoc } from '@react-native-firebase/firestore';
import { getUserId } from '@/lib/cloud';
import { db } from '@/lib/firebase';

/** Sınıf ödevleri ve hedefleri: groups/{sinifId}/tasks/{id}, tamamlayanlar tasks/{id}/done/{uid}. */
export interface TaskRow { id: string; group_id: string; title: string; note: string; kind: 'homework' | 'goal'; target_minutes: number; due: string; created_at: string }
const now = () => new Date().toISOString();

export function subscribeTasks(gid: string, onData: (t: TaskRow[]) => void, onError?: (e: unknown) => void) {
  const q = query(collection(db(), 'groups', gid, 'tasks'), orderBy('createdAt', 'desc'), limit(30));
  return onSnapshot(q, (snap) => onData(snap.docs.map((d) => {
    const r = d.data();
    return { id: d.id, group_id: gid, title: String(r.title ?? ''), note: String(r.note ?? ''), kind: r.kind === 'goal' ? 'goal' as const : 'homework' as const, target_minutes: Number(r.targetMinutes ?? 0), due: String(r.due ?? ''), created_at: String(r.createdAt ?? now()) };
  })), (e) => onError?.(e));
}

export async function createTask(gid: string, t: { title: string; note: string; kind: 'homework' | 'goal'; targetMinutes: number; due: string }) {
  const uid = await getUserId();
  await addDoc(collection(db(), 'groups', gid, 'tasks'), { teacherId: uid, title: t.title.slice(0, 100), note: t.note.slice(0, 500), kind: t.kind, targetMinutes: t.kind === 'goal' ? t.targetMinutes : 0, due: t.due, createdAt: now() });
}
export const deleteTask = (gid: string, id: string) => deleteDoc(doc(db(), 'groups', gid, 'tasks', id));

export async function isDone(gid: string, id: string): Promise<boolean> {
  const uid = await getUserId();
  return (await getDoc(doc(db(), 'groups', gid, 'tasks', id, 'done', uid))).exists();
}
export async function markDone(gid: string, id: string, name: string) {
  const uid = await getUserId();
  await setDoc(doc(db(), 'groups', gid, 'tasks', id, 'done', uid), { uid, name: name.slice(0, 40), doneAt: now() });
}
export async function undoDone(gid: string, id: string) {
  const uid = await getUserId();
  await deleteDoc(doc(db(), 'groups', gid, 'tasks', id, 'done', uid));
}
/** Öğretmen: görevi tamamlayanların adları. */
export async function doneNames(gid: string, id: string): Promise<string[]> {
  const snap = await getDocs(collection(db(), 'groups', gid, 'tasks', id, 'done'));
  return snap.docs.map((d) => String(d.data().name ?? ''));
}

export const DUE_CHOICES: Array<{ label: string; days: number }> = [{ label: 'Bugün', days: 0 }, { label: 'Yarın', days: 1 }, { label: '3 gün', days: 3 }, { label: '1 hafta', days: 7 }];
export const dueFrom = (days: number) => { const d = new Date(); d.setDate(d.getDate() + days); d.setHours(23, 59, 0, 0); return d.toISOString(); };
