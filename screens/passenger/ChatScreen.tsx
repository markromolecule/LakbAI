import React, { useState } from 'react';
import { View, ScrollView, Text, StyleSheet } from 'react-native';
import { ChatMessage } from '../../components/chat/ChatMessage';
import { QuickQuestions } from '../../components/chat/QuickQuestions';
import { ChatInput } from '../../components/chat/ChatInput';
import { useChat } from '../../hooks/useChat';
import { QUICK_QUESTIONS } from '../../constants/quickQuestions';
import { COLORS, SPACING } from '../../shared/styles';

export const ChatScreen: React.FC = () => {
  const { messages, sendMessage } = useChat();
  const [inputText, setInputText] = useState('');

  const handleSend = () => {
    if (inputText.trim()) {
      sendMessage(inputText);
      setInputText('');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.chatHeader}>
        <Text style={styles.chatHeaderTitle}>LakbAI Assistant</Text>
        <Text style={styles.chatHeaderSubtitle}>Ask me about fares, routes, and schedules</Text>
      </View>

      <ScrollView style={styles.messagesContainer}>
        {messages.map((message, index) => (
          <ChatMessage key={index} message={message} />
        ))}
      </ScrollView>

      <View style={styles.inputContainer}>
        <QuickQuestions
          questions={QUICK_QUESTIONS}
          onQuestionPress={sendMessage}
        />
        
        <ChatInput
          value={inputText}
          onChangeText={setInputText}
          onSend={handleSend}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  chatHeader: {
    backgroundColor: COLORS.primary,
    padding: SPACING.lg,
  },
  chatHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
  },
  chatHeaderSubtitle: {
    color: COLORS.blue100,
    fontSize: 14,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: COLORS.gray50,
    padding: SPACING.lg,
  },
  inputContainer: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
    padding: SPACING.lg,
  },
});