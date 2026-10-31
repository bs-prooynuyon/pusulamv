import Constants from 'expo-constants';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { CONFIG } from '@/config';
import { usePlanim } from '@/context/PlanimContext';
import { fetchProfile, friendlySpotifyError, hasSpotifyToken, spotifyLogin, spotifyLogout } from '@/lib/spotify';

interface SpotifyValue {
  connected: boolean;
  busy: boolean;
  error: string | null;
  /** Client ID baked into app.json (if any). When empty the student can paste one in the UI. */
  needsClientId: boolean;
  userName: string;
  connect: (clientIdOverride?: string) => Promise<boolean>;
  disconnect: () => Promise<void>;
}

const SpotifyContext = createContext<SpotifyValue | null>(null);

const configuredClientId = (CONFIG.spotifyClientId || String((Constants.expoConfig?.extra as { spotifyClientId?: string } | undefined)?.spotifyClientId ?? '')).trim();

export function SpotifyProvider({ children }: { children: React.ReactNode }) {
  const { settings, updateSettings } = usePlanim();
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    hasSpotifyToken().then(setConnected).catch(() => undefined);
  }, []);

  const connect = useCallback(async (clientIdOverride?: string) => {
    const clientId = (configuredClientId || clientIdOverride || settings.spotifyClientId || '').trim();
    if (!clientId) {
      setError('Önce Spotify Client ID gerekli.');
      return false;
    }
    setBusy(true);
    setError(null);
    try {
      await spotifyLogin(clientId);
      const profile = await fetchProfile();
      updateSettings({ spotifyClientId: configuredClientId ? settings.spotifyClientId : clientId, spotifyUser: profile.display_name || profile.id });
      setConnected(true);
      return true;
    } catch (cause) {
      await spotifyLogout();
      setConnected(false);
      setError(friendlySpotifyError(cause));
      return false;
    } finally {
      setBusy(false);
    }
  }, [settings.spotifyClientId, updateSettings]);

  const disconnect = useCallback(async () => {
    await spotifyLogout();
    setConnected(false);
    updateSettings({ spotifyUser: '' });
  }, [updateSettings]);

  const value = useMemo<SpotifyValue>(() => ({
    connected,
    busy,
    error,
    needsClientId: !configuredClientId,
    userName: settings.spotifyUser,
    connect,
    disconnect,
  }), [connected, busy, error, settings.spotifyUser, connect, disconnect]);

  return <SpotifyContext.Provider value={value}>{children}</SpotifyContext.Provider>;
}

export function useSpotify() {
  const context = useContext(SpotifyContext);
  if (!context) throw new Error('useSpotify must be used inside SpotifyProvider');
  return context;
}
