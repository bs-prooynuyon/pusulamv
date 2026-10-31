import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { classMembers, myClasses, myInvites, myRequests } from '@/lib/classes';
import { getUserId } from '@/lib/cloud';

/** Bildirim kutusundaki tek bir satır. `actionable` = kullanıcının bir şey yapması bekleniyor (rozette her zaman sayılır). */
export interface InboxItem {
  id: string;
  kind: 'report-request' | 'class-invite' | 'report-approved' | 'report-declined';
  title: string;
  body: string;
  at: string;
  actionable: boolean;
  /** Dokununca açılacak ekran. */
  href: string;
}

const SEEN_KEY = (uid: string) => `inbox_seen_v1:${uid}`;
const PUSHED_KEY = (uid: string) => `inbox_pushed_v1:${uid}`;

const readSet = async (key: string): Promise<Set<string>> => {
  try { const raw = await AsyncStorage.getItem(key); return new Set(raw ? (JSON.parse(raw) as string[]) : []); } catch { return new Set(); }
};
const writeSet = async (key: string, set: Set<string>) => {
  // Şişmesin: en yeni 300 kimlik yeter.
  try { await AsyncStorage.setItem(key, JSON.stringify([...set].slice(-300))); } catch { /* depolama dolu */ }
};

const rangeText = (from: string, to: string) => (from === to ? from : `${from} – ${to}`);

/** Öğrenci: bekleyen rapor istekleri ve sınıf davetleri. Öğretmen: öğrencilerin verdiği cevaplar. */
export async function fetchInbox(role: 'teacher' | 'student'): Promise<InboxItem[]> {
  const uid = await getUserId();
  const items: InboxItem[] = [];
  const [requests, classes, members] = await Promise.all([
    myRequests().catch(() => []),
    myClasses().catch(() => []),
    classMembers().catch(() => []),
  ]);
  const className = (id: string) => classes.find((c) => c.id === id)?.name ?? 'Sınıf';
  const studentName = (classId: string, studentId: string) => members.find((m) => m.class_id === classId && m.student_id === studentId)?.student_name ?? 'Bir öğrenci';

  if (role === 'teacher') {
    requests.filter((r) => r.teacher_id === uid && r.status !== 'pending').forEach((r) => {
      const name = r.report?.studentName || studentName(r.class_id, r.student_id);
      items.push(r.status === 'approved'
        ? { id: `ans_${r.id}_approved`, kind: 'report-approved', title: `${name} raporunu gönderdi`, body: `${className(r.class_id)} · ${rangeText(r.from_date, r.to_date)}`, at: r.created_at, actionable: false, href: `/member?classId=${r.class_id}&studentId=${r.student_id}&name=${encodeURIComponent(name)}` }
        : { id: `ans_${r.id}_declined`, kind: 'report-declined', title: `${name} rapor isteğini reddetti`, body: `${className(r.class_id)} · ${rangeText(r.from_date, r.to_date)}`, at: r.created_at, actionable: false, href: `/member?classId=${r.class_id}&studentId=${r.student_id}&name=${encodeURIComponent(name)}` });
    });
  } else {
    requests.filter((r) => r.student_id === uid && r.teacher_id !== uid && r.status === 'pending').forEach((r) => {
      items.push({ id: `req_${r.id}`, kind: 'report-request', title: 'Öğretmenin rapor istiyor', body: `${className(r.class_id)} · ${rangeText(r.from_date, r.to_date)}. Onaylarsan çalışma özetin öğretmene gider.`, at: r.created_at, actionable: true, href: '/chat' });
    });
    (await myInvites().catch(() => [])).forEach((i) => {
      items.push({ id: `inv_${i.id}`, kind: 'class-invite', title: `${i.teacher_name} seni sınıfına davet etti`, body: i.class_name, at: i.created_at, actionable: true, href: '/chat' });
    });
  }
  return items.sort((a, b) => b.at.localeCompare(a.at));
}

/** Rozet sayısı: bekleyen işler + henüz görülmemiş cevaplar. */
export async function unreadCount(items: InboxItem[]): Promise<number> {
  const uid = await getUserId();
  const seen = await readSet(SEEN_KEY(uid));
  return items.filter((i) => i.actionable || !seen.has(i.id)).length;
}

export async function markAllSeen(items: InboxItem[]) {
  const uid = await getUserId();
  const seen = await readSet(SEEN_KEY(uid));
  items.forEach((i) => seen.add(i.id));
  await writeSet(SEEN_KEY(uid), seen);
}

export async function seenIds(): Promise<Set<string>> {
  return readSet(SEEN_KEY(await getUserId()));
}

async function ensureInboxChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('inbox', {
    name: 'Sınıf bildirimleri',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 150, 250],
    sound: 'default',
  });
}

/**
 * Daha önce telefona bildirim olarak gönderilmemiş satırlar için bildirim çıkarır.
 * Çok sayıda yeni satır varsa tek bir özet bildirim gider (bildirim yağmuru olmasın).
 */
export async function pushNewItems(items: InboxItem[]) {
  const uid = await getUserId();
  const pushed = await readSet(PUSHED_KEY(uid));
  const unpushed = items.filter((i) => !pushed.has(i.id));
  // Eski kayıtlar (ilk kurulumda gelen geçmiş) için bildirim çıkarma; sessizce işaretle.
  const recent = (i: InboxItem) => Date.now() - Date.parse(i.at) < 7 * 86400000;
  const fresh = unpushed.filter(recent);
  const stale = unpushed.filter((i) => !recent(i));
  if (stale.length) { stale.forEach((i) => pushed.add(i.id)); await writeSet(PUSHED_KEY(uid), pushed); }
  if (!fresh.length) return;
  const perm = await Notifications.getPermissionsAsync();
  // İzin yoksa işaretleme: kullanıcı izni sonradan verirse bildirim yine gelsin.
  if (!perm.granted) return;
  await ensureInboxChannel();
  try {
    if (fresh.length <= 3) {
      for (const i of fresh) {
        await Notifications.scheduleNotificationAsync({ content: { title: i.title, body: i.body, data: { href: i.href }, ...(Platform.OS === 'android' ? { channelId: 'inbox' } : {}) }, trigger: null });
      }
    } else {
      await Notifications.scheduleNotificationAsync({ content: { title: `${fresh.length} yeni bildirimin var`, body: 'Bildirimler ekranından hepsine bakabilirsin.', data: { href: '/inbox' }, ...(Platform.OS === 'android' ? { channelId: 'inbox' } : {}) }, trigger: null });
    }
    fresh.forEach((i) => pushed.add(i.id));
    await writeSet(PUSHED_KEY(uid), pushed);
  } catch { /* bildirim gösterilemedi; sonraki turda tekrar denenir */ }
}
