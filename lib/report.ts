import { FocusSession, MockExam, QuestionLog, Topic } from '@/types/planim';

const MONTHS_ASCII = ['ocak', 'subat', 'mart', 'nisan', 'mayis', 'haziran', 'temmuz', 'agustos', 'eylul', 'ekim', 'kasim', 'aralik'];
const MONTHS_TR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const DAYS_TR = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

export type ReportKind = 'weekly' | 'monthly';

const esc = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** İçinde bulunulan haftanın (Pazartesi–Pazar) ya da ayın aralığı. */
export function currentRange(kind: ReportKind, now = new Date()) {
  if (kind === 'monthly') {
    return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59) };
  }
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
  return { start, end: new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6, 23, 59, 59) };
}

/** 17-23_eylul_haftalik_ozet.pdf  /  eylul_aylik_ozet.pdf */
export function reportFileName(kind: ReportKind, start: Date, end: Date) {
  return kind === 'weekly'
    ? `${start.getDate()}-${end.getDate()}_${MONTHS_ASCII[end.getMonth()]}_haftalik_ozet.pdf`
    : `${MONTHS_ASCII[end.getMonth()]}_aylik_ozet.pdf`;
}

export interface TopicStat { key: string; subject: string; title: string; correct: number; wrong: number; blank: number; solved: number }

/** Aralıktaki kayıtlardan, çalışılan her konunun soru dökümünü çıkarır (eksik konular dahil değildir). */
export function studiedTopicStats(logs: QuestionLog[], topics: Topic[], range: { start: Date; end: Date }): TopicStat[] {
  const map = new Map<string, TopicStat>();
  const touch = (key: string, subject: string, title: string) => { let cur = map.get(key); if (!cur) { cur = { key, subject, title, correct: 0, wrong: 0, blank: 0, solved: 0 }; map.set(key, cur); } return cur; };
  logs.filter((log) => { const d = new Date(log.date); return d >= range.start && d <= range.end; }).forEach((log) => {
    if (log.entries?.length) {
      log.entries.forEach((entry) => {
        const cur = touch(entry.topicId === 'general' ? `general|${log.subject}` : entry.topicId, log.subject, entry.topicId === 'general' ? 'Genel soru çözümü' : entry.title);
        cur.correct += entry.correct; cur.wrong += entry.wrong; cur.blank += entry.blank; cur.solved += entry.correct + entry.wrong + entry.blank;
      });
    } else {
      log.topicIds.forEach((id) => { const topic = topics.find((t) => t.id === id); if (topic) touch(id, topic.subject, topic.title); });
    }
  });
  return [...map.values()].sort((a, b) => a.subject.localeCompare(b.subject, 'tr') || b.solved - a.solved);
}

export interface ReportInput {
  kind: ReportKind;
  studentName: string;
  primary: string;
  sessions: FocusSession[];
  exams: MockExam[];
  topics: Topic[];
  logs: QuestionLog[];
}

