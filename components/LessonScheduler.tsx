import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { usePlanim } from '@/context/PlanimContext';
import { lockAvailable, PlanimLock } from '@/modules/planim-lock';
import { configureNotifications, getNotificationPermission, rescheduleLessons, scheduleMonthlyReminder, scheduleReportReminder } from '@/lib/notifications';

configureNotifications();

const openLessonStart = (lessonId: string) => {
  setTimeout(() => router.push(`/lesson-start?id=${encodeURIComponent(lessonId)}` as never), 350);
};

/** Keeps the OS-level lesson alarms in sync with the schedule and reacts to taps on them. */
export function LessonScheduler() {
  const { lessons, settings } = usePlanim();
  const handled = useRef<string | null>(null);
  const lastResponse = Notifications.useLastNotificationResponse();

  useEffect(() => { if (lockAvailable) { try { PlanimLock.setAlarmSound(settings.alarmSoundUri); } catch { /* yoksay */ } } }, [settings.alarmSoundUri]);

  useEffect(() => {
    if (lockAvailable) {
      try {
        PlanimLock.scheduleAlarms(lessons.map((lesson) => ({ id: lesson.id, name: lesson.name, day: lesson.day, start: lesson.startTime, end: lesson.endTime })));
      } catch { /* ignore */ }
    }
    getNotificationPermission()
      .then(async (state) => {
        if (state !== 'granted') return;
        await rescheduleLessons(lessons, !lockAvailable);
        await scheduleReportReminder(settings.reportDay, settings.reportTime, settings.parentConsent);
        await scheduleMonthlyReminder(settings.monthlyDay, settings.reportTime);
      })
      .catch(() => undefined);
  }, [lessons, settings.reportDay, settings.reportTime, settings.monthlyDay, settings.parentConsent]);

  useEffect(() => {
    if (!lastResponse) return;
    const id = lastResponse.notification.request.identifier + lastResponse.notification.date;
    if (handled.current === id) return;
    handled.current = id;
    const data = lastResponse.notification.request.content.data as { lessonId?: string; kind?: string };
    if (data?.kind === 'start' && data.lessonId) openLessonStart(data.lessonId);
  }, [lastResponse]);

  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data as { lessonId?: string; kind?: string };
      if (data?.kind === 'start' && data.lessonId) openLessonStart(data.lessonId);
    });
    return () => sub.remove();
  }, []);

  return null;
}
