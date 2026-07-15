import { Platform } from 'react-native';



function defaultBaseUrl(): string {
  if (Platform.OS === 'android') return 'https://10.0.2.2:8443/api';
  return 'https://localhost:8443/api';
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
