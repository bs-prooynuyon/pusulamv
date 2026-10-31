/**
 * Reklamlar şimdilik KAPALI. Bu dosya hiçbir reklam paketini çağırmaz; diğer ekranlardaki
 * çağrılar (prepareAds, showInterstitialIfDue) boş çalışır, kullanıcıya hiçbir şey göstermez.
 * Reklamı geri açmak için reklam-yedek/ads.ts.txt dosyasının içeriğini buraya koy,
 * app.json'a react-native-google-mobile-ads eklentisini ve AD_ID iznini geri ekle,
 * iş akışına paketi geri ekle, gizlilik metnine Reklamlar bölümünü geri koy.
 */
export function adsAvailable(): boolean { return false; }
export function startAds(): Promise<boolean> { return Promise.resolve(false); }
export async function prepareAds() { /* reklam kapalı */ }
export function showInterstitialIfDue() { /* reklam kapalı */ }
