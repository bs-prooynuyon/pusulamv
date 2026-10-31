import * as SecureStore from 'expo-secure-store';
import { CONFIG } from '@/config';
import { aiAllowed } from '@/lib/parentLock';
import { ChatMessage, Subject } from '@/types/planim';

export interface ExamAnalysis {
  title?: string;
  results: Array<{ subject: Subject; correct: number; wrong: number }>;
  weakTopics: string[];
  summary: string;
}

const KEY_NAME = 'planim-gemini-key';

export const getAiKey = async () => { try { return (await SecureStore.getItemAsync(KEY_NAME)) ?? ''; } catch { return ''; } };
export const saveAiKey = (key: string) => SecureStore.setItemAsync(KEY_NAME, key.trim());
export const clearAiKey = () => SecureStore.deleteItemAsync(KEY_NAME);
/** Ebeveyn yapay zekâyı kapattıysa da true döner: gerçek engel gemini() içindedir, böylece "anahtar yok" yerine doğru mesaj çıkar. */
export const hasAiKey = async () => !(await aiAllowed()) || !!(await getAiKey());

const ANALYZE = `Bu PDF bir LGS (8. sınıf) deneme sınavı, cevap anahtarı veya sonuç karnesidir.
Öğrencinin sonuçlarını bulabiliyorsan ders bazında doğru ve yanlış sayılarını çıkar.
Sonuç yoksa (yalnızca soru kitapçığıysa) results boş dizi olsun; uydurma sayı yazma.
Dersler tam olarak şunlardan biri: Türkçe, Matematik, Fen Bilimleri, İnkılap, Din Kültürü, İngilizce.
weakTopics: sonuçlara ya da sorulara göre öğrencinin çalışması gereken en fazla 8 konu.
summary: 2-3 cümlelik Türkçe, cesaretlendirici özet.
SADECE şu JSON'u döndür, başka metin yazma:
{"title": string|null, "results": [{"subject": string, "correct": number, "wrong": number}], "weakTopics": string[], "summary": string}`;

const CHAT = `Sen Pusulam uygulamasındaki sabırlı bir LGS (8. sınıf) öğretmenisin. Öğrenciyle Türkçe, kısa ve anlaşılır konuş.
Önce sorunun nasıl çözüldüğünü adım adım anlat, gerekirse benzer bir örnek ver. Emin olmadığın şeyi uydurma; PDF'te göremiyorsan söyle.`;

/** Denenecek modeller: ayardaki model yoksa ya da kota doluysa sıradaki denenir. */
const MODELS = () => [...new Set([CONFIG.geminiModel, 'gemini-flash-latest', 'gemini-2.5-flash', 'gemini-2.0-flash'])];

/** Gemini generateContent çağrısı. Model yok (404), kota dolu (429) ya da sunucu yoğun (5xx) ise yedek modele geçer. */
async function gemini(system: string, contents: unknown[], json = false): Promise<string> {
  if (!(await aiAllowed())) throw new Error('AI_OFF');
  const key = await getAiKey();
  if (!key) throw new Error('NO_KEY');
  let last = 'HTTP';
  for (const model of MODELS()) {
    let res: Response;
    try {
      res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents,
          generationConfig: json ? { responseMimeType: 'application/json' } : {},
        }),
      });
    } catch (e) {
      throw new Error(`NET:${e instanceof Error ? e.message : 'bağlantı yok'}`);
    }
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      const text = (data?.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? '').join('\n');
      if (text.trim()) return text;
      last = `EMPTY:${data?.promptFeedback?.blockReason ?? data?.candidates?.[0]?.finishReason ?? 'boş yanıt'}`;
      continue;
    }
    const msg: string = data?.error?.message || `HTTP ${res.status}`;
    last = `${res.status}:${msg}`;
    // Anahtar sorunu: yedek model denemek işe yaramaz.
    if (res.status === 401 || res.status === 403 || (res.status === 400 && /api key|API_KEY/i.test(msg))) throw new Error(`KEY:${msg}`);
    // 404, 429, 5xx ve diğer 400'ler: sıradaki modeli dene.
  }
  throw new Error(last);
}

const pdfPart = (b64?: string) => (b64 ? [{ inlineData: { mimeType: 'application/pdf', data: b64 } }] : []);

/** Deneme PDF'ini okutur; doğru/yanlış sayılarını ve zayıf konuları çıkarır. */
export async function analyzeExamPdf(pdfBase64: string): Promise<ExamAnalysis> {
  const text = await gemini('Sen dikkatli bir sınav analiz asistanısın.', [{ role: 'user', parts: [...pdfPart(pdfBase64), { text: ANALYZE }] }], true);
  const match = text.match(/\{[\s\S]*\}/);
  try { return JSON.parse(match ? match[0] : text) as ExamAnalysis; } catch { throw new Error('PARSE'); }
}

/** Deneme hakkında soru sorma. PDF ilk mesajla her istekte yeniden gönderilir. */
export async function askAboutExam(messages: ChatMessage[], pdfBase64?: string, context?: string): Promise<string> {
  const history = messages.slice(-20);
  const contents = history.map((m, i) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: i === 0 && m.role !== 'assistant'
      ? [...pdfPart(pdfBase64), { text: (context ? `Bağlam: ${context}\n\n` : '') + m.text }]
      : [{ text: m.text }],
  }));
  return gemini(CHAT, contents);
}

