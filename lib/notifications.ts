import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Lesson } from '@/types/planim';

export type PermissionState = 'granted' | 'denied' | 'undetermined';

export function configureNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function ensureChannels() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('lesson-start', {
    name: 'Ders başlangıç alarmı',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 500, 250, 500, 250, 500],
    sound: 'default',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
  await Notifications.setNotificationChannelAsync('lesson-warning', {
    name: 'Ders öncesi hatırlatma',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250],
    sound: 'default',
  });
}

export async function getNotificationPermission(): Promise<PermissionState> {
  const result = await Notifications.getPermissionsAsync();
  if (result.granted) return 'granted';
  return result.canAskAgain ? 'undetermined' : 'denied';
}

export async function requestNotificationPermission(): Promise<PermissionState> {
  await ensureChannels();
  const result = await Notifications.requestPermissionsAsync();
  if (result.granted) return 'granted';
  return result.canAskAgain ? 'undetermined' : 'denied';
}

/** Day index in this app: 0 = Monday … 6 = Sunday. expo-notifications weekday: 1 = Sunday … 7 = Saturday. */
const toExpoWeekday = (day: number) => ((day + 1) % 7) + 1;

/** includeStart=false when the native full-screen alarm already handles the lesson start. */
export async function rescheduleLessons(lessons: Lesson[], includeStart = true) {
  await ensureChannels();
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const lesson of lessons) {
    const [hour, minute] = lesson.startTime.split(':').map(Number);
    if (Number.isNaN(hour) || Number.isNaN(minute)) continue;

    if (includeStart) await Notifications.scheduleNotificationAsync({
      content: {
        title: `${lesson.name} başlıyor!`,
        body: 'Ders vakti geldi. Hazırsan “Başladım” de, müziğin açılsın.',
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
        data: { lessonId: lesson.id, kind: 'start' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: toExpoWeekday(lesson.day),
        hour,
        minute,
        channelId: 'lesson-start',
      },
    });

    if (lesson.alarmMinutes > 0) {
      let total = hour * 60 + minute - lesson.alarmMinutes;
      let day = lesson.day;
      if (total < 0) { total += 1440; day = (day + 6) % 7; }
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Birazdan dersin var',
          body: `${lesson.name} ${lesson.alarmMinutes} dakika sonra başlayacak.`,
          sound: true,
          data: { lessonId: lesson.id, kind: 'warning' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: toExpoWeekday(day),
          hour: Math.floor(total / 60),
          minute: total % 60,
          channelId: 'lesson-warning',
        },
      });
    }
  }
}

/** Haftalık "raporun hazır" hatırlatması. rescheduleLessons tüm bildirimleri sildiği için ondan sonra çağrılır. */
export async function scheduleReportReminder(day: number, time: string, consent = true) {
  const [hour, minute] = time.split(':').map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return;
  await ensureChannels();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Haftalık raporun hazır',
      body: consent ? 'Bu hafta ne kadar çalıştığına bak, velinle WhatsApp’tan paylaş.' : 'Raporu veliye göndermek için izin vermedin. İstersen Özetler’den izni aç.',
      sound: true,
      data: { kind: 'report' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: toExpoWeekday(day),
      hour,
      minute,
      channelId: 'lesson-warning',
    },
  });
}

/** Aylık "özetin hazır" hatırlatması (ayın seçilen günü). Desteklenmiyorsa sessizce atlanır. */
export async function scheduleMonthlyReminder(day: number, time: string) {
  const [hour, minute] = time.split(':').map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return;
  try {
    await ensureChannels();
    await Notifications.scheduleNotificationAsync({
      content: { title: 'Aylık özetin hazır', body: 'Bu ay neler yaptığına bak, istersen velinle paylaş.', sound: true, data: { kind: 'report' } },
      trigger: { type: (Notifications.SchedulableTriggerInputTypes as unknown as Record<string, never>).MONTHLY, day, hour, minute, channelId: 'lesson-warning' } as never,
    });
  } catch { /* aylık tetikleyici bu sürümde yoksa atla */ }
}

