import { Platform } from 'react-native';

/**
 * App configuration — port of Flutter's app_config.dart + dio_client base URL logic.
 *
 * Env vars MUST be prefixed with EXPO_PUBLIC_ to be inlined by Expo at build time.
 * See .env.example.
 */

function defaultBaseUrl(): string {
  // Android emulator reaches host machine via 10.0.2.2; web/iOS simulator via localhost
  if (Platform.OS === 'android') return 'http://10.0.2.2:8082/api';
  return 'http://localhost:8082/api';
}

export const AppConfig = {
  get apiBaseUrl(): string {
    const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
    if (envUrl && envUrl.length > 0) return envUrl;
    return defaultBaseUrl();
  },

  get geminiApiKey(): string {
    return process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';
  },

  geminiSystemPrompt:
    'You are CareNest AI, a smart health assistant for elderly people. ' +
    'Mission: support health monitoring, medication reminders, answer health questions. ' +
    'Always respond concisely, friendly, and easy to understand for elderly users. ' +
    'Do not diagnose diseases or prescribe medication — when needed, advise seeing a doctor.',
} as const;