export const aiErrorText = (error: unknown) => {
  const m = error instanceof Error ? error.message : '';
  if (m === 'AI_OFF') return 'Yapay zeka şu an kapalı. Ebeveyn, Ayarlar > Yapay zeka bölümünden PIN ile açabilir.';
  if (m === 'NO_KEY') return 'Önce Ayarlar > Yapay zeka bölümüne Gemini API anahtarını ekle.';
  if (m.startsWith('KEY:')) return `Gemini anahtarın kabul edilmedi. Ayarlar > Yapay zeka bölümünden anahtarı kontrol et.\n\nAyrıntı: ${m.slice(4, 160)}`;
  if (m === 'PARSE') return 'Yapay zeka PDF’i okuyamadı. Netleri elle girebilirsin.';
  if (m.startsWith('NET:')) return 'Yapay zekaya ulaşılamadı. İnternet bağlantını kontrol edip tekrar dene.';
  if (m.startsWith('429:')) return 'Gemini kullanım sınırı doldu. Birkaç dakika sonra tekrar dene; ücretsiz anahtarlarda dakikalık/günlük sınır vardır.';
  if (m.startsWith('EMPTY:')) return `Yapay zeka boş yanıt döndürdü. Soruyu biraz değiştirip tekrar dene.\n\nAyrıntı: ${m.slice(6, 120)}`;
  return `Yapay zeka şu an yanıt veremedi.${m ? `\n\nAyrıntı: ${m.slice(0, 200)}` : ''}`;
};

export interface PlannedLesson { day: number; name: string; startTime: string; endTime: string; topics: string[] }

/** Öğrencinin müsaitliğine ve eksik konularına göre haftalık ders programı önerir. */
export async function generateSchedule(request: string): Promise<PlannedLesson[]> {
  const system = `Sen LGS (8. sınıf) çalışma koçusun. Öğrenciye gerçekçi, dengeli, dinlenme günü bırakan bir haftalık ders programı hazırla.
Dersler tam olarak şunlardan biri olmalı: Türkçe, Matematik, Fen Bilimleri, İnkılap, Din Kültürü, İngilizce, Deneme.
day: 0=Pazartesi ... 6=Pazar. startTime/endTime "SS:DD". Her ders 30-90 dakika. topics: öğrencinin eksik konu listesinden seçilen başlıklar (yoksa boş dizi).
SADECE şu JSON dizisini döndür: [{"day":number,"name":string,"startTime":string,"endTime":string,"topics":string[]}]`;
  const text = await gemini(system, [{ role: 'user', parts: [{ text: request }] }], true);
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) throw new Error('Program okunamadı');
  const raw = JSON.parse(match[0]) as PlannedLesson[];
  const ok = ['Türkçe', 'Matematik', 'Fen Bilimleri', 'İnkılap', 'Din Kültürü', 'İngilizce', 'Deneme'];
  const time = /^([01]\d|2[0-3]):[0-5]\d$/;
  return raw.filter((l) => ok.includes(l.name) && l.day >= 0 && l.day <= 6 && time.test(l.startTime) && time.test(l.endTime) && l.startTime < l.endTime).map((l) => ({ ...l, topics: Array.isArray(l.topics) ? l.topics : [] }));
}

/** Yanlış yapılan sorunun fotoğrafını adım adım çözer. */
export async function solveQuestionPhoto(imageBase64: string, subject: string): Promise<string> {
  return gemini(CHAT, [{ role: 'user', parts: [{ inlineData: { mimeType: 'image/jpeg', data: imageBase64 } }, { text: `Bu bir ${subject} sorusu. Adım adım çöz, doğru cevabı ve neden yanlış yapılmış olabileceğini kısaca anlat.` }] }]);
}

const ASSISTANT_STUDENT = `Sen Pusulam uygulamasındaki yapay zeka koçusun. 8. sınıf LGS öğrencisiyle Türkçe, samimi ve kısa konuş.
Ders sorularını adım adım anlat, çalışma planı ve motivasyon konusunda yardım et. Emin olmadığın şeyi uydurma.`;
const ASSISTANT_TEACHER = `Sen Pusulam uygulamasında bir ortaokul öğretmenine yardım eden yapay zeka asistanısın. Türkçe, saygılı ve kısa konuş.
Ders planı, 8. sınıf LGS çalışma programı, ölçme-değerlendirme, öğrenci ve veli iletişimi gibi konularda öneri ver. Öğrencilerin kişisel bilgilerini isteme; emin olmadığın şeyi uydurma.`;

/** Serbest sohbet. Kişiye göre (öğrenci / öğretmen) farklı bir asistan gibi davranır. */
export async function askAssistant(messages: ChatMessage[], role: 'student' | 'teacher'): Promise<string> {
  const contents = messages.slice(-20).map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.text }] }));
  return gemini(role === 'teacher' ? ASSISTANT_TEACHER : ASSISTANT_STUDENT, contents);
}
