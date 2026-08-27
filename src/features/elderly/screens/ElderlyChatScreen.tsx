import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Alert } from '../../../shared/utils/crossPlatformAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../core/theme/colors';
import { useChatStore } from '../store/chatStore';
import { getName } from '../../../core/storage/secureStorage';
import ProactiveReminderCard from '../components/ProactiveReminderCard';
import type { ChatMessage } from '../../../shared/types';
import { QUICK_REPLIES, formatTime, greeting } from './elderlyChat/utils';
import { ChatBubble } from './elderlyChat/ChatBubble';
import { TypingIndicator } from './elderlyChat/TypingIndicator';
import { WelcomeBubble } from './elderlyChat/WelcomeBubble';

export default function ElderlyChatScreen() {
  const navigation = useNavigation();
  const messages = useChatStore((s) => s.messages);
  const isLoading = useChatStore((s) => s.isLoading);
  const isSending = useChatStore((s) => s.isSending);
  const aiAvailable = useChatStore((s) => s.aiAvailable);
  const loadHistory = useChatStore((s) => s.loadHistory);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const clearHistory = useChatStore((s) => s.clearHistory);

  const [userName, setUserName] = useState('you');
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  useEffect(() => {
    const controller = new AbortController();
    loadHistory({ refresh: true }, controller.signal);
    (async () => {
      const name = await getName();
      if (name) setUserName(name);
    })();
    return () => controller.abort();
    // Load history once on mount; `loadHistory` is a stable store action.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const welcomeMessage =
    `${greeting()} ${userName}! Tôi là trợ lý chăm sóc sức khỏe của bạn. ` +
    'Hôm nay bạn cảm thấy thế nào? Tôi có thể giúp bạn:\n' +
    '• Kiểm tra chỉ số sức khỏe\n' +
    '• Nhắc uống thuốc\n' +
    '• Trò chuyện cùng bạn';

  const scrollToBottom = () => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
  };

  const handleSend = async (text?: string) => {
    const value = (text ?? input).trim();
    if (!value || isSending) return;
    setInput('');
    await sendMessage(value);
    scrollToBottom();
  };

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }
    Alert.alert('', 'Nhập bằng giọng nói chưa khả dụng');
  };

  const confirmClearHistory = () => {
    Alert.alert(
      'Xóa lịch sử trò chuyện?',
      'Thao tác này sẽ xóa toàn bộ tin nhắn trong cuộc trò chuyện này.',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Xóa', style: 'destructive', onPress: () => clearHistory() },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.appBar}>
        <View style={styles.appBarLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.avatarWrap}>
            <View style={styles.avatarCircle}>
              <Ionicons name="sparkles" size={22} color="#FFFFFF" />
            </View>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: aiAvailable ? Colors.success : Colors.warning },
              ]}
            />
          </View>
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.appBarTitle}>CareNest AI</Text>
            <Text
              style={[
                styles.appBarSubtitle,
                { color: aiAvailable ? Colors.success : Colors.textSecondary },
              ]}
            >
              {aiAvailable ? 'Trực tuyến — Hỗ trợ bởi AI' : 'Chế độ ngoại tuyến'}
            </Text>
          </View>
        </View>
        {messages.length > 0 && (
          <TouchableOpacity onPress={confirmClearHistory} style={styles.clearBtn}>
            <Ionicons name="trash-outline" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
          <ProactiveReminderCard />
        </View>

        {isLoading && messages.length === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages.length === 0 ? [] : messages}
            // messageId can collide (schema defaults missing ids to 0, optimistic
            // messages use Date.now()) — include the index to keep keys unique.
            keyExtractor={(item, index) => `${item.messageId}-${index}`}
            contentContainerStyle={styles.list}
            onContentSizeChange={scrollToBottom}
            ListHeaderComponent={
              messages.length === 0 ? <WelcomeBubble message={welcomeMessage} /> : null
            }
            ListFooterComponent={isSending ? <TypingIndicator /> : null}
            renderItem={({ item }) => (
              <ChatBubble
                text={item.content}
                isAi={item.role === 'AI'}
                time={formatTime(item.createdAt)}
                intent={item.intent}
              />
            )}
          />
        )}

        <FlatList
          horizontal
          data={QUICK_REPLIES}
          keyExtractor={(r) => r}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickRepliesRow}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.quickReplyChip} onPress={() => handleSend(item)}>
              <Text style={styles.quickReplyText}>{item}</Text>
            </TouchableOpacity>
          )}
        />

        <View style={styles.inputBar}>
          <TouchableOpacity
            style={[styles.micBtn, isListening && styles.micBtnListening]}
            onPress={toggleListening}
          >
            <Ionicons
              name={isListening ? 'mic' : 'mic-outline'}
              size={22}
              color={isListening ? Colors.error : Colors.textSecondary}
            />
          </TouchableOpacity>
          <View style={{ width: 8 }} />
          <TextInput
            style={styles.textInput}
            value={input}
            onChangeText={setInput}
            placeholder="Nhập tin nhắn..."
            placeholderTextColor={Colors.textHint}
            editable={!isSending}
            onSubmitEditing={() => handleSend()}
            returnKeyType="send"
          />
          <View style={{ width: 8 }} />
          <TouchableOpacity
            style={[styles.sendBtn, isSending && styles.sendBtnDisabled]}
            onPress={() => handleSend()}
            disabled={isSending}
          >
            <Ionicons name="send" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  appBar: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appBarLeft: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { marginRight: 8, padding: 4 },
  avatarWrap: { width: 40, height: 40 },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  appBarTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  appBarSubtitle: { fontSize: 12, marginTop: 1 },
  clearBtn: { padding: 6 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, flexGrow: 1 },

  quickRepliesRow: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  quickReplyChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(46, 125, 154, 0.4)',
    backgroundColor: 'rgba(46, 125, 154, 0.05)',
  },
  quickReplyText: { color: Colors.primary, fontSize: 13 },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  micBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtnListening: {
    backgroundColor: 'rgba(229, 57, 53, 0.1)',
    borderWidth: 2,
    borderColor: Colors.error,
  },
  textInput: {
    flex: 1,
    height: 44,
    borderRadius: 24,
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: Colors.textHint },
});
