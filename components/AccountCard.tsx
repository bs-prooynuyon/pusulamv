import React, { useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { Card, Field, PrimaryButton, styles } from '@/components/PlanimUI';
import { usePlanim } from '@/context/PlanimContext';
import { useColors } from '@/hooks/useColors';
import { CONFIG } from '@/config';
import { NAVY } from '@/constants/pusula';
import { authMessage, checkVerified, cloudConfigured, requestEmailChange, resendVerification, sendReset, signInEmail, signInGoogle, signUpEmail } from '@/lib/cloud';

const validEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

type Mode = 'signin' | 'signup' | 'reset';

/** Lacivert giriş ekranındaki yazı alanı (göz simgeli şifre alanı dahil). */
function NField({ label, value, onChange, placeholder, secure, email, words }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; secure?: boolean; email?: boolean; words?: boolean }) {
  const [show, setShow] = useState(false);
  return <View style={{ gap: 6 }}>
    <Text style={{ color: NAVY.link, fontSize: 13, marginLeft: 6 }}>{label}</Text>
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#0c2c5c', borderWidth: 1, borderColor: NAVY.border, borderRadius: 18, paddingHorizontal: 16 }}>
      <TextInput value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor="#7893bd" secureTextEntry={!!secure && !show} autoCapitalize={words ? 'words' : 'none'} autoCorrect={false} keyboardType={email ? 'email-address' : 'default'} style={{ flex: 1, color: '#fff', fontSize: 16, height: 52 }} />
      {secure ? <Pressable onPress={() => setShow((v) => !v)} hitSlop={10}><Feather name={show ? 'eye-off' : 'eye'} size={20} color={NAVY.link} /></Pressable> : null}
    </View>
  </View>;
}

function NButton({ label, onPress, disabled, outline }: { label: string; onPress: () => void; disabled?: boolean; outline?: boolean }) {
  return <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => ({ height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.5 : pressed ? 0.85 : 1, backgroundColor: outline ? 'transparent' : NAVY.button, borderWidth: outline ? 1.5 : 0, borderColor: '#fff' })}>
    <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>{label}</Text>
  </Pressable>;
}

/**
 * E-posta + şifre ile giriş / kayıt (e-posta doğrulaması zorunlu).
 * Giriş yapılmışsa: hesabı gösterir, e-posta değiştirme ve çıkış sunar.
 */
