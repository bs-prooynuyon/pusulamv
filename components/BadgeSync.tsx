import React, { useEffect, useRef } from 'react';
import { usePlanim } from '@/context/PlanimContext';
import { cloudConfigured } from '@/lib/cloud';
import { publishBadges } from '@/lib/badgeCloud';
import { computeBadgeCategories, earnedBadgeIds } from '@/lib/badges';

/** Görünmez: kazanılan rozetler ya da seçilen rozetler değişince profile yazar (başkaları görebilsin). */
export function BadgeSync() {
  const { sessions, exams, wrongs, questionLogs, settings } = usePlanim();
  const last = useRef('');
  const active = settings.signedIn && cloudConfigured() && settings.role !== 'teacher';
  useEffect(() => {
    if (!active) return undefined;
    const earned = earnedBadgeIds(computeBadgeCategories({ sessions, exams, wrongs, questionLogs }));
    const pinned = (settings.pinnedBadges ?? []).filter((id) => earned.includes(id)).slice(0, 3);
    const sig = `${earned.join(',')}|${pinned.join(',')}`;
    if (sig === last.current) return undefined;
    const t = setTimeout(() => { publishBadges(earned, pinned).then(() => { last.current = sig; }).catch(() => undefined); }, 1500);
    return () => clearTimeout(t);
  }, [active, sessions, exams, wrongs, questionLogs, settings.pinnedBadges]);
  return null;
}
