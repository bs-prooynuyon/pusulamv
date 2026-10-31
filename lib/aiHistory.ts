import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatMessage } from '@/types/planim';

/**
 * Yapay zeka sohbet geçmişi yalnızca bu telefonda saklanır (sunucuya gönderilmez).
 * Öğrenci ve öğretmen aynı telefonu kullansa bile geçmişleri ayrı tutulur.
 */
export interface AiChat { id: string; title: string; updatedAt: string; messages: ChatMessage[] }

const KEY = (role: string) => `planim-ai-chats-${role === 'teacher' ? 'teacher' : 'student'}`;
const MAX_CHATS = 30;
const MAX_MESSAGES = 60;

export const newChatId = () => `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const titleOf = (messages: ChatMessage[]) => { const t = (messages.find((m) => m.role === 'user')?.text ?? 'Yeni sohbet').replace(/\s+/g, ' ').trim(); return t.length > 48 ? `${t.slice(0, 48)}…` : t; };

export async function listChats(role: string): Promise<AiChat[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY(role));
    const list = raw ? (JSON.parse(raw) as AiChat[]) : [];
    return Array.isArray(list) ? list.filter((c) => c && c.id && Array.isArray(c.messages)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)) : [];
  } catch { return []; }
}

/** Sohbeti kaydeder (varsa günceller). En eski sohbetler sınırı aşınca silinir. Güncel listeyi döndürür. */
export async function saveChat(role: string, id: string, messages: ChatMessage[]): Promise<AiChat[]> {
  const list = (await listChats(role)).filter((c) => c.id !== id);
  const kept = messages.slice(-MAX_MESSAGES);
  const next = [{ id, title: titleOf(kept.length ? kept : messages), updatedAt: new Date().toISOString(), messages: kept }, ...list].slice(0, MAX_CHATS);
  try { await AsyncStorage.setItem(KEY(role), JSON.stringify(next)); } catch { /* depolama dolu ya da erişilemiyor; sohbet yine de ekranda kalır */ }
  return next;
}

export async function deleteChat(role: string, id: string): Promise<AiChat[]> {
  const next = (await listChats(role)).filter((c) => c.id !== id);
  try { await AsyncStorage.setItem(KEY(role), JSON.stringify(next)); } catch { /* yoksay */ }
  return next;
}

export async function clearAllChats(): Promise<void> {
  try { await AsyncStorage.multiRemove([KEY('student'), KEY('teacher')]); } catch { /* yoksay */ }
}