export function AccountCard({ onDone, initialMode = 'signin', navy = false }: { onDone?: () => void; initialMode?: Mode; navy?: boolean }) {
  const colors = useColors();
  const { settings, cloudLogin, signOut, updateSettings } = usePlanim();
  const [email, setEmail] = useState(settings.email);
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<Mode>(initialMode);
  const [waiting, setWaiting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [changing, setChanging] = useState(false);
  const [name, setName] = useState(settings.studentName);
  const [password2, setPassword2] = useState('');

  if (!cloudConfigured()) {
    const saveLocal = () => {
      if (!validEmail(email)) return Alert.alert('E-posta hatalı', 'Geçerli bir e-posta adresi yaz.');
      updateSettings({ email: email.trim() });
      Alert.alert('Kaydedildi', 'E-postan bu telefona kaydedildi.');
      onDone?.();
    };
    return <Card>
      <Field label="E-posta adresin" value={email} onChangeText={setEmail} placeholder="ornek@mail.com" keyboardType="email" />
      <PrimaryButton label={settings.email ? 'E-postayı güncelle' : 'E-postayı kaydet'} onPress={saveLocal} icon="mail" />
      <Text style={{ color: colors.mutedForeground, fontSize: 12, lineHeight: 18 }}>Hesap girişi şu an kullanılamıyor; e-postan yalnızca bu telefonda saklanır.</Text>
    </Card>;
  }

  const finish = async (session: { userId: string; email: string }) => {
    const result = await cloudLogin(session);
    setWaiting(false); setPassword('');
    if (result === 'restored') Alert.alert('Hesabın açıldı', 'Kayıtlı bilgilerin bu telefona yüklendi.');
    onDone?.();
  };

  const submit = async () => {
    if (!validEmail(email)) return Alert.alert('E-posta hatalı', 'Geçerli bir e-posta adresi yaz.');
    if (mode === 'reset') {
      setBusy(true);
      try { await sendReset(email); Alert.alert('Gönderildi', 'Şifre sıfırlama bağlantısı e-postana gitti. Gelmezse gereksiz (spam) klasörüne bak.'); setMode('signin'); }
      catch (e) { Alert.alert('Gönderilemedi', authMessage(e)); }
      finally { setBusy(false); }
      return;
    }
    if (password.length < 8) return Alert.alert('Şifre kısa', 'Şifre en az 8 karakter olmalı.');
    if (mode === 'signup' && navy) {
      if (name.trim().length < 2) return Alert.alert('Adın eksik', 'Adını ve soyadını yaz.');
      if (password !== password2) return Alert.alert('Şifreler uyuşmuyor', 'İki şifre alanına aynı şifreyi yaz.');
    }
    setBusy(true);
    try {
      if (mode === 'signup') {
        const sent = await signUpEmail(email, password);
        if (name.trim()) updateSettings({ studentName: name.trim() });
        setWaiting(true);
        if (!sent) Alert.alert('Hesabın açıldı', 'Doğrulama maili şu an gönderilemedi. Bir sonraki ekranda “Bağlantıyı yeniden gönder”e bas.');
      }
      else {
        const result = await signInEmail(email, password);
        if (result === 'unverified') { setWaiting(true); Alert.alert('E-postanı doğrula', 'Sana bir doğrulama bağlantısı gönderdik. Bağlantıya tıkla, sonra buraya dönüp “Doğruladım”a bas.'); }
        else await finish(result);
      }
    } catch (e) { Alert.alert(mode === 'signup' ? 'Kayıt olunamadı' : 'Giriş yapılamadı', authMessage(e)); }
    finally { setBusy(false); }
  };

  const google = async () => {
    if (!CONFIG.googleSignInEnabled || !CONFIG.googleWebClientId) return Alert.alert('Google ile giriş', 'Google ile giriş henüz hazır değil. E-posta ile devam edebilirsin.');
    setBusy(true);
    try { await finish(await signInGoogle()); }
    catch (e) { if (!(e instanceof Error && (e.message === 'cancelled' || /cancel/i.test(e.message)))) Alert.alert('Google ile giriş yapılamadı', authMessage(e)); }
    finally { setBusy(false); }
  };

  const verified = async () => {
    setBusy(true);
    try {
      const session = await checkVerified();
      if (session) await finish(session);
      else Alert.alert('Henüz doğrulanmamış', 'E-postandaki bağlantıya tıkladıktan sonra tekrar dene. Gelmediyse gereksiz (spam) klasörüne de bak.');
    } catch (e) { Alert.alert('Kontrol edilemedi', authMessage(e)); }
    finally { setBusy(false); }
  };

  const resend = async () => {
    setBusy(true);
    try { await resendVerification(); Alert.alert('Gönderildi', 'Doğrulama bağlantısı yeniden e-postana gitti.'); }
    catch (e) { Alert.alert('Gönderilemedi', authMessage(e)); }
    finally { setBusy(false); }
  };

  const changeEmail = async () => {
    if (!validEmail(email)) return Alert.alert('E-posta hatalı', 'Geçerli bir e-posta adresi yaz.');
    setBusy(true);
    try {
      await requestEmailChange(email);
      Alert.alert('Bağlantı gönderildi', 'Yeni adresine bir doğrulama bağlantısı gitti. Tıkladığında e-postan değişir. Sonra çıkış yapıp yeni adresinle tekrar gir.');
      setChanging(false);
    } catch (e) { Alert.alert('Değiştirilemedi', authMessage(e)); }
    finally { setBusy(false); }
  };

  if (settings.signedIn && !changing) {
    return <Card>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Hesap</Text>
      <Text style={{ color: colors.mutedForeground, fontSize: 13, lineHeight: 19 }}>{settings.email} ile giriş yapıldı. Başka telefondan aynı hesapla girersen her şeyin orada da görünür.</Text>
      {settings.email.startsWith('+') ? null : <PrimaryButton label="E-postayı değiştir" onPress={() => { setChanging(true); setEmail(''); }} icon="mail" secondary />}
      <PrimaryButton label="Çıkış yap" onPress={() => Alert.alert('Çıkış yapılsın mı?', 'Veriler bulutta kalır; tekrar girince geri gelir.', [{ text: 'Vazgeç', style: 'cancel' }, { text: 'Çıkış yap', onPress: () => { signOut(); } }])} icon="log-out" secondary />
    </Card>;
  }

  if (changing) {
    return <Card>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Yeni e-posta</Text>
      <Field label="Yeni e-posta adresin" value={email} onChangeText={setEmail} placeholder="ornek@mail.com" keyboardType="email" />
      <PrimaryButton label={busy ? 'Gönderiliyor…' : 'Doğrulama bağlantısı gönder'} onPress={changeEmail} icon="send" disabled={busy} />
      <PrimaryButton label="Vazgeç" onPress={() => { setChanging(false); setEmail(settings.email); }} secondary />
    </Card>;
  }

  if (navy && !settings.signedIn) {
    if (waiting) {
      return <View style={{ gap: 14 }}>
        <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800', textAlign: 'center' }}>E-postanı doğrula</Text>
        <Text style={{ color: NAVY.soft, fontSize: 14, lineHeight: 21, textAlign: 'center' }}>{email.trim()} adresine doğrulama bağlantısı gönderdik. Bağlantıya tıkla, sonra buraya dön ve “Doğruladım”a bas. Gelmezse gereksiz (spam) klasörüne bak.</Text>
        <NButton label={busy ? 'Kontrol ediliyor…' : 'Doğruladım'} onPress={verified} disabled={busy} />
        <NButton label="Bağlantıyı yeniden gönder" onPress={resend} disabled={busy} outline />
        <Pressable onPress={() => setWaiting(false)} style={{ alignItems: 'center', paddingVertical: 6 }}><Text style={{ color: NAVY.link, fontSize: 14 }}>Vazgeç</Text></Pressable>
      </View>;
    }
    return <View style={{ gap: 14 }}>
      {mode !== 'reset' ? <View style={{ flexDirection: 'row', backgroundColor: '#0c2c5c', borderWidth: 1, borderColor: NAVY.border, borderRadius: 999, padding: 5 }}>
        {(['signin', 'signup'] as const).map((m) => <Pressable key={m} onPress={() => setMode(m)} style={{ flex: 1, height: 46, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: mode === m ? '#fff' : 'transparent' }}>
          <Text style={{ color: mode === m ? '#0a2d5e' : NAVY.link, fontSize: 16, fontWeight: '800' }}>{m === 'signin' ? 'Giriş yap' : 'Kaydol'}</Text>
        </Pressable>)}
      </View> : <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800', textAlign: 'center' }}>Şifreni sıfırla</Text>}
      {mode === 'signup' ? <NField label="Adın" value={name} onChange={setName} placeholder="Adın ve soyadın" words /> : null}
      <NField label="E-posta" value={email} onChange={setEmail} placeholder="ornek@mail.com" email />
      {mode !== 'reset' ? <NField label="Şifre" value={password} onChange={setPassword} placeholder="En az 8 karakter" secure /> : null}
      {mode === 'signup' ? <NField label="Şifre tekrar" value={password2} onChange={setPassword2} placeholder="Şifreni tekrar yaz" secure /> : null}
      <NButton label={busy ? 'Bekle…' : mode === 'signup' ? 'Kaydol' : mode === 'reset' ? 'Sıfırlama bağlantısı gönder' : 'Giriş yap'} onPress={submit} disabled={busy} />
      {mode === 'signin' ? <Pressable onPress={() => setMode('reset')} style={{ alignItems: 'center', paddingVertical: 4 }}><Text style={{ color: NAVY.link, fontSize: 14 }}>Şifremi unuttum</Text></Pressable> : null}
      {mode === 'reset' ? <Pressable onPress={() => setMode('signin')} style={{ alignItems: 'center', paddingVertical: 4 }}><Text style={{ color: NAVY.link, fontSize: 14 }}>← Giriş yap’a dön</Text></Pressable> : null}
      {mode === 'signup' ? <Text style={{ color: NAVY.soft, fontSize: 13, lineHeight: 19, textAlign: 'center' }}>Doğrulama bağlantısı e-postana gelir{'\n'}(gelmezse gereksiz klasörüne de bak)</Text> : null}
    </View>;
  }

  if (waiting) {
    return <Card>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>E-postanı doğrula</Text>
      <Text style={{ color: colors.mutedForeground, fontSize: 13, lineHeight: 19 }}>{email.trim()} adresine doğrulama bağlantısı gönderdik. Bağlantıya tıkla, sonra buraya dön ve “Doğruladım”a bas. Gelmezse gereksiz (spam) klasörüne bak.</Text>
      <PrimaryButton label={busy ? 'Kontrol ediliyor…' : 'Doğruladım'} onPress={verified} icon="check" disabled={busy} />
      <PrimaryButton label="Bağlantıyı yeniden gönder" onPress={resend} icon="refresh-cw" secondary disabled={busy} />
      <PrimaryButton label="Vazgeç" onPress={() => setWaiting(false)} secondary />
    </Card>;
  }

  return <Card>
    <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{mode === 'signup' ? 'Hesap oluştur' : mode === 'reset' ? 'Şifreni sıfırla' : 'E-posta ile giriş'}</Text>
    {mode === 'signin' ? <><PrimaryButton label={busy ? 'Bekle…' : 'Google ile giriş yap'} onPress={google} icon="log-in" disabled={busy} /><Text style={{ color: colors.mutedForeground, fontSize: 12, textAlign: 'center' }}>ya da e-posta ile</Text></> : null}
    <Field label="E-posta adresin" value={email} onChangeText={setEmail} placeholder="ornek@mail.com" keyboardType="email" />
    {mode !== 'reset' ? <Field label="Şifre" value={password} onChangeText={setPassword} placeholder="En az 8 karakter" secure /> : null}
    <PrimaryButton label={busy ? 'Bekle…' : mode === 'signup' ? 'Kayıt ol' : mode === 'reset' ? 'Sıfırlama bağlantısı gönder' : 'Giriş yap'} onPress={submit} icon={mode === 'reset' ? 'send' : 'log-in'} disabled={busy} />
    <View style={{ gap: 4 }}>
      {mode === 'signin' ? <Pressable onPress={() => setMode('signup')}><Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13, paddingVertical: 6 }}>Hesabın yok mu? Kayıt ol</Text></Pressable> : null}
      {mode !== 'signin' ? <Pressable onPress={() => setMode('signin')}><Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13, paddingVertical: 6 }}>Hesabın var mı? Giriş yap</Text></Pressable> : null}
      {mode === 'signin' ? <Pressable onPress={() => setMode('reset')}><Text style={{ color: colors.mutedForeground, fontWeight: '600', fontSize: 13, paddingVertical: 6 }}>Şifremi unuttum</Text></Pressable> : null}
    </View>
    <Text style={{ color: colors.mutedForeground, fontSize: 12, lineHeight: 18 }}>Kayıttan sonra e-postana bir doğrulama bağlantısı gelir; doğrulamadan giriş tamamlanmaz.</Text>
  </Card>;
}
