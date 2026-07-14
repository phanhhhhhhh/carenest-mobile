import { create } from 'zustand';
import api from '../../../core/api/client';
import { getStatus, getErrorMessage } from '../../../core/api/errors';
import type { ChatMessage } from '../../../shared/types';

/**
 * Port of Flutter's chat_provider.dart (ChatNotifier).
 *
 * The Flutter provider talks directly to the backend's /chat REST endpoints
 * (history, message, voice) — it does NOT use the on-device Gemini SDK, so
 * this port does the same (it does not use core/services/geminiService.ts,
 * which corresponds to a different Flutter service).
 *
 * Note: the Flutter notifier called `loadHistory()` automatically from its
 * constructor. Callers here should invoke `loadHistory()` from a screen's
 * mount effect instead.
 */

// ── Types ────────────────────────────────────────────────────────
interface ChatState {
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  messages: ChatMessage[];
  hasMore: boolean;
  totalMessages: number;
  aiAvailable: boolean;

  loadHistory: (params?: { refresh?: boolean }) => Promise<void>;
  sendMessage: (text: string, sessionId?: string) => Promise<string>;
  clearHistory: () => Promise<void>;
  refresh: () => void;
  sendVoice: (params: {
    uri: string;
    mimeType: string;
    sessionId?: string;
    language?: string;
  }) => Promise<string | null>;
  checkVoiceHealth: () => Promise<boolean>;
}

const PAGE_SIZE = 50;
let currentPage = 0;

// ── Helpers ──────────────────────────────────────────────────────
function parseMessage(j: Record<string, unknown>): ChatMessage {
  return {
    messageId: Number(j.messageId ?? 0),
    role: ((j.role as string) ?? 'AI') as ChatMessage['role'],
    content: (j.content as string) ?? '',
    intent: (j.intent as string) ?? undefined,
    sessionId: (j.sessionId as string) ?? undefined,
    createdAt: (j.createdAt as string) ?? new Date().toISOString(),
  };
}

// ── Store ────────────────────────────────────────────────────────
export const useChatStore = create<ChatState>((set, get) => ({
  isLoading: false,
  isSending: false,
  error: null,
  messages: [],
  hasMore: true,
  totalMessages: 0,
  aiAvailable: true,

  loadHistory: async ({ refresh = false } = {}) => {
    if (refresh) {
      currentPage = 0;
      set({ isLoading: true, error: null, messages: [] });
    } else {
      set({ isLoading: true, error: null });
    }

    try {
      const resp = await api.get('/chat/history', {
        params: { page: currentPage, size: PAGE_SIZE },
      });

      const data = (resp.data ?? {}) as Record<string, unknown>;
      const rawMessages = Array.isArray(data.messages) ? (data.messages as unknown[]) : [];
      const messages = rawMessages.map((e) => parseMessage(e as Record<string, unknown>));

      // Messages come newest-first from backend; reverse for display
      const reversed = [...messages].reverse();
      const displayMessages = refresh ? reversed : [...get().messages, ...reversed];

      set({
        isLoading: false,
        messages: displayMessages,
        hasMore: (data.hasMore as boolean) ?? false,
        totalMessages: Number(data.totalMessages ?? 0),
        aiAvailable: true,
      });
    } catch (e) {
      if (getStatus(e) === 404) {
        // Backend might not have ChatController yet — offline mode
        set({ isLoading: false, aiAvailable: false, messages: [] });
        return;
      }
      set({ isLoading: false, error: `Could not load chat history: ${getErrorMessage(e)}` });
    }
  },

  sendMessage: async (text, sessionId) => {
    // Add user message optimistically
    const userMsg: ChatMessage = {
      messageId: Date.now(),
      role: 'USER',
      content: text,
      createdAt: new Date().toISOString(),
    };

    set({ isSending: true, messages: [...get().messages, userMsg] });

    try {
      const resp = await api.post('/chat/message', {
        message: text,
        ...(sessionId ? { sessionId } : {}),
      });

      const aiData = (resp.data ?? {}) as Record<string, unknown>;
      const aiMsg = parseMessage(aiData);

      set({
        isSending: false,
        messages: [...get().messages, aiMsg],
        aiAvailable: true,
      });
      return aiMsg.content;
    } catch (e) {
      // Remove optimistic user message on failure
      const msgs = get().messages.slice(0, -1);

      let fallback: string;
      if (getStatus(e) === 404) {
        set({ isSending: false, messages: msgs, aiAvailable: false });
        fallback = 'AI service is temporarily unavailable.';
      } else {
        set({
          isSending: false,
          messages: msgs,
          error: `Could not send message: ${getErrorMessage(e)}`,
        });
        fallback = 'Sorry, I cannot connect right now. Please try again later.';
      }

      // Add error message as AI response
      const errorMsg: ChatMessage = {
        messageId: Date.now() + 1,
        role: 'AI',
        content: fallback,
        createdAt: new Date().toISOString(),
      };
      set({ messages: [...get().messages, errorMsg] });
      return fallback;
    }
  },

  clearHistory: async () => {
    try {
      await api.delete('/chat/history');
      set({ messages: [], totalMessages: 0, hasMore: false });
    } catch (e) {
      console.warn('[chatStore.clearHistory]', e);
    }
  },

  refresh: () => {
    get().loadHistory({ refresh: true });
  },

  // POST /api/chat/voice — send audio for server-side STT + AI chat.
  // Returns the AI response content on success, null on failure.
  sendVoice: async ({ uri, mimeType, sessionId, language = 'vi' }) => {
    set({ isSending: true });
    try {
      const formData = new FormData();
      const ext = mimeType.split('/').pop() || 'm4a';
      formData.append('audio', {
        uri,
        name: `recording.${ext}`,
        type: mimeType,
      } as unknown as Blob);
      if (sessionId) formData.append('sessionId', sessionId);
      formData.append('language', language);

      const resp = await api.post('/chat/voice', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const data = (resp.data ?? {}) as Record<string, unknown>;

      // Add transcription as user message
      const transcription = (data.transcription as string) ?? '';
      if (transcription.length > 0) {
        const userMsg: ChatMessage = {
          messageId: Date.now(),
          role: 'USER',
          content: `🎤 ${transcription}`,
          createdAt: new Date().toISOString(),
        };
        set({ messages: [...get().messages, userMsg] });
      }

      // Add AI response
      const aiMsg = parseMessage(data);
      set({ isSending: false, messages: [...get().messages, aiMsg] });
      return aiMsg.content;
    } catch (e) {
      set({ isSending: false, error: `Voice processing failed: ${getErrorMessage(e)}` });
      return null;
    }
  },

  // GET /api/chat/voice/health — check STT availability.
  checkVoiceHealth: async () => {
    try {
      const resp = await api.get('/chat/voice/health');
      const data = (resp.data ?? {}) as Record<string, unknown>;
      return data.sttAvailable === true;
    } catch (e) {
      console.warn('[chatStore.checkVoiceHealth]', e);
      return false;
    }
  },
}));
