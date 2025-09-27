import React from 'react';
import { StyleSheet, Text, View, Animated } from 'react-native';
import { SPACING } from '../../../../shared/styles/spacing';
import { COLORS } from '../../../../shared/themes/colors';
import { ChatMessage as ChatMessageType } from '../../../../shared/types';

interface ChatMessageProps {
  message: ChatMessageType;
  isTyping?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isTyping = false }) => {
  const isUser = message.type === 'user';
  
  return (
    <View style={[
      styles.container,
      isUser ? styles.userMessage : styles.botMessage
    ]}>
      {!isUser && (
        <View style={styles.botAvatar}>
          <Text style={styles.botAvatarText}>🤖</Text>
        </View>
      )}
      
      <View style={[
        styles.messageBubble,
        isUser ? styles.userBubble : styles.botBubble
      ]}>
        <Text style={[
          styles.messageText,
          isUser ? styles.userText : styles.botText
        ]}>
          {message.message}
        </Text>
        
        {message.timestamp && (
          <Text style={[
            styles.timestamp,
            isUser ? styles.userTimestamp : styles.botTimestamp
          ]}>
            {new Date(message.timestamp).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
        )}
      </View>
      
      {isUser && (
        <View style={styles.userAvatar}>
          <Text style={styles.userAvatarText}>👤</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
    maxWidth: '85%',
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  userMessage: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  botMessage: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
  },
  messageBubble: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    maxWidth: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 6,
    marginRight: SPACING.xs,
  },
  botBubble: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 6,
    marginLeft: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '400',
  },
  userText: {
    color: COLORS.white,
  },
  botText: {
    color: COLORS.gray800,
  },
  timestamp: {
    fontSize: 11,
    marginTop: SPACING.xs,
    opacity: 0.7,
  },
  userTimestamp: {
    color: COLORS.white,
    textAlign: 'right',
  },
  botTimestamp: {
    color: COLORS.gray500,
    textAlign: 'left',
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.xs,
  },
  botAvatarText: {
    fontSize: 16,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.gray300,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.xs,
  },
  userAvatarText: {
    fontSize: 16,
  },
});