/**
 * PLANIM – tek yerden ayarlar.
 * Sonradan elle değiştireceğin her şey burada. Değiştirince APK'yı yeniden derle.
 */
export const CONFIG = {
  /**
   * Hesap + cihazlar arası eşitleme: Firebase (Authentication + Firestore). Gerçek bağlantı bilgisi google-services.json'dan gelir; buradaki değerler yalnızca "hesap sistemi kurulu mu" kontrolü içindir.
   * Boş bırakılırsa uygulama hesapsız (yalnızca bu telefonda) çalışır.
   */
  firebase: {
    apiKey: 'AIzaSyDH4mmUY_2QBBSX3usS5U1twZY6bVixnXs',
    authDomain: 'pusulam-279f5.firebaseapp.com',
    projectId: 'pusulam-279f5',
    storageBucket: 'pusulam-279f5.firebasestorage.app',
    messagingSenderId: '686718388985',
    appId: '1:686718388985:android:618bdafe577121b321f028',
  },
  /** Google ile giriş: true = açık. Web client ID boşsa düğme pasif kalır (FIREBASE_KURULUM.md adım 3). */
  googleSignInEnabled: true,
  /** Google ile giriş: Firebase > Authentication > Google > Web SDK yapılandırması > Web client ID. */
  googleWebClientId: '686718388985-1rc5jov65ftvi8goj1f2rmltolgr2hp5.apps.googleusercontent.com',

  /** Yapay zeka: öğrenci kendi Gemini API anahtarını Ayarlar > Yapay zeka'ya yazar. Model çalışmazsa yedek modeller sırayla denenir. */
  geminiModel: 'gemini-flash-latest',

  /** Spotify Developer Dashboard > Client ID. Boş bırakılırsa uygulama bağlarken ister. */
  spotifyClientId: '',

  /**
   * "Yaygın uygulamalar" listesi. Ders sırasında kilitlenecekler için hızlı seçim.
   * Telefonda yüklü olanlar tek dokunuşla işaretlenir. pkg = Android paket adı.
   */
  commonDistractionApps: [
    { pkg: 'com.instagram.android', label: 'Instagram' },
    { pkg: 'com.zhiliaoapp.musically', label: 'TikTok' },
    { pkg: 'com.ss.android.ugc.trill', label: 'TikTok' },
    { pkg: 'com.google.android.youtube', label: 'YouTube' },
    { pkg: 'com.snapchat.android', label: 'Snapchat' },
    { pkg: 'com.twitter.android', label: 'X (Twitter)' },
    { pkg: 'com.facebook.katana', label: 'Facebook' },
    { pkg: 'com.pinterest', label: 'Pinterest' },
    { pkg: 'com.netflix.mediaclient', label: 'Netflix' },
    { pkg: 'com.roblox.client', label: 'Roblox' },
    { pkg: 'com.supercell.brawlstars', label: 'Brawl Stars' },
    { pkg: 'com.mojang.minecraftpe', label: 'Minecraft' },
    { pkg: 'com.pubg.imobile', label: 'PUBG' },
    { pkg: 'com.kiloo.subwaysurf', label: 'Subway Surfers' },
  ],

  /** "Arkadaşımla çalışıyorum" için varsayılan izinli uygulamalar. */
  friendStudyDefaults: [
    'com.whatsapp',
    'com.google.android.apps.tachyon', // Google Meet / Duo
    'us.zoom.videomeetings',
    'org.telegram.messenger',
  ],

  /**
   * Reklam (Google AdMob). Yayından önce:
   *  1) AdMob'da uygulamayı ekle, "Geçiş reklamı (Interstitial)" reklam birimi oluştur.
   *  2) app.json'daki androidAppId'yi (ca-app-pub-...~...) gerçek uygulama kimliğinle değiştir.
   *  3) Geçiş reklamı birim kimliğini aşağıya yaz ve useTestAds'i false yap.
   * useTestAds true iken Google'ın test reklamları gösterilir (geliştirme sırasında hep böyle kalsın).
   */
  ads: {
    enabled: false, // Reklamlar şimdilik kapalı (lib/ads.ts reklamsız sürüm)
    useTestAds: true,
    /** AdMob > Reklam birimleri > "Geçiş reklamı (Interstitial)" birimi oluşturup kimliğini buraya yaz. */
    androidInterstitialUnitId: '',
    /** Aynı oturumda iki geçiş reklamı arasındaki en az süre (dakika). */
    minGapMinutes: 5,
    /** Oturumdaki ilk uygun anı atla: kullanıcı önce uygulamayı rahatça kullansın. */
    skipFirst: true,
  },

  /** Müzik uygulamaları ders sırasında kilitlenmez (müzik çalmaya devam etsin). */
  musicApps: ['com.spotify.music', 'com.google.android.apps.youtube.music'],

  /** Dersin bitişinden önce kilit kendiliğinden kalkmaz; sadece bu kadar saniye "erken bitir" basılı tutulur. */
  earlyFinishHoldMs: 2500,
};
