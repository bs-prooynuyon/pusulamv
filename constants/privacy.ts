/**
 * Aydınlatma metni (KVKK) – burada düzenlenir. Veri sorumlusu ve iletişim e-postası dolduruldu.
 * NOT: Bu metin bir taslaktır. Yayınlamadan önce bir hukukçuya okutman önerilir.
 * Metin ciddi biçimde değişince PRIVACY_VERSION’ı artır; kullanıcılara onay ekranı yeniden gösterilir.
 */
export const PRIVACY_VERSION = '13';
export const CONTACT_EMAIL = 'pusulamapp.destek@gmail.com';

export const PRIVACY_SECTIONS: Array<{ title: string; body: string }> = [
  {
    title: 'Kısaca',
    body: 'Pusulam, LGS çalışmanı takip etmene yardım eder. Hesap açmadan kullanırsan bilgilerin yalnızca bu cihazda kalır. Hesap açarsan (e-posta ve şifre ya da Google hesabınla giriş) bilgilerin, cihazlar arası eşitleme ve sohbet gibi özellikler için bir sunucuda da saklanır. Uygulama hiçbir raporu kendiliğinden kimseye göndermez.',
  },
  {
    title: 'Telefonunda işlenen bilgiler',
    body:
      '• Adın, LGS yılın, hedef lisen ve hedef netin\n' +
      '• Ders programın, deneme ve soru sonuçların, eksik konuların, yanlış yaptığın soruların fotoğrafları\n' +
      '• Ders sırasında hangi uygulamanın kaç dakika açıldığı (yalnızca uygulama adı ve süre)\n' +
      '• Telefonda yüklü uygulamaların listesi (kilitleyeceklerini seçebilmen için)\n' +
      '• Müzik listelerin ve yüklediğin müzik dosyaları\n' +
      '• Yapay zeka sohbet geçmişin (yalnızca telefonunda kalır; çıkış yapınca ya da verileri silince silinir)\n' +
      '• Arkadaş listene yazdığın kişilerin adı ve telefon numarası (yalnızca telefonunda kalır, sunucuya gitmez)',
  },
  {
    title: 'Hesap açarsan sunucuya giden bilgiler',
    body:
      '• E-posta adresin, (e-posta ile kayıt olduysan) şifren (yalnızca şifrelenmiş olarak, ben göremem), adın, rolün (öğrenci / öğretmen), okulun, ili ve ilçen\n' +
      '• Eşitleme için ders programın, deneme sonuçların, konuların ve ayarların (fotoğraf ve müzik dosyaları gönderilmez)\n' +
      '• Katıldığın sohbet grupları, grup üyeliklerin ve yazdığın mesajlar (sınıf sohbetinde adın, sınıftaki öğretmen ve öğrencilere görünür)\n' +
      '• Sınıf üyeliğin ve (yalnızca sen onaylarsan) öğretmenine gönderilen çalışma özeti\n' +
      '• Yaptığın şikayet ve geri bildirimler\n' +
      'Hesap ve veri hizmetini Google Firebase (Authentication ve Firestore) sağlar. Google ile girersen adın ve e-postan Google’dan alınır. Firebase sunucuları Türkiye dışındadır; hesap açtığında bilgilerin yurt dışına aktarılır. Bu aktarım, onay ekranında verdiğin açık rızana dayanır. Hesap açmazsan bilgilerin yurt dışına gitmez.',
  },
  {
    title: 'Yapay zeka',
    body: 'Yapay zeka özelliklerini kullanırsan (deneme PDF analizi, yanlış soru çözümü, program önerisi) gönderdiğin PDF, fotoğraf ve istek, kendi Gemini anahtarınla Google\'ın yapay zeka hizmetine iletilir. Anahtarın yalnızca telefonunda saklanır. Bu hizmet Türkiye dışındadır; yani gönderdiğin içerik yurt dışına aktarılır ve bu da onay ekranındaki açık rızana dayanır. PDF ve fotoğraflarda adın, okulun gibi bilgiler görünüyorsa göndermeden önce kapatmanı öneririz. 18 yaşından küçük kullanıcılarda yapay zeka başlangıçta kapalıdır; ebeveyninin belirlediği 4 haneli PIN ile Ayarlar’dan açılıp kapatılır. PIN yalnızca telefonunda, şifrelenmiş biçimde saklanır. Yapay zeka yanıtları hatalı olabilir; önemli konularda öğretmenine danış.',
  },
  {
    title: 'Müzik bağlantıları',
    body: 'Müzik bölümüne YouTube, Spotify gibi bağlantılar ya da telefonundaki ses dosyaları ekleyebilirsin. Pusulam bir müzik hesabına bağlanmaz; bağlantılar ve dosyalar yalnızca telefonunda saklanır. Bağlantı açıldığında ilgili uygulamanın kendi gizlilik politikası geçerlidir.',
  },
  {
    title: 'Hangi bilgiler işlenmez?',
    body: 'Mesajların (WhatsApp, SMS vb.), telefondaki fotoğrafların, konumun, rehberin ve diğer uygulamaların içindeki hiçbir şey okunmaz. Sadece ders sırasında hangi uygulamanın açık olduğu bilinir.',
  },
  {
    title: 'Ne için kullanılır?',
    body: 'Ders alarmları, ders sırasında seçtiğin uygulamaların kilitlenmesi (yalnızca Android), günlük hedeflerin takibi, cihazlar arası eşitleme, sınıf ve sohbet grupları ile senin isteğinle paylaşabileceğin raporlar için. Verilerin satılmaz. Uygulamada reklam gösterilmez ve bilgilerin reklam amacıyla kullanılmaz.',
  },
  {
    title: 'Yaş sınırı',
    body: 'Pusulam 13 yaş ve üzeri öğrenciler içindir. İlk açılışta yaş sınırını kontrol etmek için doğum yılın sorulur; 13 yaşından küçükler uygulamayı kullanamaz. Doğum yılın başka bir amaçla kullanılmaz. 18 yaşından küçüksen uygulamayı ebeveynin veya yasal vasinin bilgisi ve onayıyla kullanman gerekir.',
  },
  {
    title: 'Raporlar ve paylaşım',
    body: 'Veli raporu PDF olarak oluşturulur ve kime göndereceğine sen karar verirsin; WhatsApp\'ta gönder tuşuna sen basarsın. Öğretmenin rapor isterse, sen onay vermeden hiçbir bilgin gitmez; reddedebilirsin.',
  },
  {
    title: 'Sohbet ve güvenlik',
    body: 'Gruba yazdığın mesajları o grubun üyeleri görür. Uygunsuz bir mesajı şikayet edebilir, kişiyi engelleyebilirsin. Herkes yalnızca kendi mesajını silebilir; sınıf gruplarında grubu kuran öğretmen herkesin mesajını silebilir ve üye çıkarabilir. Şikayetler grubu kuran kişiye ve uygulama yöneticisine iletilir; grubu kuran kişinin bulunmadığı gruplarda (örn. okul grupları) şikayetleri yalnızca uygulama yöneticisi inceler. Kişisel bilgilerini (telefon, adres, okul dışı buluşma vb.) grup sohbetinde paylaşma.',
  },
  {
    title: 'Rozetler',
    body: 'Çalışma süren, seri günün, çözdüğün soru sayısı gibi başarılarından kazandığın rozetlerin listesi hesabına kaydedilir. Sınıf ve gruplardaki diğer üyeler, arkadaşların ve öğretmenin kazandığın rozetleri ve adının yanında göstermeyi seçtiğin en fazla 3 rozeti görebilir. Rozetin dayandığı ayrıntılı çalışma verisi paylaşılmaz. Rozetlerini adının yanında göstermeyi Rozetlerim ekranından kapatabilirsin.',
  },
  {
    title: 'Kullanıcı adı ve arkadaşlar',
    body: 'İstersen bir kullanıcı adı seçersin. Kullanıcı adını bilen kişi sana arkadaşlık isteği gönderebilir; öğretmenin de seni bu adla sınıfa davet edebilir. Arkadaşlığı kabul ettiğin kişiler adını ve bu haftaki toplam çalışma süreni görür. İstediğin zaman arkadaşlıktan çıkabilir ya da isteği reddedebilirsin.',
  },
  {
    title: 'Ödevler ve birlikte çalışma',
    body: 'Öğretmenin sınıfa koyduğu ödevi ya da hedefi tamamladığında adın ve tamamlama zamanın öğretmene görünür. Arkadaşınla çalışma odası açarsan, odadaki kişi çalıştığını ya da molada olduğunu ve adını görür; oda kapanınca ya da 3 saati geçince oda kaydı ve içindeki durum bilgisi uygulama açılırken silinir. Rozetlerin hesabına kaydedilir (Rozetler bölümüne bak).',
  },
  {
    title: 'Saklama ve silme',
    body: 'Hesabın açık olduğu sürece bilgilerin sunucuda tutulur; hesabını silince mesajların da dahil olmak üzere hepsi silinir. Sohbet mesajları, ait olduğu grup silinene ya da sen hesabını silene kadar saklanır. Başkası hakkında yaptığın ya da hakkında yapılan şikayet kayıtları topluluğu korumak için hesap silindikten sonra da saklanabilir; bunların silinmesini iletişim adresinden isteyebilirsin. Firebase gibi hizmet sağlayıcılar kendi teknik kayıtlarını (log) tutabilir. Ayarlar > \"Hesabımı kalıcı olarak sil\" ile hesabını ve sunucudaki tüm bilgilerini (mesajların dahil) istediğin an silebilirsin; bu geri alınamaz. \"Tüm verilerimi sil\" ise yalnızca bu telefondaki verileri siler. İzinleri telefonun Ayarlar bölümünden istediğin zaman kapatabilirsin.',
  },
  {
    title: 'Haklarını nasıl kullanırsın?',
    body: '6698 sayılı KVKK kapsamında bilgi alma, düzeltme, silme ve itiraz haklarına sahipsin. Veri sorumlusu: Pusulam Yazılım. Başvuru için: pusulamapp.destek@gmail.com.',
  },
  {
    title: 'Reşit olmayanlar için',
    body: 'Uygulama 13 yaş ve üzeri içindir. 18 yaşından küçükler için bu onayı ebeveyn veya yasal vasi vermelidir.',
  },
];
