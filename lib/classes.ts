import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from '@react-native-firebase/firestore';
import { getUserId } from '@/lib/cloud';
import { findByUsername, normalizeUsername, validUsername } from '@/lib/friends';
import { auth, db } from '@/lib/firebase';

export interface ClassRow { id: string; name: string; code: string; teacher_id: string }
export interface MemberRow { class_id: string; student_id: string; student_name: string }
export interface RequestRow { id: string; class_id: string; student_id: string; teacher_id: string; from_date: string; to_date: string; status: 'pending' | 'approved' | 'declined'; report: ReportSummary | null; created_at: string }
export interface ReportSummary { studentName: string; focusMinutes: number; examCount: number; avgNet: number; solved: number; correct: number; wrong: number }

const now = () => new Date().toISOString();

/** Hata hangi adımda olduğunu söylesin: "[üyelik kontrolü] permission-denied" gibi. */
const at = async <T,>(label: string, p: Promise<T>): Promise<T> => {
  try { return await p; } catch (e) { throw new Error(`[${label}] ${(e as { code?: string })?.code ?? (e instanceof Error ? e.message : 'hata')}`); }
};

interface MemberDoc { classId: string; studentId: string; studentName: string; teacherId: string; className: string; code: string; joinedAt: string }

/** Öğretmen: kurduğu sınıflar. Öğrenci: katıldığı sınıflar. */
export async function myClasses(): Promise<ClassRow[]> {
  const uid = await getUserId();
  const [mine, joined] = await Promise.all([
    getDocs(query(collection(db(), 'classes'), where('teacherId', '==', uid))),
    getDocs(query(collection(db(), 'members'), where('studentId', '==', uid))),
  ]);
  const rows = new Map<string, ClassRow & { at: string }>();
  mine.docs.forEach((d) => { const c = d.data(); rows.set(d.id, { id: d.id, name: c.name, code: c.code, teacher_id: c.teacherId, at: c.createdAt ?? '' }); });
  joined.docs.forEach((d) => { const m = d.data() as MemberDoc; if (!rows.has(m.classId)) rows.set(m.classId, { id: m.classId, name: m.className, code: m.code, teacher_id: m.teacherId, at: m.joinedAt ?? '' }); });
  return [...rows.values()].sort((a, b) => b.at.localeCompare(a.at)).map(({ at: _at, ...row }) => row);
}

export async function classMembers(): Promise<MemberRow[]> {
  const uid = await getUserId();
  const [asTeacher, asStudent] = await Promise.all([
    getDocs(query(collection(db(), 'members'), where('teacherId', '==', uid))),
    getDocs(query(collection(db(), 'members'), where('studentId', '==', uid))),
  ]);
  const rows = new Map<string, MemberRow>();
  [...asTeacher.docs, ...asStudent.docs].forEach((d) => { const m = d.data() as MemberDoc; rows.set(d.id, { class_id: m.classId, student_id: m.studentId, student_name: m.studentName }); });
  return [...rows.values()];
}

