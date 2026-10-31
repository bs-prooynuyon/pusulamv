# Firebase kurulumu: Google + e-posta girişi (yeni proje: Pusulam)

Bu sürümde yalnızca **Google** ve **e-posta + şifre** ile giriş var. Telefon numarasıyla giriş kaldırıldı.
Bağlantı bilgisi derlemede `google-services.json` dosyasından gelir (yeni Firebase projenden indirip koyacaksın).

## 1. Giriş yöntemlerini aç
Firebase Console > **Authentication** > **Sign-in method**:
- **Email/Password**: Enabled. "Email link (passwordless)" KAPALI kalsın.
- **Google**: Enabled. Proje destek e-postasını seç, Kaydet.

## 2. E-posta şablonu (doğrulama maili gelmesi için)
Project settings > General > **Public-facing name** alanına `Pusulam` yaz (mail şablonlarında %APP_NAME% olarak görünür).
Authentication > **Templates** > "Email address verification" ve "Password reset":
- Dili **Türkçe** yap, gönderen adını `Pusulam` yap, Kaydet.
- Mail genelde **gereksiz (spam)** klasörüne düşer; ilk denemede orayı da kontrol et.
- Authentication > **Settings > Authorized domains** içinde `planimv2.firebaseapp.com` ekli olmalı (varsayılan gelir).

## 3. Google girişi için SHA parmak izi (en çok burada takılınır)
1. GitHub > Actions > "Build APK" çalıştır. Derleme sonunda "SHA parmak izlerini yazdır" adımında **SHA1** ve **SHA256** satırları görünür. Bunları kopyala.
2. Firebase > Project settings > Your apps > Android (`com.pusulam.app`) > **Add fingerprint** ile ikisini de ekle.
3. Aynı sayfadan **google-services.json** dosyasını yeniden indir. Yeni dosyada `oauth_client` bölümü DOLU olur (boşsa parmak izi eklenmemiştir).
4. Yeni dosyayı projedeki eskisinin yerine koy ve GitHub'a yükle.
5. Firebase > Authentication > Sign-in method > Google > "Web SDK configuration" altındaki **Web client ID**'yi kopyala (`...apps.googleusercontent.com` biçiminde). `config.ts` içinde `googleWebClientId: ''` yerine yapıştır.
6. Yeniden derle. Web client ID boşsa Google düğmesi pasif ve "(yakında)" yazılı kalır.

Play Store'a yükleyince Play kendi anahtarıyla imzalar: Play Console > Setup > App signing > "App signing key certificate" SHA-1/SHA-256'yı da aynı yere ekleyip `google-services.json` dosyasını bir kez daha indir.

## 4. Firestore kuralları (ÇOK ÖNEMLİ)
Firestore Database > **Rules**: `firestore.rules` içeriğinin TAMAMINI yapıştır > **Publish**. Yapılmazsa sohbet, sınıf ve davet çalışmaz.

## 5. Sık sorunlar
- **Doğrulama maili gelmiyor:** Spam klasörü; Firebase'de Email/Password açık mı; şablonda gönderen adı dolu mu. Uygulamada "Bağlantıyı yeniden gönder" var.
- **Google "developer error / 10":** SHA parmak izi eksik ya da `google-services.json` parmak izi eklenmeden önceki eski dosya.
- **auth/operation-not-allowed:** İlgili giriş yöntemi 1. adımda açılmamış.
- Aynı kişi Google ve e-postayla ayrı girerse iki ayrı hesap açılır; hesaplar birleştirilmez.
