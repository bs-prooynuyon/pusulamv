import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { LEGAL_LINKS } from '@/constants/legal';

/** Drive bağlantısı varsa onu tarayıcıda açar; yoksa uygulamanın içindeki metne gider. */
export async function openLegal(kind: 'privacy' | 'terms') {
  const url = LEGAL_LINKS[kind];
  if (url) { try { await WebBrowser.openBrowserAsync(url); return; } catch { /* yedek: uygulama içi metin */ } }
  router.push((kind === 'privacy' ? '/privacy' : '/terms') as never);
}
