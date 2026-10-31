import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AccountCard } from '@/components/AccountCard';
import { Compass, PusulaBg } from '@/components/PusulaBg';
import { NAVY } from '@/constants/pusula';
import { usePlanim } from '@/context/PlanimContext';
import { CONFIG } from '@/config';
import { authMessage, cloudConfigured, signInGoogle } from '@/lib/cloud';

/** Giriş ekranı (taslak 1, Kaydol bağlantılı): lacivert zemin, pusula, Google ve e-posta. */
export function LoginScreen({ onDone }: { onDone: () => void }) {
  const insets = useSafeAreaInsets();
  const { settings, cloudLogin } = usePlanim();
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<'menu' | 'email' | 'signup'>('menu');
  const online = cloudConfigured();

  const googleOn = CONFIG.googleSignInEnabled && !!CONFIG.googleWebClientId;
  const google = async () => {
    if (!googleOn) return Alert.alert('Google ile giriş', 'Google ile giriş henüz hazır değil. E-posta ile devam edebilirsin.');
    if (!online) return Alert.alert('Google ile giriş', 'Hesap girişi şu an kullanılamıyor.');
    setBusy(true);
    try {
      const session = await signInGoogle();
      const result = await cloudLogin(session);
      if (result === 'restored') Alert.alert('Hesabın açıldı', 'Kayıtlı bilgilerin bu telefona yüklendi.');
      onDone();
    } catch (e) {
      if (!(e instanceof Error && (e.message === 'cancelled' || /cancel/i.test(e.message)))) Alert.alert('Google ile giriş yapılamadı', authMessage(e));
    } finally { setBusy(false); }
  };

  return <PusulaBg ringY={0.2}>
    <ScrollView contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 20, paddingHorizontal: 24 }} keyboardShouldPersistTaps="handled">
      <View style={{ alignItems: 'center' }}>
        <Compass size={view === 'menu' ? 170 : 110} />
        <Text style={{ color: '#fff', fontSize: 40, fontWeight: '800', marginTop: 6 }}>Pusulam</Text>
        <Text style={{ color: '#b5d4ff', fontSize: 16, marginTop: 4 }}>LGS yolunda kişisel rotan</Text>
      </View>

      <View style={{ flex: 1, justifyContent: 'center', gap: 14, marginTop: 28 }}>
        {view === 'menu' ? <>
          <View style={{ alignItems: 'center', marginBottom: 6 }}>
            <Text style={{ color: '#fff', fontSize: 30, fontWeight: '800' }}>Hoş geldin</Text>
            <Text style={{ color: '#b5d4ff', fontSize: 16, marginTop: 6 }}>Devam etmek için giriş yap</Text>
          </View>
          <Pressable testID="login-google" onPress={google} disabled={busy} style={({ pressed }) => ({ opacity: !googleOn ? 0.55 : busy ? 0.5 : pressed ? 0.85 : 1, backgroundColor: '#fff', borderRadius: 999, height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 })}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#4285F4' }}>G</Text>
            <Text style={{ color: '#0f172a', fontSize: 17, fontWeight: '800' }}>{busy ? 'Bekle…' : googleOn ? 'Google ile devam et' : 'Google ile devam et (yakında)'}</Text>
          </Pressable>
          <Pressable testID="login-email" onPress={() => setView('email')} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1, borderWidth: 1.5, borderColor: '#fff', borderRadius: 999, height: 56, alignItems: 'center', justifyContent: 'center' })}>
            <Text style={{ color: '#fff', fontSize: 17, fontWeight: '800' }}>E-posta ile giriş yap</Text>
          </Pressable>
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 14, marginTop: 6 }}>
            <Text style={{ color: NAVY.link, fontSize: 15 }}>Hesabın yok mu?</Text>
            <Pressable testID="login-signup" onPress={() => setView('signup')} hitSlop={10}><Text style={{ color: '#fff', fontSize: 16, fontWeight: '800', textDecorationLine: 'underline' }}>Kaydol</Text></Pressable>
          </View>
          {settings.signedIn ? <Pressable onPress={onDone} style={{ paddingVertical: 8, alignItems: 'center' }}><Text style={{ color: NAVY.accent, fontSize: 15, fontWeight: '700' }}>{settings.email} ile devam et</Text></Pressable> : null}
          {!settings.signedIn ? <Pressable testID="login-local" onPress={onDone} style={{ paddingVertical: 8, alignItems: 'center' }}><Text style={{ color: '#8fb0dc', fontSize: 15 }}>Hesap açmadan devam et</Text></Pressable> : null}
        </> : <>
          <AccountCard navy onDone={onDone} initialMode={view === 'signup' ? 'signup' : 'signin'} />
          <Pressable onPress={() => setView('menu')} style={{ paddingVertical: 12, alignItems: 'center' }}><Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>← Diğer seçenekler</Text></Pressable>
        </>}
      </View>

      <Text style={{ color: '#8fb0dc', fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 24 }}>
        {online ? 'Devam ederek Kullanım Koşulları ve Gizlilik Politikası’nı kabul etmiş olursun.\nE-posta ile kayıt olanlar e-postalarını doğrulamadan devam edemez.' : 'Hesap girişi şu an kullanılamıyor; veriler şimdilik yalnızca bu telefonda saklanır.'}
      </Text>
    </ScrollView>
  </PusulaBg>;
}
