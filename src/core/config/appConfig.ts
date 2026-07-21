import { Platform } from 'react-native';



// Dev-only fallback, used only when EXPO_PUBLIC_API_BASE_URL is not set.
// Matches the local backend port documented in .env.example / the setup guide.
function defaultBaseUrl(): string {
  if (Platform.OS === 'android') return 'http://10.0.2.2:8082/api';
  return 'http://localhost:8082/api';
}

export const AppConfig = {
  get apiBaseUrl(): string {
    const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
    if (envUrl && envUrl.length > 0) return envUrl;
    return defaultBaseUrl();
  },
} as const;
