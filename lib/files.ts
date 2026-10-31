/** Seçilen dosyayı uygulamanın kalıcı klasörüne kopyalar (önbellek temizlenince kaybolmasın). Başaramazsa özgün adresi döndürür. */
export async function keepFile(uri: string, ext: string) {
  try {
    const FS = require('expo-file-system/legacy');
    const target = `${FS.documentDirectory}${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
    await FS.copyAsync({ from: uri, to: target });
    return target as string;
  } catch {
    return uri;
  }
}