export function buildReportHtml({ kind, studentName, primary, sessions, exams, topics, logs }: ReportInput) {
  const { start, end } = currentRange(kind);
  const inRange = (iso: string) => { const d = new Date(iso); return d >= start && d <= end; };
  const rangeSessions = sessions.filter((item) => inRange(item.date));
  const dayCount = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
  const perDay = Array.from({ length: dayCount }, (_, index) => {
    const day = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
    return rangeSessions.filter((item) => sameDay(new Date(item.date), day)).reduce((sum, item) => sum + item.durationMinutes, 0);
  });
  const totalMinutes = perDay.reduce((sum, value) => sum + value, 0);
  const maxDay = Math.max(1, ...perDay);
  const label = (index: number) => kind === 'weekly' ? DAYS_TR[index] : String(index + 1);

  const rangeLogs = logs.filter((item) => inRange(item.date));
  const bySubject = new Map<string, { solved: number; correct: number; wrong: number; blank: number }>();
  rangeLogs.forEach((log) => { const cur = bySubject.get(log.subject) ?? { solved: 0, correct: 0, wrong: 0, blank: 0 }; bySubject.set(log.subject, { solved: cur.solved + log.solved, correct: cur.correct + log.correct, wrong: cur.wrong + log.wrong, blank: cur.blank + (log.blank ?? 0) }); });
  const totals = [...bySubject.values()].reduce((a, b) => ({ solved: a.solved + b.solved, correct: a.correct + b.correct, wrong: a.wrong + b.wrong, blank: a.blank + b.blank }), { solved: 0, correct: 0, wrong: 0, blank: 0 });
  const studied = studiedTopicStats(logs, topics, { start, end });

  const rangeExams = exams.filter((item) => inRange(`${item.date}T12:00:00`)).map((exam) => ({ exam, net: exam.results.reduce((s, r) => s + r.net, 0), correct: exam.results.reduce((s, r) => s + r.correct, 0), wrong: exam.results.reduce((s, r) => s + r.wrong, 0) })).sort((a, b) => b.net - a.net);
  const examRows = rangeExams.length
    ? rangeExams.map((row, index) => `<tr><td>${index + 1}.</td><td>${esc(row.exam.title)}</td><td>${row.correct} D / ${row.wrong} Y</td><td><b>${row.net.toFixed(1)}</b> net</td></tr><tr><td></td><td colspan="3" class="muted" style="font-size:11px">${row.exam.results.filter((r) => r.correct + r.wrong > 0).map((r) => `${esc(r.subject)}: ${r.correct} D / ${r.wrong} Y / ${r.net.toFixed(1)} net`).join(' · ') || 'Ders sonucu girilmedi'}</td></tr>`).join('')
    : '<tr><td colspan="4" class="muted">Bu dönemde deneme eklenmedi.</td></tr>';
  const examTotal = rangeExams.length ? `<div class="muted" style="margin-top:6px">Toplam: ${rangeExams.reduce((s, r) => s + r.correct, 0)} doğru, ${rangeExams.reduce((s, r) => s + r.wrong, 0)} yanlış</div>` : '';
  const subjectRows = bySubject.size ? [...bySubject.entries()].map(([name, v]) => `<tr><td>${esc(name)}</td><td>${v.solved}</td><td>${v.correct}</td><td>${v.wrong}</td><td>${v.blank}</td></tr>`).join('') : '<tr><td colspan="5" class="muted">Bu dönemde soru girilmedi.</td></tr>';
  const topicRows = studied.length
    ? studied.map((t) => `<tr><td>${esc(t.subject)}</td><td>${esc(t.title)}</td><td>${t.solved || '–'}</td><td>${t.solved ? t.correct : '–'}</td><td>${t.solved ? t.wrong : '–'}</td><td>${t.solved ? t.blank : '–'}</td></tr>`).join('')
    : '<tr><td colspan="6" class="muted">Bu dönemde çalışılan konu girilmedi.</td></tr>';
  const range = kind === 'weekly'
    ? `${start.getDate()} ${MONTHS_TR[start.getMonth()]} – ${end.getDate()} ${MONTHS_TR[end.getMonth()]} ${end.getFullYear()}`
    : `${MONTHS_TR[end.getMonth()]} ${end.getFullYear()}`;
  const bars = perDay.map((value, index) => `<div class="col"><div class="bar" style="height:${Math.round((value / maxDay) * 90) + 2}px"></div>${kind === 'weekly' ? `<div class="v">${value}</div>` : ''}<div class="d">${label(index)}</div></div>`).join('');

  return `<!doctype html><html><head><meta charset="utf-8"><style>
body{font-family:Helvetica,Arial,sans-serif;color:#222;padding:28px}
h1{margin:0;font-size:24px;color:${primary}} h2{font-size:15px;margin:22px 0 8px;color:${primary}}
.muted{color:#888}.big{font-size:34px;font-weight:700}
.chart{display:flex;align-items:flex-end;gap:${kind === 'weekly' ? 10 : 2}px;height:130px;border-bottom:1px solid #ddd}
.col{flex:1;text-align:center}.bar{background:${primary};border-radius:4px 4px 0 0}.v{font-size:11px}.d{font-size:${kind === 'weekly' ? 11 : 7}px;color:#888;padding-top:3px}
table{width:100%;border-collapse:collapse;font-size:13px}td,th{padding:6px 4px;border-bottom:1px solid #eee;text-align:left}
ul{margin:0;padding-left:18px;font-size:13px;line-height:1.7}
</style></head><body>
<h1>${kind === 'weekly' ? 'Haftalık' : 'Aylık'} Özet</h1><div class="muted">${esc(studentName || 'Öğrenci')} · ${range}</div>
<h2>Çalışma süresi</h2><div class="big">${Math.floor(totalMinutes / 60)} sa ${totalMinutes % 60} dk</div>
<div class="chart">${bars}</div><div class="muted" style="font-size:11px;margin-top:4px">Günlere göre dakika</div>
<h2>Çözülen sorular</h2><div><b>${totals.solved}</b> soru · <b>${totals.correct}</b> doğru · <b>${totals.wrong}</b> yanlış · <b>${totals.blank}</b> boş</div>
<table style="margin-top:6px"><tr><th>Ders</th><th>Soru</th><th>Doğru</th><th>Yanlış</th><th>Boş</th></tr>${subjectRows}</table>
<h2>Denemeler (net sıralaması)</h2><table>${examRows}</table>${examTotal}
<h2>Çalışılan konular ve çözülen sorular (${studied.length} konu)</h2>
<table><tr><th>Ders</th><th>Konu</th><th>Soru</th><th>Doğru</th><th>Yanlış</th><th>Boş</th></tr>${topicRows}</table>
</body></html>`;
}
