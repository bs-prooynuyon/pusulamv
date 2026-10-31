# Android yayını: senin yapacakların (sırayla)

## A. Hesaplar
1. Google Play Console geliştirici hesabı aç (play.google.com/console, tek seferlik 25 USD).
   Kişisel hesapta yeni kuralla: üretime çıkmadan önce kapalı testte en az 12 test kullanıcısı 14 gün boyunca kalmalı.
2. expo.dev hesabı aç, `npx eas-cli@latest login` ve `npx eas-cli@latest init` çalıştır.
3. expo.dev > Account settings > Access tokens: token üret. GitHub > Settings > Secrets > `EXPO_TOKEN` olarak ekle.

## B. Kod tarafı (bir kere)
1. `npm install`, sonra `npx expo install @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore @react-native-google-signin/google-signin expo-notifications expo-auth-session expo-crypto expo-secure-store expo-keep-awake expo-battery expo-print expo-sharing expo-file-system expo-document-picker expo-image-picker`, sonra `npx expo install --fix`. `package.json`'daki değişikliği commit et (EAS derlemesi onu okur).
1b. `FIREBASE_KURULUM.md` dosyasındaki 1., 2. ve 3. adımları yap (Authentication, Firestore kuralları, SHA-1). Kurallar yayınlanmadan sohbet, sınıf ve eşitleme çalışmaz.
2. `constants/privacy.ts` içinde veri sorumlusu "Pusulam Yazılım", iletişim e-postası pusulamapp.destek@gmail.com olarak yazıldı, gizlilik HTML'ini yeniden üret.
3. Gizlilik HTML'ini herkese açık adrese koy (GitHub Pages). Adresi Play Console'a yazacağız.
4. Paket adı `com.pusulam.app`. Değiştireceksen YAYINDAN ÖNCE değiştir, sonra değişmez.
5. `npx eas-cli@latest build --platform android --profile production` (AAB üretir, imza anahtarını EAS saklar).
   Anahtarı şu komutla yedekle: `npx eas-cli@latest credentials` > Android > indir. Kaybedersen güncelleme yapamazsın.

## C. Play Console formları (metinler hazır)
- Mağaza metinleri: `02-MAGAZA-METINLERI.md`
- İzin beyanları ve Veri güvenliği: `03-IZIN-VE-VERI-BEYANLARI.md`
- Gerekli görseller: 512x512 ikon, 1024x500 öne çıkan görsel, en az 2 (tercihen 4-8) telefon ekran görüntüsü.
- Gizlilik politikası adresi, iletişim e-postası.
- İçerik derecelendirme anketi, Hedef kitle (yalnızca 13-17 ve 18+ seç, 13 yaş altını seçme; aşağıya bak), Reklam: HAYIR (uygulamada reklam yok), Haberler: değil, Sağlık: değil.
- Hesap silme: uygulama içi (Ayarlar > Hesabımı kalıcı olarak sil) + web adresi gerekir (gizlilik sayfasında anlatan bölümü göster).

## D. Test ve yayın
1. İç test kanalına AAB'yi yükle, kendi telefonunda dene.
2. Kapalı test: 12+ kişi, 14 gün (kişisel hesapsa).
3. Üretime başvur. İlk inceleme birkaç gün sürer; özel izin beyanları (tam ekran bildirim, kullanım erişimi) inceleme riskidir.

## E. Yaş notu
Uygulama LGS öğrencileri (çoğu 13-14 yaş) için. Hedef kitleyi "13-17 ve 18+" seçersen Play "Aileler" programı şartı gerekmez, ama 13 yaş altını hedefleme. Sohbet ve kullanıcı engelleme var; bu iyi, çünkü kullanıcı içeriği kuralı bunu ister.

## F. Reklam
Reklamlar şimdilik kapalı: AdMob kurulumu, reklam kimliği beyanı ve reklamla ilgili Veri güvenliği satırları gerekmez. Geri açmak için lib/ads.ts içindeki notlara bak (yedek: reklam-yedek/ads.ts.txt).
Play Console > Uygulama içeriği > Reklamlar: "Hayır, reklam içermiyor". Reklam kimliği beyanı: "Hayır".
