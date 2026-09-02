import React, { useRef, useState } from 'react';
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
import { useMountEffect } from '../../../shared/hooks/useMountEffect';

export default function ElderlyChatScreen() {
  const navigation = useNavigation();
  const messages = useChatStore((s) => s.messages);
  const isLoading = useChatStore((s) => s.isLoading);
  const isSending = useChatStore((s) => s.isSending);
  const aiAvailable = useChatStore((s) => s.aiAvailable);
  const loadHistory = useChatStore((s) => s.loadHistory);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const clearHistory = useChatStore((s) => s.clearHistory);

  const [userName, setUserName] = useState('Bác');
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  useMountEffect(() => {
    const controller = new AbortController();
    loadHistory({ refresh: true }, controller.signal);
    (async () => {
      const name = await getName();
      if (name) setUserName(name);
    })();
    return () => controller.abort();
  });

  const welcomeMessage =
    `${greeting()} ${userName}! Cháu là trợ lý chăm sóc sức khỏe CareNest. ` +
    'Hôm nay Bác cảm thấy trong người thế nào ạ? Cháu có thể giúp Bác:\n' +
    '• Tra cứu & giải thích chỉ số sức khỏe\n' +
    '• Nhắc nhở uống thuốc đúng giờ\n' +
    '• Trò chuyện, tâm sự và tư vấn lối sống';

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
    Alert.alert('Nhập bằng giọng nói', 'Tính năng giọng nói đang được chuẩn bị.');
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
      {/* Top Header */}
      <View style={styles.appBar}>
        <View style={styles.appBarLeft}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={26} color={Colors.primary} />
          </TouchableOpacity>
          <View style={styles.avatarWrap}>
            <View style={styles.avatarCircle}>
              <Ionicons name="sparkles" size={22} color="#FFFFFF" />
            </View>
            <View
              style={[styles.statusDot, { backgroundColor: aiAvailable ? '#10B981' : '#F59E0B' }]}
            />
          </View>
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.appBarTitle}>CareNest AI</Text>
            <Text style={[styles.appBarSubtitle, { color: aiAvailable ? '#059669' : '#D97706' }]}>
              {aiAvailable ? 'Trực tuyến — Sẵn sàng hỗ trợ' : 'Chế độ ngoại tuyến'}
            </Text>
          </View>
        </View>
        {messages.length > 0 && (
          <TouchableOpacity
            onPress={confirmClearHistory}
            style={styles.clearBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={22} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
          <ProactiveReminderCard />
        </View>

        {isLoading && messages.length === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.primary} size="large" />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages.length === 0 ? [] : messages}
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

        {/* Quick Replies Chips */}
        <View style={styles.quickRepliesContainer}>
          <FlatList
            horizontal
            data={QUICK_REPLIES}
            keyExtractor={(r) => r}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickRepliesRow}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.quickReplyChip}
                onPress={() => handleSend(item)}
                activeOpacity={0.8}
              >
                <Text style={styles.quickReplyText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TouchableOpacity
            style={[styles.micBtn, isListening && styles.micBtnListening]}
            onPress={toggleListening}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isListening ? 'mic' : 'mic-outline'}
              size={24}
              color={isListening ? '#EF4444' : '#64748B'}
            />
          </TouchableOpacity>

          <TextInput
            style={styles.textInput}
            value={input}
            onChangeText={setInput}
            placeholder="Bác hãy nhập tin nhắn vào đây..."
            placeholderTextColor="#94A3B8"
            editable={!isSending}
            onSubmitEditing={() => handleSend()}
            returnKeyType="send"
          />

          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || isSending) && styles.sendBtnDisabled]}
            onPress={() => handleSend()}
            disabled={!input.trim() || isSending}
            activeOpacity={0.85}
          >
            <Ionicons name="send" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  appBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  appBarLeft: { flexDirection: 'row', alignItems: 'center' },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E6F7F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarWrap: { width: 44, height: 44 },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  appBarTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', letterSpacing: -0.3 },
  appBarSubtitle: { fontSize: 12.5, marginTop: 1, fontWeight: '600' },
  clearBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 18, flexGrow: 1 },

  quickRepliesContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
  },
  quickRepliesRow: { paddingHorizontal: 16, gap: 8 },
  quickReplyChip: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  quickReplyText: { fontSize: 13.5, color: '#4338CA', fontWeight: '700' },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 10,
  },
  micBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtnListening: { backgroundColor: '#FEE2E2' },
  textInput: {
    flex: 1,
    height: 48,
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    paddingHorizontal: 18,
    fontSize: 15.5,
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  sendBtnDisabled: { opacity: 0.5, backgroundColor: '#94A3B8' },
});
