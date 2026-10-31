# Play Console izin ve veri beyanları

## Özel izin beyanları (Policy > App content)
| İzin | Neden gerekli (forma yazılacak metin) | Risk |
|---|---|---|
| USE_FULL_SCREEN_INTENT | Uygulama kullanıcının kurduğu ders alarmlarını (alarm saati gibi) kilit ekranında tam ekran gösterir. Kullanıcı her alarmı kendisi oluşturur. | Orta. Alarm/saat uygulaması olarak beyan edilir. |
| PACKAGE_USAGE_STATS | Odak modunda hangi uygulamanın açık olduğunu anlayıp, kullanıcının kilitlemeyi seçtiği uygulamaların üstüne çalışma ekranı koymak. Veri cihazdan çıkmaz, sunucuya gönderilmez. | Yüksek. Ekran videosu isteyebilirler: izin akışını ve kilit ekranını göster. |
| SYSTEM_ALERT_WINDOW | Seçilmiş uygulama açıldığında üstüne "ders zamanı" kilit ekranı çizmek. | Yüksek. Aynı videoda göster. |
| FOREGROUND_SERVICE_SPECIAL_USE | Odak modu sırasında kilit servisi çalışır. Manifestte alt tür açıklaması var. | Orta. |
| RECEIVE_BOOT_COMPLETED | Telefon yeniden başlayınca ders alarmlarını yeniden kurmak. | Düşük. |
| POST_NOTIFICATIONS | Ders ve deneme hatırlatmaları. | Düşük. |

Kullanılmayan izinler kaldırıldı: SCHEDULE_EXACT_ALARM (alarmlar setAlarmClock ile kurulduğu için gerekmiyor), konum, mikrofon, depolama.
QUERY_ALL_PACKAGES kullanılmıyor; uygulama listesi `<queries>` ile alınıyor. Bu iyi, beyan gerektirmez.

İnceleme videosu için (kısa, 1-2 dk): izin ekranı > Kullanım erişimi aç > ders başlat > kilitli uygulama aç > kilit ekranı > erken bitir.

## Veri güvenliği formu
Toplanan veriler (hepsi şifreli aktarılır, hesap silinince silinir, satılmaz):
- E-posta adresi (ve e-posta ile kayıtta şifre, yalnızca Firebase'de şifrelenmiş saklanır): hesap yönetimi, kimlik doğrulama. Google ile girişte ad ve e-posta Google'dan alınır.
- Ad / rol / okul, il ve ilçe bilgisi: uygulama işlevi
- Kullanıcı adı ve arkadaş bağlantıları (arkadaş isteği, haftalık çalışma süresi görünür): uygulama işlevi
- Rozetler (adının yanında göstermeyi seçtiğin en fazla 3 rozet başkalarına görünür; kendi ana sayfanda adının yanında da gözükür): uygulama işlevi
- Şikâyet ve geri bildirim kayıtları: uygulama işlevi, topluluk güvenliği (hesap silinince bile saklanabilir; gizlilik metninde yazılı)
- Doğum yılı: yalnızca yaş sınırı kontrolü için telefonda tutulur, başka amaçla kullanılmaz
- Telefon numarası: toplanmaz, telefonla giriş yok. (Arkadaş listesine elle yazılan numaralar yalnızca telefonda kalır, sunucuya gitmez; forma işaretleme.)
- Ders programı, deneme sonuçları, çalışma süreleri: uygulama işlevi, öğretmen paylaşımı (kullanıcı onayıyla)
- Fotoğraflar (yanlış soru): uygulama işlevi, yalnızca kullanıcı eklerse
- Sohbet mesajları: uygulama işlevi
- Kullanıcı kimliği: hesap
Altyapı: Google Firebase (Authentication + Firestore), "hizmet sağlayıcı" olarak işlenir. Yapay zeka: kullanıcı kendi Gemini anahtarını girerse, istenen içerik Google'a gönderilir. İçerik olarak deneme PDF'i, yanlış soru fotoğrafı ve istek metni gider. Bunu "üçüncü tarafla paylaşım" olarak işaretle (Fotoğraflar, Dosyalar ve belgeler, Uygulama içi mesajlar kategorileri; amaç: uygulama işlevi) ve gizlilik metninde belirt.
Reklam: yok. Reklam kimliği (AD_ID) izni kaldırıldı; Play Console'da reklam kimliği beyanı "Hayır", Veri güvenliği formunda reklamla ilgili kimlik ve IP satırları işaretlenmez.
Uygulama listesi (kilit için): cihazda işlenir, toplanmaz.
Hesap silme adresi: gizlilik sayfasındaki "Hesap silme" bölümü.
