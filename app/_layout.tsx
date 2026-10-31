import { cleanupRooms } from '@/lib/rooms';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { PlanimProvider } from '@/context/PlanimContext';
import { Consent } from '@/components/Consent';
import { DialogHost } from '@/components/AppDialog';
import { PRIVACY_VERSION } from '@/constants/privacy';
import { TERMS_VERSION } from '@/constants/terms';
import { DailyQuote } from '@/components/DailyQuote';
import { Onboarding } from '@/components/Onboarding';
import { StudyResume } from '@/components/StudyResume';
import { GlobalNav } from '@/components/GlobalNav';
import { prepareAds } from '@/lib/ads';
import { initAiDefault } from '@/lib/parentLock';
import { Splash } from '@/components/Splash';
import { useColors } from '@/hooks/useColors';
import { LessonScheduler } from '@/components/LessonScheduler';
import { InboxWatcher } from '@/components/InboxWatcher';
import { BadgeSync } from '@/components/BadgeSync';
import { SpotifyProvider } from '@/context/SpotifyContext';
import { usePlanim } from '@/context/PlanimContext';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  useEffect(() => { prepareAds(); }, []);
  const colors = useColors();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
    <View style={{ flex: 1 }}>
    <Stack screenOptions={{ headerBackTitle: 'Geri', headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="exams" />
      <Stack.Screen name="exam-detail" />
      <Stack.Screen name="exam-ai" />
      <Stack.Screen name="wrongs" />
      <Stack.Screen name="friends" />
      <Stack.Screen name="buddies" />
      <Stack.Screen name="badges" />
      <Stack.Screen name="retest" />
      <Stack.Screen name="tasks" />
      <Stack.Screen name="lesson-summary" options={{ gestureEnabled: false }} />
      <Stack.Screen name="weekly" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="lesson-start" options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="study-mode" options={{ gestureEnabled: false, animation: 'fade' }} />
      <Stack.Screen name="spotify-callback" />
      <Stack.Screen name="locked-apps" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="music" />
      <Stack.Screen name="ai-schedule" />
      <Stack.Screen name="feedback" />
      <Stack.Screen name="terms" />
      <Stack.Screen name="chat" />
      <Stack.Screen name="chat-room" />
      <Stack.Screen name="member" />
      <Stack.Screen name="inbox" />
      <Stack.Screen name="ai" />
    </Stack>
    </View>
    <GlobalNav />
    </View>
  );
}

function NavigationGate() {
  const { settings, hydrated, updateSettings } = usePlanim();
  const colors = useColors();

  // İlk açılışta tema telefonun açık/koyu ayarına göre başlar (varsayılan 'system'); kullanıcı sonra değiştirir.
  useEffect(() => {
    if (hydrated && !settings.themeInit) updateSettings({ themeInit: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, settings.themeInit]);

  useEffect(() => { if (hydrated && settings.consentAccepted) initAiDefault(settings.birthYear); }, [hydrated, settings.consentAccepted, settings.birthYear]);

  useEffect(() => { if (hydrated && settings.consentAccepted && settings.onboardingComplete) cleanupRooms().catch(() => {}); }, [hydrated, settings.consentAccepted, settings.onboardingComplete]);

  if (!hydrated) return null;
  const statusBar = <StatusBar style={colors.isDark ? 'light' : 'dark'} />;
  if (!settings.consentAccepted || settings.consentVersion !== `${PRIVACY_VERSION}.${TERMS_VERSION}`) return <>{statusBar}<Consent /></>;
  return settings.onboardingComplete ? <>{statusBar}<LessonScheduler /><StudyResume /><InboxWatcher /><BadgeSync /><RootLayoutNav /><DailyQuote /></> : <>{statusBar}<Onboarding /></>;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Açılış ekranı (A): yazı tipleri hazır olunca en az 1,5 sn gösterilir.
  const [splashDone, setSplashDone] = useState(false);
  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
      const t = setTimeout(() => setSplashDone(true), 1500);
      return () => clearTimeout(t);
    }
  }, [fontsLoaded, fontError]);

  // Web preview can render before remote fonts finish loading; native builds
  // still keep the splash screen gated until fonts are ready.
  if (!fontsLoaded && !fontError && Platform.OS !== 'web') return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <PlanimProvider>
            <SpotifyProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <KeyboardProvider>
                  {splashDone ? <NavigationGate /> : <Splash />}
                  <DialogHost />
                </KeyboardProvider>
              </GestureHandlerRootView>
            </SpotifyProvider>
          </PlanimProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
