import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { lockAvailable, PlanimLock } from '@/modules/planim-lock';

const STUDY_KEY = 'pusulam.study.v1';

/**
 * Görünmez. Ders sürerken uygulama arka plandan silinip yeniden açıldıysa çalışma ekranına geri döndürür
 * (kayıtlı oturum + süren kilit). Süre dolmuş ve üstünden 30 dakika geçmişse ya da oturum 12 saatten eskiyse karışmaz.
 */
export function StudyResume() {
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return undefined;
    done.current = true;
    let alive = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STUDY_KEY);
        if (!raw) return;
        const s = JSON.parse(raw) as { sig?: string; startedAt: number; baseTarget: number; breakMs?: number; breakStart?: number; breakUntil?: number };
        const now = Date.now();
        const openBreak = s.breakStart ? Math.max(0, Math.min(now, s.breakUntil ?? 0) - s.breakStart) : 0;
        const end = s.baseTarget + (s.breakMs ?? 0) + openBreak;
        if (!s.sig || now - s.startedAt > 12 * 3600000 || now > end + 30 * 60000) { AsyncStorage.removeItem(STUDY_KEY).catch(() => undefined); return; }
        const running = lockAvailable ? PlanimLock.isLockRunning() : true;
        if (!running && now > end) return;
        const target = s.sig.startsWith('l:') ? `/study-mode?id=${encodeURIComponent(s.sig.slice(2))}` : '/study-mode?minutes=45';
        setTimeout(() => { if (alive) router.replace(target as never); }, 700);
      } catch { /* yoksay */ }
    })();
    return () => { alive = false; };
  }, []);
  return null;
}
