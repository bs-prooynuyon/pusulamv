import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import { Linking } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

const discovery: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: 'https://accounts.spotify.com/authorize',
  tokenEndpoint: 'https://accounts.spotify.com/api/token',
};

export const SPOTIFY_SCOPES = [
  'user-read-private',
  'user-read-playback-state',
  'user-modify-playback-state',
  'playlist-read-private',
  'playlist-read-collaborative',
];

const TOKEN_KEY = 'planim-spotify-token';

interface StoredToken {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  clientId: string;
}

export class SpotifyError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const getRedirectUri = () => AuthSession.makeRedirectUri({ scheme: 'planim', path: 'spotify-callback' });

async function loadToken(): Promise<StoredToken | null> {
  try {
    const raw = await SecureStore.getItemAsync(TOKEN_KEY);
    return raw ? (JSON.parse(raw) as StoredToken) : null;
  } catch {
    return null;
  }
}

async function saveToken(token: StoredToken) {
  await SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify(token));
}

export async function hasSpotifyToken() {
  return !!(await loadToken());
}

export async function spotifyLogout() {
  try { await SecureStore.deleteItemAsync(TOKEN_KEY); } catch { /* ignore */ }
}

export async function spotifyLogin(clientId: string) {
  const redirectUri = getRedirectUri();
  const request = new AuthSession.AuthRequest({
    clientId,
    scopes: SPOTIFY_SCOPES,
    redirectUri,
    usePKCE: true,
    responseType: AuthSession.ResponseType.Code,
  });
  const result = await request.promptAsync(discovery);
  if (result.type !== 'success') {
    throw new SpotifyError(0, result.type === 'error' ? (result.error?.message ?? 'Spotify girişi başarısız oldu.') : 'Spotify girişi iptal edildi.');
  }
  const response = await AuthSession.exchangeCodeAsync(
    { clientId, code: result.params.code, redirectUri, extraParams: { code_verifier: request.codeVerifier ?? '' } },
    discovery,
  );
  await saveToken({
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    expiresAt: Date.now() + (response.expiresIn ?? 3600) * 1000,
    clientId,
  });
}

async function getAccessToken(): Promise<string> {
  const token = await loadToken();
  if (!token) throw new SpotifyError(401, 'Spotify hesabı bağlı değil.');
  if (token.expiresAt - 60000 > Date.now()) return token.accessToken;
  if (!token.refreshToken) throw new SpotifyError(401, 'Spotify oturumu bitti, tekrar bağlan.');
  try {
    const refreshed = await AuthSession.refreshAsync({ clientId: token.clientId, refreshToken: token.refreshToken }, discovery);
    const next: StoredToken = {
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken ?? token.refreshToken,
      expiresAt: Date.now() + (refreshed.expiresIn ?? 3600) * 1000,
      clientId: token.clientId,
    };
    await saveToken(next);
    return next.accessToken;
  } catch {
    throw new SpotifyError(401, 'Spotify oturumu bitti, tekrar bağlan.');
  }
}

async function api<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const accessToken = await getAccessToken();
  const response = await fetch(`https://api.spotify.com/v1${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  const text = await response.text();
  if (!response.ok) {
    let reason = '';
    try { reason = JSON.parse(text)?.error?.reason ?? JSON.parse(text)?.error?.message ?? ''; } catch { /* ignore */ }
    throw new SpotifyError(response.status, reason || `Spotify hatası (${response.status})`);
  }
  return (text ? JSON.parse(text) : undefined) as T;
}

export interface SpotifyItem {
  uri: string;
  name: string;
  subtitle: string;
  image?: string;
  kind: 'playlist' | 'track';
}

export async function fetchProfile() {
  return api<{ id: string; display_name?: string; product?: string }>('/me');
}

export async function fetchPlaylists(): Promise<SpotifyItem[]> {
  const data = await api<{ items: Array<{ uri: string; name: string; owner?: { display_name?: string }; images?: Array<{ url: string }> } | null> }>('/me/playlists?limit=50');
  return data.items.filter(Boolean).map((item) => ({
    uri: item!.uri,
    name: item!.name,
    subtitle: item!.owner?.display_name ?? 'Playlist',
    image: item!.images?.[item!.images.length - 1]?.url,
    kind: 'playlist' as const,
  }));
}

export async function searchTracks(query: string): Promise<SpotifyItem[]> {
  const data = await api<{ tracks: { items: Array<{ uri: string; name: string; artists: Array<{ name: string }>; album?: { images?: Array<{ url: string }> } }> } }>(
    `/search?type=track&limit=15&q=${encodeURIComponent(query)}`,
  );
  return data.tracks.items.map((item) => ({
    uri: item.uri,
    name: item.name,
    subtitle: item.artists.map((artist) => artist.name).join(', '),
    image: item.album?.images?.[item.album.images.length - 1]?.url,
    kind: 'track' as const,
  }));
}

/** Turns an open.spotify.com link (or a spotify: URI) into a spotify: URI. */
export function parseSpotifyLink(input: string): string | null {
  const value = input.trim();
  if (/^spotify:(track|playlist|album):[A-Za-z0-9]+$/.test(value)) return value;
  const match = value.match(/open\.spotify\.com\/(?:intl-[a-z]+\/)?(track|playlist|album)\/([A-Za-z0-9]+)/);
  return match ? `spotify:${match[1]}:${match[2]}` : null;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export type PlayResult = 'played' | 'opened';

/**
 * Starts playback in the user's Spotify app. Needs Spotify Premium for direct
 * control; otherwise (or if no device is found) it just opens the item in the
 * Spotify app so the student can press play.
 */
export async function playUri(uri: string): Promise<PlayResult> {
  const body = JSON.stringify(uri.startsWith('spotify:track:') ? { uris: [uri] } : { context_uri: uri });
  const play = (deviceId?: string) => api(`/me/player/play${deviceId ? `?device_id=${deviceId}` : ''}`, { method: 'PUT', body });
  try {
    await play();
    return 'played';
  } catch (error) {
    const status = error instanceof SpotifyError ? error.status : 0;
    if (status === 404) {
      Linking.openURL('spotify:').catch(() => undefined);
      for (let attempt = 0; attempt < 3; attempt += 1) {
        await sleep(2500);
        try {
          const devices = await api<{ devices: Array<{ id: string | null; is_active: boolean }> }>('/me/player/devices');
          const device = devices.devices.find((item) => item.id);
          if (device?.id) {
            await play(device.id);
            return 'played';
          }
        } catch { /* try again */ }
      }
    }
    await Linking.openURL(uri);
    return 'opened';
  }
}

export function friendlySpotifyError(error: unknown): string {
  if (error instanceof SpotifyError) {
    if (error.status === 0) return error.message;
    if (error.status === 401) return 'Spotify oturumu bitti, ayarlardan tekrar bağla.';
    if (error.status === 403) return 'Spotify bu hesaba izin vermedi. Developer Dashboard > User Management bölümüne bu Spotify hesabının e-postasını eklemelisin.';
    return error.message;
  }
  return 'Spotify ile bağlantı kurulamadı. İnternetini kontrol et.';
}
