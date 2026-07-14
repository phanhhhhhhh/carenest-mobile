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
  Alert,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../core/theme/colors';
import { useChatStore } from '../store/chatStore';
import { getName } from '../../../core/storage/secureStorage';
import ProactiveReminderCard from '../components/ProactiveReminderCard';
import type { ChatMessage } from '../../../shared/types';

/**
 * Port of Flutter's elderly_chat_screen.dart.
 *
 * Deviation: Flutter used package:speech_to_text for on-device voice input.
 * There is no speech-to-text dependency available here (no new npm deps
 * allowed), so the mic button is kept for visual/UX parity but always
 * behaves as "voice input is not available" — matching the Flutter
 * behavior when `_speechAvailable` is false.
 */

const QUICK_REPLIES = ['Blood pressure today?', 'Medication schedule?', 'I have a headache'];

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

export default function ElderlyChatScreen() {
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
    loadHistory({ refresh: true });
    (async () => {
      const name = await getName();
      if (name) setUserName(name);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const welcomeMessage =
    `${greeting()} ${userName}! I am your health care assistant. ` +
    'How are you feeling today? I can help you:\n' +
    '• Check health indicators\n' +
    '• Medication reminders\n' +
    '• Chat with you';

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
    Alert.alert('', 'Voice input is not available');
  };

  const confirmClearHistory = () => {
    Alert.alert(
      'Clear chat history?',
      'This will delete all messages in this conversation.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => clearHistory(),
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* App bar */}
      <View style={styles.appBar}>
        <View style={styles.appBarLeft}>
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
              {aiAvailable ? 'Online — AI-powered' : 'Offline mode'}
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
            keyExtractor={(item) => String(item.messageId)}
            contentContainerStyle={styles.list}
            onContentSizeChange={scrollToBottom}
            ListHeaderComponent={messages.length === 0 ? <WelcomeBubble message={welcomeMessage} /> : null}
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

        {/* Quick replies */}
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

        {/* Input bar */}
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
            placeholder="Type a message..."
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

function WelcomeBubble({ message }: { message: string }) {
  return (
    <View style={styles.bubbleRow}>
      <View style={styles.aiAvatarSmall}>
        <Ionicons name="sparkles" size={20} color={Colors.primary} />
      </View>
      <View style={{ width: 8 }} />
      <View style={styles.aiBubble}>
        <Text style={styles.aiBubbleText}>{message}</Text>
      </View>
    </View>
  );
}

function TypingIndicator() {
  return (
    <View style={styles.bubbleRow}>
      <View style={styles.aiAvatarTiny}>
        <Ionicons name="sparkles" size={16} color={Colors.primary} />
      </View>
      <View style={{ width: 8 }} />
      <View style={styles.typingBubble}>
        <Dot delay={0} />
        <View style={{ width: 4 }} />
        <Dot delay={200} />
        <View style={{ width: 4 }} />
        <Dot delay={400} />
      </View>
    </View>
  );
}

function Dot({ delay }: { delay: number }) {
  const anim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    let loop: Animated.CompositeAnimation | undefined;
    const timeout = setTimeout(() => {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: 300,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.4,
            duration: 300,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
    }, delay);
    return () => {
      clearTimeout(timeout);
      loop?.stop();
    };
  }, [anim, delay]);

  return <Animated.View style={[styles.dot, { opacity: anim }]} />;
}

function ChatBubble({
  text,
  isAi,
  time,
  intent,
}: {
  text: string;
  isAi: boolean;
  time: string;
  intent?: string;
}) {
  return (
    <View style={[styles.bubbleRow, !isAi && styles.bubbleRowUser]}>
      {isAi && (
        <>
          <View style={styles.aiAvatarTiny}>
            <Ionicons name="sparkles" size={16} color={Colors.primary} />
          </View>
          <View style={{ width: 8 }} />
        </>
      )}
      <View style={{ flexShrink: 1, alignItems: isAi ? 'flex-start' : 'flex-end' }}>
        {!!intent && (
          <View style={styles.intentBadge}>
            <Text style={styles.intentText}>{intent}</Text>
          </View>
        )}
        <View
          style={[
            styles.messageBubble,
            isAi ? styles.aiMessageBubble : styles.userMessageBubble,
          ]}
        >
          <Text style={isAi ? styles.aiBubbleText : styles.userBubbleText}>{text}</Text>
        </View>
        <Text style={styles.timeText}>{time}</Text>
      </View>
    </View>
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

  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12 },
  bubbleRowUser: { justifyContent: 'flex-end' },
  aiAvatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(46, 125, 154, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiAvatarTiny: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(46, 125, 154, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBubble: {
    flexShrink: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    backgroundColor: Colors.surface,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  aiBubbleText: { color: Colors.textPrimary, fontSize: 14, lineHeight: 22 },

  messageBubble: {
    maxWidth: 280,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  aiMessageBubble: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 4,
  },
  userMessageBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  userBubbleText: { color: '#FFFFFF', fontSize: 14, lineHeight: 20 },
  timeText: { color: Colors.textHint, fontSize: 11, marginTop: 3 },

  intentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(46, 125, 154, 0.08)',
    marginBottom: 4,
  },
  intentText: { color: Colors.primary, fontSize: 10, fontWeight: '600' },

  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    backgroundColor: Colors.surface,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.textHint },

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
