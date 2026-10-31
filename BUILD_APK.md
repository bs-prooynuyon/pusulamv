# APK derleme (Aşama 1: kilit + tam ekran alarm)

```
npm install
npx expo install expo-notifications expo-auth-session expo-crypto expo-secure-store expo-keep-awake expo-battery expo-print expo-sharing expo-file-system expo-document-picker firebase @react-native-google-signin/google-signin
npx eas-cli@latest login
npx eas-cli@latest init
npx eas-cli@latest build --platform android --profile preview
```

Bu sürümde özel Android kodu var (`modules/planim-lock`). Expo Go'da ÇALIŞMAZ, sadece derlenen APK'da çalışır.

## Kurulumdan sonra telefonda (bir kere)
Uygulama ilk açılışta onay ekranını gösterir, sonra şu izinleri ister:
- Bildirimler
- Tam ekran alarm
- Kullanım erişimi  (Ayarlar > Özel uygulama erişimi > Kullanım verilerine erişim)
- Diğer uygulamaların üzerinde göster
- Pil: "Kısıtlanmamış"

Not: Android, APK'yı dışarıdan yüklenen uygulamalarda "Kısıtlanmış ayar" diyerek Kullanım erişimi / Erişilebilirlik izinlerini
grileştirebilir. Çözüm: Ayarlar > Uygulamalar > Pusulam > ⋮ (sağ üst) > "Kısıtlanmış ayarlara izin ver", sonra izni aç.

## Ayarlar nerede?
Her şey `config.ts` içinde (Spotify Client ID, yaygın uygulama listesi, arkadaşla çalışma varsayılanları, müzik uygulamaları).
Aydınlatma metni: `constants/privacy.ts`.

## v9 notları
- Hesap (e-posta + şifre, Google), cihazlar arası eşitleme ve sohbet için `FIREBASE_KURULUM.md` dosyasını izle; `config.ts` içindeki `firebase` bölümü doluysa açılır. Boşsa uygulama hesapsız çalışır.
- Çalışma modu artık kilit simgesinden (üst çubuk ve Odak sekmesi) doğrudan başlar. Kilitlenecek uygulama seçilmemişse telefondaki yaygın dikkat dağıtıcılar otomatik kilitlenir.
- Kotlin tarafına `setBreak` (mola) eklendi: APK'yı yeniden derlemek gerekir.

## Play Store (AAB)
Yayın adımları `android-yayin/` klasöründe. Özet: `npx eas-cli@latest build --platform android --profile production`.
