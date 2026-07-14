import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../core/theme/colors';
import api from '../../../core/api/client';
import type { ChatMessage } from '../../../shared/types';

export default function ElderlyChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList<ChatMessage>>(null);

  const send = async () => {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput('');
    const userMsg: ChatMessage = { messageId: Date.now(), role: 'USER', content: text, createdAt: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setSending(true);
    try {
      const res = await api.post('/chat/message', { message: text });
      setMessages((prev) => [...prev, res.data]);
    } catch {
      setMessages((prev) => [...prev, { messageId: Date.now() + 1, role: 'AI', content: 'Sorry, AI is unavailable right now.', createdAt: new Date().toISOString() }]);
    }
    setSending(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>CareNest AI</Text>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => String(item.messageId)}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.role === 'USER' ? styles.userBubble : styles.aiBubble]}>
            <Text style={[styles.bubbleText, item.role === 'USER' ? styles.userText : styles.aiText]}>{item.content}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Ask me about your health, medications, or anything!</Text>}
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inputRow}>
          <TextInput style={styles.input} value={input} onChangeText={setInput} placeholder="Type a message..." placeholderTextColor={Colors.textHint} multiline />
          <TouchableOpacity style={[styles.sendBtn, !input.trim() && styles.sendDisabled]} onPress={send} disabled={!input.trim() || sending}>
            <Ionicons name="send" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  title: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, padding: 20, paddingBottom: 0 },
  list: { padding: 16 },
  bubble: { maxWidth: '80%', padding: 12, borderRadius: 16, marginBottom: 8 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: Colors.primary },
  aiBubble: { alignSelf: 'flex-start', backgroundColor: Colors.surface, borderWidth: 1, borderColor: '#E5E7EB' },
  bubbleText: { fontSize: 15, lineHeight: 20 },
  userText: { color: 'white' },
  aiText: { color: Colors.textPrimary },
  empty: { textAlign: 'center', color: Colors.textHint, marginTop: 40, fontSize: 14 },
  inputRow: { flexDirection: 'row', padding: 12, gap: 8, borderTopWidth: 1, borderTopColor: '#E5E7EB', backgroundColor: Colors.surface },
  input: { flex: 1, backgroundColor: Colors.background, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, maxHeight: 80 },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  sendDisabled: { opacity: 0.4 },
});