export async function myRequests(): Promise<RequestRow[]> {
  const uid = await getUserId();
  const [asTeacher, asStudent] = await Promise.all([
    getDocs(query(collection(db(), 'requests'), where('teacherId', '==', uid))),
    getDocs(query(collection(db(), 'requests'), where('studentId', '==', uid))),
  ]);
  const rows = new Map<string, RequestRow>();
  [...asTeacher.docs, ...asStudent.docs].forEach((d) => {
    const r = d.data();
    rows.set(d.id, { id: d.id, class_id: r.classId, student_id: r.studentId, teacher_id: r.teacherId, from_date: r.fromDate, to_date: r.toDate, status: r.status, report: r.report ?? null, created_at: r.createdAt });
  });
  return [...rows.values()].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function joinClass(code: string, studentName: string) {
  const uid = await getUserId();
  const c = code.trim().toUpperCase();
  const found = await at('kod arama', getDoc(doc(db(), 'classCodes', c)));
  if (!found.exists()) throw new Error('Sınıf kodu bulunamadı');
  const k = found.data() as { classId: string; name: string; teacherId: string };
  const ref = doc(db(), 'members', `${k.classId}_${uid}`);
  if ((await at('üyelik kontrolü', getDoc(ref))).exists()) return k.classId;
  await at('sınıfa katılma', setDoc(ref, { classId: k.classId, studentId: uid, studentName, teacherId: k.teacherId, className: k.name, code: c, joinedAt: now() } satisfies MemberDoc));
  return k.classId;
}

export const leaveClass = async (classId: string) => { const uid = await getUserId(); await deleteDoc(doc(db(), 'members', `${classId}_${uid}`)); };

export async function requestReport(classId: string, studentId: string, from: string, to: string) {
  const uid = await getUserId();
  await addDoc(collection(db(), 'requests'), { classId, studentId, teacherId: uid, fromDate: from, toDate: to, status: 'pending', report: null, createdAt: now() });
}
export const answerRequest = (id: string, status: 'approved' | 'declined', report: ReportSummary | null) => updateDoc(doc(db(), 'requests', id), { status, report });

// ----- Davet: öğretmen öğrencinin e-postasını / telefonunu yazar, öğrenci kabul ederse sınıfa girer -----
export interface InviteRow { id: string; class_id: string; class_name: string; code: string; teacher_id: string; teacher_name: string; target: string; created_at: string }

/** E-postayı küçük harfe çevirir; geçersizse null. */
export function normalizeTarget(input: string): string | null {
  const t = input.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t) ? t.toLowerCase() : null;
}

const toInvite = (id: string, r: Record<string, unknown>): InviteRow => ({ id, class_id: String(r.classId), class_name: String(r.className ?? ''), code: String(r.code), teacher_id: String(r.teacherId), teacher_name: String(r.teacherName ?? 'Öğretmen'), target: String(r.target), created_at: String(r.createdAt ?? '') });

export async function inviteStudent(c: ClassRow, rawTarget: string, teacherName: string) {
  const uid = await getUserId();
  const email = normalizeTarget(rawTarget);
  if (!email) {
    // E-posta değilse kullanıcı adı sayılır: davet o kişinin hesabına gider.
    const uname = normalizeUsername(rawTarget);
    if (!validUsername(uname)) throw new Error('Kullanıcı adını yaz (örnek: elif_08). E-posta da yazabilirsin.');
    const found = await findByUsername(uname);
    if (!found) throw new Error('Bu kullanıcı adı bulunamadı. Öğrenci kullanıcı adını Arkadaşlar ekranından seçer.');
    await setDoc(doc(db(), 'invites', `${c.id}_u_${uname}`), { classId: c.id, className: c.name, code: c.code, teacherId: uid, teacherName, target: `@${uname}`, targetUid: found.uid, createdAt: now() });
    return;
  }
  const target = email;
  await setDoc(doc(db(), 'invites', `${c.id}_${target.replace(/[^a-z0-9+@.]/g, '')}`), { classId: c.id, className: c.name, code: c.code, teacherId: uid, teacherName, target, createdAt: now() });
}

/** Öğrenci: kendi e-postasına / telefonuna gelen bekleyen davetler. */
export async function myInvites(): Promise<InviteRow[]> {
  const u = auth().currentUser;
  const targets = [u?.email?.toLowerCase()].filter((x): x is string => !!x);
  const snaps = await Promise.all([
    ...targets.map((t) => getDocs(query(collection(db(), 'invites'), where('target', '==', t)))),
    getDocs(query(collection(db(), 'invites'), where('targetUid', '==', u?.uid ?? ''))),
  ]);
  const rows = new Map<string, InviteRow>();
  snaps.forEach((s) => s.docs.forEach((d) => rows.set(d.id, toInvite(d.id, d.data()))));
  return [...rows.values()];
}

/** Öğretmen: gönderdiği, henüz kabul edilmemiş davetler. */
export async function sentInvites(): Promise<InviteRow[]> {
  const uid = await getUserId();
  const snap = await getDocs(query(collection(db(), 'invites'), where('teacherId', '==', uid)));
  return snap.docs.map((d) => toInvite(d.id, d.data()));
}

export const removeInvite = (id: string) => deleteDoc(doc(db(), 'invites', id));
