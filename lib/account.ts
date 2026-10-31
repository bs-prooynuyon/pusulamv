import { deleteUser } from '@react-native-firebase/auth';
import { collection, deleteDoc, doc, FirebaseFirestoreTypes, getDoc, getDocs, query, where } from '@react-native-firebase/firestore';
import { auth, db } from '@/lib/firebase';

/** Küçük gruplar halinde siler (bir istekte çok belge göndermemek için). */
async function removeAll(refs: FirebaseFirestoreTypes.DocumentReference[]) {
  for (let i = 0; i < refs.length; i += 20) await Promise.all(refs.slice(i, i + 20).map((r) => deleteDoc(r)));
}

/**
 * Hesabı ve sunucudaki tüm verileri kalıcı olarak siler:
 * kendi mesajları, üyelikleri, kurduğu grup ve sınıflar, istekler, çalışma odaları, engeller, eşitlenen veri, ardından hesap.
 * Hesap silme "yakın zamanda giriş" ister; süre dolmuşsa veriler silinir ve kullanıcıdan yeniden giriş istenir.
 */
export async function deleteAccountOnServer() {
  const user = auth().currentUser;
  if (!user) throw new Error('no-session');
  const uid = user.uid;
  const d = db();

  // Üye olunan gruplar
  const memberships = await getDocs(query(collection(d, 'groupMembers'), where('userId', '==', uid)));
  for (const m of memberships.docs) {
    const g = m.data() as { groupId: string; ownerId: string | null; code: string | null };
    const msgs = g.ownerId === uid
      ? await getDocs(collection(d, 'groups', g.groupId, 'messages'))
      : await getDocs(query(collection(d, 'groups', g.groupId, 'messages'), where('senderId', '==', uid)));
    await removeAll(msgs.docs.map((x) => x.ref));
    if (g.ownerId === uid) {
      await removeAll((await getDocs(collection(d, 'groups', g.groupId, 'reports'))).docs.map((x) => x.ref));
      for (const t of (await getDocs(collection(d, 'groups', g.groupId, 'tasks'))).docs) {
        await removeAll((await getDocs(collection(d, 'groups', g.groupId, 'tasks', t.id, 'done'))).docs.map((x) => x.ref));
        await deleteDoc(t.ref);
      }
      const others = await getDocs(query(collection(d, 'groupMembers'), where('groupId', '==', g.groupId)));
      await removeAll(others.docs.filter((x) => x.id !== m.id).map((x) => x.ref));
      if (g.code) await deleteDoc(doc(d, 'groupCodes', g.code));
      await deleteDoc(m.ref);
      await deleteDoc(doc(d, 'groups', g.groupId));
    } else {
      await deleteDoc(m.ref);
    }
  }

  // Öğretmen olarak kurduğu sınıflar
  const classes = await getDocs(query(collection(d, 'classes'), where('teacherId', '==', uid)));
  for (const c of classes.docs) {
    await removeAll((await getDocs(query(collection(d, 'requests'), where('teacherId', '==', uid), where('classId', '==', c.id)))).docs.map((x) => x.ref));
    const mem = await getDocs(query(collection(d, 'members'), where('teacherId', '==', uid), where('classId', '==', c.id)));
    for (const m of mem.docs) {
      await removeAll((await getDocs(collection(d, 'members', m.id, 'messages'))).docs.map((x) => x.ref));
      await removeAll((await getDocs(collection(d, 'members', m.id, 'programs'))).docs.map((x) => x.ref));
    }
    await removeAll(mem.docs.map((x) => x.ref));
    await deleteDoc(doc(d, 'classCodes', String(c.data().code)));
    await deleteDoc(c.ref);
  }

  // Öğrenci olarak üyelikleri ve istekleri
  for (const m of (await getDocs(query(collection(d, 'members'), where('studentId', '==', uid)))).docs) {
    await removeAll((await getDocs(collection(d, 'members', m.id, 'messages'))).docs.map((x) => x.ref));
    await removeAll((await getDocs(collection(d, 'members', m.id, 'programs'))).docs.map((x) => x.ref));
  }
  await removeAll((await getDocs(query(collection(d, 'requests'), where('studentId', '==', uid)))).docs.map((x) => x.ref));
  await removeAll((await getDocs(query(collection(d, 'members'), where('studentId', '==', uid)))).docs.map((x) => x.ref));

  // Birlikte çalışma odaları (davetler dahil) ve oda içindeki durum bilgisi
  for (const r of (await getDocs(query(collection(d, 'rooms'), where('uids', 'array-contains', uid)))).docs) {
    await removeAll((await getDocs(collection(d, 'rooms', r.id, 'presence'))).docs.map((x) => x.ref));
    await deleteDoc(r.ref);
  }

  // Kullanıcı adı, arkadaş istekleri ve arkadaşlıklar
  const prof = await getDoc(doc(d, 'profiles', uid));
  const uname = prof.exists() ? String(prof.data()?.username ?? '') : '';
  if (uname) await deleteDoc(doc(d, 'usernames', uname));
  await removeAll((await getDocs(query(collection(d, 'friendRequests'), where('fromUid', '==', uid)))).docs.map((x) => x.ref));
  await removeAll((await getDocs(query(collection(d, 'friendRequests'), where('toUid', '==', uid)))).docs.map((x) => x.ref));
  await removeAll((await getDocs(query(collection(d, 'friendships'), where('uids', 'array-contains', uid)))).docs.map((x) => x.ref));
  if (prof.exists()) await deleteDoc(prof.ref);

  // Geri bildirimler, engeller, profil ve eşitlenen veri
  await removeAll((await getDocs(query(collection(d, 'feedback'), where('userId', '==', uid)))).docs.map((x) => x.ref));
  await removeAll((await getDocs(collection(d, 'users', uid, 'blocks'))).docs.map((x) => x.ref));
  await deleteDoc(doc(d, 'users', uid, 'private', 'state'));
  await deleteDoc(doc(d, 'users', uid));

  try { await deleteUser(user); }
  catch (e) {
    if ((e as { code?: string }).code === 'auth/requires-recent-login') throw new Error('Sunucudaki verilerin silindi. Hesabı tamamen kapatmak için çıkış yapıp tekrar giriş yap, sonra “Hesabımı sil”e yeniden bas.');
    throw e;
  }
}
