/**
 * Okul listesi (MEB kurum listelerinden; il → ilçe → okul adları).
 * Seviyeler: o = ortaokul, l = lise, i = ilkokul. Dosya büyük olduğu için yalnızca seçici açılınca yüklenir.
 */
export type SchoolLevel = 'ortaokul' | 'lise' | 'hepsi';
type Data = Record<string, Record<string, { o?: string[]; l?: string[]; i?: string[] }>>;

let cache: Data | null = null;
const data = (): Data => {
  if (!cache) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cache = require('./schools.json') as Data;
  }
  return cache;
};

export const districtsOf = (city: string): string[] => Object.keys(data()[city] ?? {});

export function schoolsOf(city: string, district: string, level: SchoolLevel): string[] {
  const d = data()[city]?.[district];
  if (!d) return [];
  const list = level === 'ortaokul' ? d.o ?? [] : level === 'lise' ? d.l ?? [] : [...(d.o ?? []), ...(d.l ?? []), ...(d.i ?? [])];
  return level === 'hepsi' ? [...list].sort((a, b) => a.localeCompare(b, 'tr')) : list;
}
