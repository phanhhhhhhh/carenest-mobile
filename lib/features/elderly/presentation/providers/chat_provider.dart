import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../../auth/presentation/providers/auth_provider.dart';

class ChatMessage {
  final int messageId;
  final String role; // "USER" or "AI"
  final String content;
  final String? intent;
  final String? sessionId;
  final DateTime createdAt;

  const ChatMessage({
    required this.messageId,
    required this.role,
    required this.content,
    this.intent,
    this.sessionId,
    required this.createdAt,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> j) => ChatMessage(
        messageId: (j['messageId'] as num).toInt(),
        role: j['role'] as String? ?? 'AI',
        content: j['content'] as String? ?? '',
        intent: j['intent'] as String?,
        sessionId: j['sessionId'] as String?,
        createdAt: DateTime.tryParse(j['createdAt'] as String? ?? '') ??
            DateTime.now(),
      );

  bool get isUser => role == 'USER';
  bool get isAi => role == 'AI';
}

class ChatState {
  final bool isLoading;
  final bool isSending;
  final String? error;
  final List<ChatMessage> messages;
  final bool hasMore;
  final int totalMessages;
  final bool aiAvailable;

  const ChatState({
    this.isLoading = false,
    this.isSending = false,
    this.error,
    this.messages = const [],
    this.hasMore = true,
    this.totalMessages = 0,
    this.aiAvailable = true,
  });

  ChatState copyWith({
    bool? isLoading,
    bool? isSending,
    String? error,
    List<ChatMessage>? messages,
    bool? hasMore,
    int? totalMessages,
    bool? aiAvailable,
  }) =>
      ChatState(
        isLoading: isLoading ?? this.isLoading,
        isSending: isSending ?? this.isSending,
        error: error,
        messages: messages ?? this.messages,
        hasMore: hasMore ?? this.hasMore,
        totalMessages: totalMessages ?? this.totalMessages,
        aiAvailable: aiAvailable ?? this.aiAvailable,
      );
}

class ChatNotifier extends StateNotifier<ChatState> {
  final Dio _dio;
  int _currentPage = 0;
  static const _pageSize = 50;

  ChatNotifier(this._dio) : super(const ChatState()) {
    loadHistory();
  }

  Future<void> loadHistory({bool refresh = false}) async {
    if (refresh) {
      _currentPage = 0;
      state = state.copyWith(isLoading: true, error: null, messages: []);
    } else {
      state = state.copyWith(isLoading: true, error: null);
    }

    try {
      final resp = await _dio.get('/chat/history', queryParameters: {
        'page': _currentPage,
        'size': _pageSize,
      });

      final data = resp.data as Map<String, dynamic>;
      final rawMessages = data['messages'] as List<dynamic>? ?? [];
      final messages = rawMessages
          .map((e) => ChatMessage.fromJson(e as Map<String, dynamic>))
          .toList();

      // Messages come newest-first from backend; reverse for display
      final displayMessages = refresh
          ? messages.reversed.toList()
          : [...state.messages, ...messages.reversed];

      state = state.copyWith(
        isLoading: false,
        messages: displayMessages,
        hasMore: data['hasMore'] as bool? ?? false,
        totalMessages: (data['totalMessages'] as num?)?.toInt() ?? 0,
        aiAvailable: true,
      );
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) {
        // Backend might not have ChatController yet — offline mode
        state = state.copyWith(
            isLoading: false, aiAvailable: false, messages: []);
        return;
      }
      state = state.copyWith(
        isLoading: false,
        error: 'Could not load chat history: ${e.message}',
      );
    }
  }

  Future<String> sendMessage(String text, {String? sessionId}) async {
    // Add user message optimistically
    final userMsg = ChatMessage(
      messageId: DateTime.now().millisecondsSinceEpoch,
      role: 'USER',
      content: text,
      createdAt: DateTime.now(),
    );

    state = state.copyWith(
      isSending: true,
      messages: [...state.messages, userMsg],
    );

    try {
      final resp = await _dio.post('/chat/message', data: {
        'message': text,
        if (sessionId != null) 'sessionId': sessionId,
      });

      final aiData = resp.data as Map<String, dynamic>;
      final aiMsg = ChatMessage.fromJson(aiData);

      state = state.copyWith(
        isSending: false,
        messages: [...state.messages, aiMsg],
        aiAvailable: true,
      );
      return aiMsg.content;
    } on DioException catch (e) {
      // Remove optimistic user message on failure
      final msgs = List<ChatMessage>.from(state.messages);
      msgs.removeLast();

      String fallback;
      if (e.response?.statusCode == 404) {
        state = state.copyWith(
            isSending: false, messages: msgs, aiAvailable: false);
        fallback = 'AI service is temporarily unavailable.';
      } else {
        state = state.copyWith(
          isSending: false,
          messages: msgs,
          error: 'Could not send message: ${e.message}',
        );
        fallback =
            'Sorry, I cannot connect right now. Please try again later.';
      }

      // Add error message as AI response
      final errorMsg = ChatMessage(
        messageId: DateTime.now().millisecondsSinceEpoch + 1,
        role: 'AI',
        content: fallback,
        createdAt: DateTime.now(),
      );
      state = state.copyWith(messages: [...state.messages, errorMsg]);
      return fallback;
    }
  }

  Future<void> clearHistory() async {
    try {
      await _dio.delete('/chat/history');
      state = state.copyWith(messages: [], totalMessages: 0, hasMore: false);
    } on DioException {
      // Silently fail
    }
  }

  void refresh() => loadHistory(refresh: true);
}

final chatProvider =
    StateNotifierProvider.autoDispose<ChatNotifier, ChatState>(
  (ref) => ChatNotifier(ref.watch(dioProvider)),
);
