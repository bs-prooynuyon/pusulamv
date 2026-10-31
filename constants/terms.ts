/** Kullanım şartları ve sohbet kuralları – taslak, yayınlamadan önce bir hukukçuya okut. */
import { CONTACT_EMAIL } from '@/constants/privacy';

export const TERMS_VERSION = '2';

export const TERMS_SECTIONS: Array<{ title: string; body: string }> = [
  { title: 'Kimler kullanabilir?', body: 'Pusulam 13 yaş ve üzeri öğrenciler ile öğretmenler içindir. 18 yaşından küçükler, ebeveyn veya yasal vasinin bilgisi ve onayı ile kullanır.' },
  { title: 'Hesabın', body: 'Hesabındaki bilgilerin doğru olması senin sorumluluğundadır. Öğretmen olmadığın hâlde öğretmen gibi davranmak yasaktır; böyle bir durumda hesabın kapatılabilir.' },
  { title: 'Sohbet kuralları', body: '• Herkese saygılı ol. Hakaret, zorbalık, tehdit ve ayrımcılık yasaktır.\n• Uygunsuz, şiddet içeren, cinsel ya da yasa dışı içerik paylaşma.\n• Reklam, spam ve zincir mesaj gönderme.\n• Kendi ya da başkasının kişisel bilgisini (telefon, adres, kimlik, okul dışı buluşma) paylaşma.\n• Sınav sorularını ya da telifli içerikleri izinsiz paylaşma.' },
  { title: 'Şikayet ve engelleme', body: 'Kurallara uymayan bir mesajı basılı tutup şikayet edebilir, kişiyi engelleyebilirsin. Kurallara uymayan mesajlar silinebilir, kullanıcılar gruptan çıkarılabilir ya da hesapları kapatılabilir. Şikayetler uygulama yöneticisi tarafından en kısa sürede incelenir; kurallara aykırı bulunan içerik kaldırılır. Grubu kuran kişinin bulunmadığı gruplarda (örn. okul grupları) şikayetleri yalnızca yönetici inceler.' },
  { title: 'İçerik ve telif bildirimi', body: `Pusulam, sohbet gibi alanlarda kullanıcıların yazdığı içeriklerin yer sağlayıcısıdır; içerikten onu yazan kişi sorumludur. Hukuka aykırı bir içerik, telif hakkını ihlal eden bir paylaşım ya da kişisel verinle ilgili bir talebin varsa ${CONTACT_EMAIL} adresine yaz. Bildiriminde içeriğin nerede olduğunu ve neden sorun olduğunu belirt. Haklı bulunan bildirimlerdeki içerik kaldırılır.` },
  { title: 'Öğretmenler için', body: 'Öğrencilerden aldığın çalışma raporlarını yalnızca öğrencinin gelişimini desteklemek için kullan, başkalarıyla paylaşma. Öğrenciler raporu onaylamak zorunda değildir ve reddetme hakkına sahiptir.' },
  { title: 'Yapay zeka', body: 'Yapay zeka yanıtları yanlış ya da eksik olabilir. Önemli kararlar için öğretmenine danış. Yapay zeka çıktısı uygunsuz görünürse Şikayet / öneri bölümünden bize bildir.' },
  { title: 'Sorumluluk', body: 'Pusulam bir çalışma takip aracıdır; sınav başarısı garantisi vermez. Uygulama olduğu gibi sunulur; kesintisiz çalışacağı garanti edilmez.' },
  { title: 'Değişiklikler', body: 'Bu şartlar zaman zaman güncellenebilir. Önemli değişikliklerde onayın yeniden istenir.' },
];
