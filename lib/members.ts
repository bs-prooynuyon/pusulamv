import { addDoc, collection, deleteDoc, doc, limit, onSnapshot, orderBy, query, updateDoc } from '@react-native-firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * Öğretmen ↔ öğrenci özel yazışma ve program gönderme.
 * Her üyelik belgesi (members/{sinifId_ogrenciId}) altında `messages` ve `programs` alt koleksiyonları vardır;
 * yalnızca o sınıfın öğretmeni ve o öğrenci okuyup yazabilir (firestore.rules).
 */
export interface ThreadMsg { id: string; sender_id: string; sender_name: string; body: string; kind: 'text' | 'program-request'; created_at: string }
export interface PlanLesson { day: number; name: string; startTime: string; endTime: string; topics: string[] }
export interface ProgramRow { id: string; title: string; note: string; lessons: PlanLesson[]; saved: boolean; created_at: string }

const now = () => new Date().toISOString();
export const memberId = (classId: string, studentId: string) => `${classId}_${studentId}`;

export function subscribeThread(mid: string, onData: (m: ThreadMsg[]) => void, onError?: (e: unknown) => void) {
  const q = query(collection(db(), 'members', mid, 'messages'), orderBy('createdAt', 'desc'), limit(100));
  return onSnapshot(q, (snap) => onData(snap.docs.map((d) => {
    const r = d.data();
    return { id: d.id, sender_id: String(r.senderId ?? ''), sender_name: String(r.senderName ?? ''), body: String(r.body ?? ''), kind: r.kind === 'program-request' ? 'program-request' as const : 'text' as const, created_at: String(r.createdAt ?? now()) };
  }).reverse()), (e) => onError?.(e));
}

export const sendThreadMessage = (mid: string, senderId: string, senderName: string, body: string, kind: 'text' | 'program-request' = 'text') =>
  addDoc(collection(db(), 'members', mid, 'messages'), { senderId, senderName, body, kind, createdAt: now() });

export const deleteThreadMessage = (mid: string, id: string) => deleteDoc(doc(db(), 'members', mid, 'messages', id));

export function subscribePrograms(mid: string, onData: (p: ProgramRow[]) => void, onError?: (e: unknown) => void) {
  const q = query(collection(db(), 'members', mid, 'programs'), orderBy('createdAt', 'desc'), limit(10));
  return onSnapshot(q, (snap) => onData(snap.docs.map((d) => {
    const r = d.data();
    return { id: d.id, title: String(r.title ?? 'Ders programı'), note: String(r.note ?? ''), lessons: Array.isArray(r.lessons) ? (r.lessons as PlanLesson[]) : [], saved: !!r.saved, created_at: String(r.createdAt ?? now()) };
  })), (e) => onError?.(e));
}

export const sendProgram = (mid: string, teacherId: string, studentId: string, title: string, note: string, lessons: PlanLesson[]) =>
  addDoc(collection(db(), 'members', mid, 'programs'), { teacherId, studentId, title: title.slice(0, 80), note: note.slice(0, 500), lessons, saved: false, createdAt: now() });

export const markProgramSaved = (mid: string, id: string) => updateDoc(doc(db(), 'members', mid, 'programs', id), { saved: true });
export const deleteProgram = (mid: string, id: string) => deleteDoc(doc(db(), 'members', mid, 'programs', id));

/** Yazışmadaki bir mesajı uygulama yöneticisine bildirir (Firebase > Firestore > `reports`). */
export async function reportThreadMessage(m: ThreadMsg, reporterId: string, reason: string, label: string) {
  await addDoc(collection(db(), 'reports'), { messageId: m.id, groupId: 'member', groupName: label, reporterId, senderId: m.sender_id, senderName: m.sender_name, body: m.body.slice(0, 500), reason, createdAt: now() });
}
