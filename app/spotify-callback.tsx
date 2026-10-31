import { Redirect } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

// Spotify redirects here after login; just send the student back home.
export default function SpotifyCallback() {
  return <Redirect href="/" />;
}
