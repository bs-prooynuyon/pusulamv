import { useEffect, useState } from 'react';
import { fetchInbox, InboxItem, markAllSeen, pushNewItems, unreadCount } from '@/lib/inbox';

/** Tüm ekranların paylaştığı küçük bellek deposu: izleyici yazar, zil ve bildirim ekranı okur. */
let state: { items: InboxItem[]; unread: number } = { items: [], unread: 0 };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export async function refreshInbox(role: 'teacher' | 'student', push = true) {
  const items = await fetchInbox(role);
  state = { items, unread: await unreadCount(items) };
  emit();
  if (push) await pushNewItems(items);
}

export async function markInboxSeen() {
  await markAllSeen(state.items);
  state = { ...state, unread: await unreadCount(state.items) };
  emit();
}

export function clearInbox() { state = { items: [], unread: 0 }; emit(); }

export function useInbox() {
  const [snap, setSnap] = useState(state);
  useEffect(() => {
    const l = () => setSnap(state);
    listeners.add(l); l();
    return () => { listeners.delete(l); };
  }, []);
  return snap;
}
