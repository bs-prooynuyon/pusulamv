# Denetim sonrası yapılacaklar (elle)

Kodla çözülemeyen ya da senin karar vermen gereken maddeler.

## 1. İletişim ve veri sorumlusu (ZORUNLU)
`constants/privacy.ts` içinde iki yer tutucu duruyor:
- `CONTACT_EMAIL` (7. satır): TAMAM, pusulamapp.destek@gmail.com yazıldı
- "Veri sorumlusu" (haklar bölümü): TAMAM, "Pusulam Yazılım" yazıldı. Bu ad resmî olarak kayıtlı bir işletmeye ya da senin gerçek adına bağlanmalı
Bunlar boş kaldıkça aydınlatma metni geçerli sayılmaz ve kullanım şartlarındaki bildirim adresi de boş görünür.

## 2. Firestore konumu
Firebase konsolu > Firestore Database > Ayarlar'da veritabanı konumunu (örn. europe-west) kontrol et. Metin "Türkiye dışında" diyor; konum Türkiye'de olamaz, ama hangi bölge olduğunu bilmen iyi olur.

## 3. Şikayetleri nasıl incelersin / içerik nasıl kaldırırsın
- Şikayetler: Firestore > Data > `reports` koleksiyonu (`messageId`, `groupId`, `body`, `reason`, `reporterId`).
- Mesajı kaldırmak: Firestore > `groups` > ilgili grup > `messages` > mesaj > belgeyi sil (konsol yönetici olarak kurallara takılmaz).
- Kullanıcıyı gruptan çıkarmak: `groupMembers` > `{groupId}_{userId}` belgesini sil.
- Hesabı kapatmak: Authentication > Users > kullanıcı > Hesabı devre dışı bırak.
- Kullanım şartlarına "en kısa sürede" yazıldı. Gerçekten tutabileceğin bir süre (örn. 72 saat) yazmak istersen söyle.

## 4. App Check (güvenlik, yayından önce)
Şu an kapalı. Sebep: kapalı değilken kayıt hata veriyordu, çünkü uygulama App Check belirteci üretmiyor. Güvenli açma sırası:
1. Koda `@react-native-firebase/app-check` eklenir, Play Integrity sağlayıcısı başlatılır (kod işi).
2. Firebase konsolu > App Check'te uygulama Play Integrity ile kaydedilir.
3. Uygulama Play Store'a (en azından iç test kanalına) yüklenir; yan yüklemeli (APK) sürümlerde belirteç alınamaz.
4. Önce "izleme" modunda bakılır, hata yoksa "Zorunlu kıl" açılır.
Bunu Play Store'a çıkmadan hemen önce yaparız; şimdi açmak uygulamayı bozar.

## 5. Yaş doğrulama
Şu an sadece "18 yaşından küçüksem ebeveynim bilgilendirildi" kutusu var. 13 yaş altını engelleyen bir kontrol yok. Gerekirse kayıt ekranına doğum yılı sorusu ekleriz.

## 6. Mağaza gizlilik politikası
Play Console'a girdiğin gizlilik politikası bağlantısı uygulamadaki metinle aynı olmalı. Metni bir web sayfasında yayınlayıp bağlantısını mağazaya girmen gerekir (şimdilik uygulamada).

## 7. Avukat
Aydınlatma metni ve kullanım şartları taslaktır. Özellikle yurt dışı aktarım (açık rıza) ve 5651 yer sağlayıcı bölümlerini yayından önce bir hukukçuya okut.

## 8. 31 Ekim 2026 oturumunun analizi
Yapıldı: LGS 2027 tarihi (13 Haziran 2027, eski kayıtlı tahmini tarih artık geçersiz), mola düzeltmesi, uygulama silinince derse dönüş, ders çakışma kontrolü, sohbet silme yetkisi ve WhatsApp görünümü, eski oda temizliği, gizlilik metni sürüm 13.
Elle yapılacaklar (kodla çözülemez): firestore.rules'u Firebase Console'da yayınlamak; yeni APK'yı derleyip gerçek telefonda denemek; Firebase API anahtarını Google Cloud'da Android uygulamasına kısıtlamak; SHA-1 değerini Firebase'e eklemek; imza anahtarını yedeklemek; KVKK avukatına danışmak (13-17 yaş veli onayı, sohbet, yurt dışı aktarım, Gemini).
Bilinen sınırlar: Android'de uygulama "silinemez" yapılamaz, yeniden açma yöntemi bazı telefonlarda çalışmayabilir. Çıkarılan öğrenci sınıf koduyla tekrar katılabilir. APK dağıtımında AdMob geliri sınırlıdır; reklamlar şu an kapalıdır (reklam-yedek/ads.ts.txt). Yapay zeka kullanıcının kendi Gemini anahtarıyla çalışır; anahtarı uygulamaya gömme.
