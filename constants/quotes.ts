/** Günün sözü: motivasyon cümleleri ve birkaç hafif espri. Yeni söz eklemek için listeye satır ekle. */
export const QUOTES: string[] = [
  'Bugün attığın küçük adım, yarının büyük sonucuna dönüşür.',
  'Mükemmel olmak zorunda değilsin; devam etmen yeterli.',
  'Kendine verdiğin sözü tuttuğun her gün güçleniyorsun.',
  'Zorlandığın konu, başarının bir sonraki durağı olabilir.',
  'Yanlış yaptığın soru, doğruya giden en kısa yoldur.',
  'Bir saat çalışmak, bir saat endişelenmekten her zaman daha hafiftir.',
  'Bugünkü sen, dünkü senden bir konu daha ilerideysen kazanıyorsun.',
  'Başlamak için hazır hissetmeni bekleme; başlayınca hazır hissedersin.',
  'Sınav bir gün, hazırlık her gün. Sen bugünü hallet.',
  'Yorulduysan dinlen ama bırakma.',
  'Her deneme, asıl sınavın prova sahnesi.',
  'Küçük hedefler büyük hedefin merdivenidir.',
  'Kendini başkasıyla değil, dünkü seninle karşılaştır.',
  'Net sayısı seni tanımlamaz; emeğin seni tanımlar.',
  'Zor soru yoktur, henüz tanışmadığın soru vardır.',
  'Bugün 20 dakika odaklanmak, yarın 2 saatlik telaşı önler.',
  'Çalışma masası, hayallerinin ilk durağı.',
  'Düzenli çalışan, şansa ihtiyaç duymaz.',
  'Bir konuyu anladığında hissettiğin o ferahlık için çalışıyorsun.',
  'Her gün biraz, bir ayda çok.',
  'Telefon beklesin, hedeflerin beklemez.',
  'Matematik hayatın içinde: bugün kaç soru çözeceğini hesapla, sonra çöz.',
  'İyi bir mola da çalışmanın parçasıdır.',
  'Dün yapamadığını bugün deneyebilirsin. Bu çok güzel bir şey.',
  'Hata yapmaktan korkma; hata yapmadan öğrenen yok.',
  'Sabır en iyi çalışma arkadaşıdır, hep yanında.',
  'Bugün vazgeçmek istediğin an, aslında bir adım önündeki andır.',
  'Espri: Fiilimsiler neden ders çalışmaz? Çünkü zaten her şeyi yarım yapar.',
  'Espri: Matematik kitabı neden üzgün? Çünkü bir sürü problemi var.',
  'Espri: Kronometre ile ders çalışmak: süre akıyor, sen de akıyorsun.',
];

/** Yerel saate göre YYYY-AA-GG. */
export function todayKey(date = new Date()) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function quoteOfToday(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0).getTime();
  const dayOfYear = Math.floor((date.getTime() - start) / 86400000);
  return QUOTES[dayOfYear % QUOTES.length];
}
