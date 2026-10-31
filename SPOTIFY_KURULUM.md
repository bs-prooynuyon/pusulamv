# Spotify kurulumu (bir kerelik)

1. https://developer.spotify.com/dashboard adresine Spotify hesabınla gir → **Create app**.
2. App name: Pusulam. **Redirect URI** olarak aynen şunu ekle: `planim://spotify-callback`
3. "Which API/SDKs are you planning to use?" → **Web API** seç. Kaydet.
4. **Settings** sayfasındaki **Client ID**'yi kopyala.
5. İki seçenek:
   - `app.json` içinde `"extra": { "spotifyClientId": "BURAYA" }` yaz, sonra APK'yı derle (öğrenci hiçbir şey girmez), **veya**
   - Boş bırak; uygulamada Spotify bağlarken Client ID'yi yapıştır.
6. Dashboard → **User Management** bölümüne, uygulamayı kullanacak Spotify hesabının adını ve e-postasını ekle
   (Development Mode'daki uygulamalar yalnızca eklenen hesaplarla çalışır).

Not: Müziği doğrudan başlatmak (Web API) Spotify Premium ister. Ücretsiz hesapta Spotify açılır, play'e kendin basarsın.
