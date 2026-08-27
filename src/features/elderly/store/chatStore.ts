import { create } from 'zustand';
import api from '../../../core/api/client';
import { getStatus, getErrorMessage, isCancelled } from '../../../core/api/errors';
import type { ChatMessage } from '../../../shared/types';
import { ChatMessageSchema, safeParseOne, safeParseList } from '../../../shared/schemas';
import { showErrorToast } from '../../../shared/components/toastStore';

interface ChatState {
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  messages: ChatMessage[];
  hasMore: boolean;
  totalMessages: number;
  aiAvailable: boolean;

  loadHistory: (params?: { refresh?: boolean }, signal?: AbortSignal) => Promise<void>;
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

function toChatMessage(m: ReturnType<typeof ChatMessageSchema.parse>): ChatMessage {
  return {
    messageId: m.messageId ?? 0,
    role: m.role ?? 'AI',
    content: m.content ?? '',
    intent: m.intent ?? undefined,
    sessionId: m.sessionId ?? undefined,
    createdAt: m.createdAt ?? new Date().toISOString(),
  };
}

export const useChatStore = create<ChatState>((set, get) => ({
  isLoading: false,
  isSending: false,
  error: null,
  messages: [],
  hasMore: true,
  totalMessages: 0,
  aiAvailable: true,

  loadHistory: async ({ refresh = false } = {}, signal) => {
    if (refresh) {
      currentPage = 0;
      set({ isLoading: true, error: null, messages: [] });
    } else {
      set({ isLoading: true, error: null });
    }

    try {
      const resp = await api.get('/chat/history', {
        params: { page: currentPage, size: PAGE_SIZE },
        signal,
      });

      const data = (resp.data ?? {}) as Record<string, unknown>;
      const messages = safeParseList(ChatMessageSchema, data.messages, 'ChatHistory').map(
        toChatMessage,
      );

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
      if (isCancelled(e)) return;
      if (getStatus(e) === 404) {
        set({ isLoading: false, aiAvailable: false, messages: [] });
        return;
      }
      set({ isLoading: false, error: `Không thể tải lịch sử trò chuyện: ${getErrorMessage(e)}` });
    }
  },

  sendMessage: async (text, sessionId) => {
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

      const parsed = safeParseOne(ChatMessageSchema, resp.data, 'ChatMessage');
      const aiMsg = toChatMessage(parsed ?? {});

      set({
        isSending: false,
        messages: [...get().messages, aiMsg],
        aiAvailable: true,
      });
      return aiMsg.content;
    } catch (e) {
      // Don't drop the user's own message from view here: ChatService persists
      // it server-side before ever calling Gemini, so a client-side timeout
      // (ECONNABORTED) doesn't mean it failed to send — the request may still
      // be processing, or already succeeded, on the backend. Removing it would
      // falsely tell the user their message vanished.
      let fallback: string;
      if (getStatus(e) === 404) {
        set({ isSending: false, aiAvailable: false });
        fallback = 'Dịch vụ AI tạm thời không khả dụng.';
      } else {
        set({
          isSending: false,
          error: `Không thể gửi tin nhắn: ${getErrorMessage(e)}`,
        });
        fallback = 'Xin lỗi, hiện không thể kết nối. Vui lòng thử lại sau.';
      }

      const errorMsg: ChatMessage = {
        messageId: Date.now() + 1,
        role: 'AI',
        content: fallback,
        intent: 'ERROR',
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
      showErrorToast(`Không thể xóa lịch sử trò chuyện: ${getErrorMessage(e)}`);
    }
  },

  refresh: () => {
    get().loadHistory({ refresh: true });
  },

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

      const parsed = safeParseOne(ChatMessageSchema, data, 'ChatVoiceMessage');
      const aiMsg = toChatMessage(parsed ?? {});
      set({ isSending: false, messages: [...get().messages, aiMsg] });
      return aiMsg.content;
    } catch (e) {
      set({ isSending: false, error: `Xử lý giọng nói thất bại: ${getErrorMessage(e)}` });
      return null;
    }
  },

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
