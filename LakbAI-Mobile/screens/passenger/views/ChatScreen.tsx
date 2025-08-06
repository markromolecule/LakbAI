import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { ChatInput } from '../components/chat/ChatInput';
import { ChatMessage } from '../components/chat/ChatMessage';
import { QuickQuestions } from '../components/chat/QuickQuestions';
import { QUICK_QUESTIONS } from '../../../constants/quickQuestions';
import { useChat } from '../hooks/useChat';
import styles from '../styles/ChatScreen.styles';

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