import { requireOptionalNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

interface NativeApi {
  hasUsageAccess(): boolean;
  hasOverlayAccess(): boolean;
  canUseFullScreenIntent(): boolean;
  openUsageAccessSettings(): void;
  openOverlaySettings(): void;
  openFullScreenIntentSettings(): void;
  getLaunchableApps(): string;
  getEmergencyPackages(): string;
  scheduleAlarms(json: string): void;
  startLock(json: string): void;
  stopLock(): void;
  setFriendWindow(untilMs: number): void;
  setBreak(untilMs: number): void;
  getAlarmSounds(): string;
  setAlarmSound(uri: string): void;
  previewSound(uri: string): void;
  stopPreview(): void;
  isLockRunning(): boolean;
  getUsage(clear: boolean): string;
}

const native = Platform.OS === 'android' ? requireOptionalNativeModule<NativeApi>('PlanimLock') : null;

/** False in Expo Go / web / iOS, or when the APK was built without the native module. */
export const lockAvailable = !!native;

export interface AppInfo { pkg: string; label: string }
export interface AlarmEntry { id: string; name: string; day: number; start: string; end: string }
export interface LockConfig { blocked: string[]; allowed: string[]; friend: string[]; endAt: number; lessonName: string }
export interface UsageSnapshot { usage: Record<string, number>; blocks: Array<{ pkg: string; at: number }> }

const parse = <T,>(json: string | undefined, fallback: T): T => {
  try { return json ? (JSON.parse(json) as T) : fallback; } catch { return fallback; }
};

export const PlanimLock = {
  hasUsageAccess: () => native?.hasUsageAccess() ?? false,
  hasOverlayAccess: () => native?.hasOverlayAccess() ?? false,
  canUseFullScreenIntent: () => native?.canUseFullScreenIntent() ?? false,
  openUsageAccessSettings: () => native?.openUsageAccessSettings(),
  openOverlaySettings: () => native?.openOverlaySettings(),
  openFullScreenIntentSettings: () => native?.openFullScreenIntentSettings(),
  getLaunchableApps: () => parse<AppInfo[]>(native?.getLaunchableApps(), []),
  getEmergencyPackages: () => parse<string[]>(native?.getEmergencyPackages(), []),
  scheduleAlarms: (alarms: AlarmEntry[]) => native?.scheduleAlarms(JSON.stringify(alarms)),
  startLock: (config: LockConfig) => native?.startLock(JSON.stringify(config)),
  stopLock: () => native?.stopLock(),
  setFriendWindow: (untilMs: number) => native?.setFriendWindow(untilMs),
  setBreak: (untilMs: number) => native?.setBreak(untilMs),
  getAlarmSounds: () => parse<Array<{ title: string; uri: string }>>(native?.getAlarmSounds(), []),
  setAlarmSound: (uri: string) => native?.setAlarmSound(uri),
  previewSound: (uri: string) => native?.previewSound(uri),
  stopPreview: () => native?.stopPreview(),
  isLockRunning: () => native?.isLockRunning() ?? false,
  getUsage: (clear = false) => parse<UsageSnapshot>(native?.getUsage(clear), { usage: {}, blocks: [] }),
};
