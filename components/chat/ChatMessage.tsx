import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../shared/styles/colors';
import { SPACING } from '../../shared/styles/spacing';
import { ChatMessage as ChatMessageType } from '../../shared/types';

interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.type === 'user';
  
  return (
    <View style={[
      styles.container,
      isUser ? styles.userMessage : styles.botMessage
    ]}>
      <Text style={[
        styles.text,
        isUser ? styles.userText : styles.botText
      ]}>
        {message.message}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
    maxWidth: '80%',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  botMessage: {
    alignSelf: 'flex-start',
  },
  text: {
    padding: SPACING.md,
    borderRadius: SPACING.md,
    fontSize: 14,
  },
  userText: {
    backgroundColor: COLORS.primary,
    color: COLORS.white,
  },
  botText: {
    backgroundColor: COLORS.white,
    color: COLORS.gray800,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
});