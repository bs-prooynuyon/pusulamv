import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import React, { useEffect } from 'react';
import { AppState } from 'react-native';
import { usePlanim } from '@/context/PlanimContext';
import { cloudConfigured } from '@/lib/cloud';
import { clearInbox, refreshInbox } from '@/lib/inboxStore';

const POLL_MS = 45000;

/** Arka planda görünmez çalışır: uygulama açıkken ya da öne gelince yeni rapor isteği / cevap / davet var mı bakar, varsa bildirim çıkarır. */
export function InboxWatcher() {
  const { settings } = usePlanim();
  const active = settings.signedIn && cloudConfigured();
  const role = settings.role === 'teacher' ? 'teacher' : 'student';

  useEffect(() => {
    if (!active) { clearInbox(); return undefined; }
    let alive = true;
    const tick = () => { if (alive && AppState.currentState === 'active') refreshInbox(role).catch(() => undefined); };
    tick();
    const timer = setInterval(tick, POLL_MS);
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active') tick(); });
    return () => { alive = false; clearInterval(timer); sub.remove(); };
  }, [active, role]);

  // Bildirime dokununca ilgili ekran açılır.
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((res) => {
      const href = (res.notification.request.content.data as { href?: string } | undefined)?.href;
      if (href && href.startsWith('/')) setTimeout(() => router.push(href as never), 300);
    });
    return () => sub.remove();
  }, []);

  return null;
}
