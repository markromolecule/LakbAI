import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Animated,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChatMessage, QuickQuestion } from '../../shared/types';
import { COLORS, SPACING } from '../../shared/styles';
import { biyaBotService } from '../../shared/services/biyaBotService';
import { ChatMessage as ChatMessageComponent } from './components/chat/ChatMessage';
import { ChatInput } from './components/chat/ChatInput';
import { FloatingQuickQuestions } from './components/chat/FloatingQuickQuestions';

export const BiyaBotScreen: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      type: 'bot',
      message: 'Hello! I\'m Biya, your smart commute assistant! 🤖\n\nI can help you with:\n• Fare calculations 💰\n• Route information 🗺️\n• Arrival times ⏰\n• Emergency contacts 🚨\n• Jeepney location tracking 🚌\n• Jeepney availability 🚌\n\nAsk me anything in English or Tagalog!',
      timestamp: new Date(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [quickQuestions, setQuickQuestions] = useState<QuickQuestion[]>([]);
  const [showQuickQuestions, setShowQuickQuestions] = useState(true);
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'tl'>('en');

  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Initialize quick questions
    if (biyaBotService) {
      const questions = biyaBotService.getQuickQuestions('en');
      setQuickQuestions(questions);
    }

    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      type: 'user',
      message: inputMessage.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);
    setShowQuickQuestions(false);

    try {
      // Get bot response using the existing service
      if (!biyaBotService) {
        throw new Error('BiyaBot service is not available');
      }
      
      const response = await biyaBotService.processMessage(userMessage.message);
      
      // Detect language and update quick questions
      const detectedLang = biyaBotService.detectLanguage(userMessage.message);
      setCurrentLanguage(detectedLang);
      const newQuestions = biyaBotService.getQuickQuestions(detectedLang);
      setQuickQuestions(newQuestions);

      // Simulate typing delay
      setTimeout(() => {
        const botMessage: ChatMessage = {
          type: 'bot',
          message: response.message,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, botMessage]);
        setIsTyping(false);
        scrollToBottom();
      }, 1000 + Math.random() * 1000); // 1-2 second delay

    } catch (error) {
      console.error('Error getting bot response:', error);
      
      setTimeout(() => {
        const errorMessage: ChatMessage = {
          type: 'bot',
          message: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, errorMessage]);
        setIsTyping(false);
        scrollToBottom();
      }, 1000);
    }
  };

  const handleQuickQuestionPress = (question: string) => {
    setInputMessage(question);
    setShowQuickQuestions(false);
  };

  const handleClearChat = () => {
    Alert.alert(
      'Clear Chat',
      'Are you sure you want to clear all messages?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            setMessages([
              {
                type: 'bot',
                message: 'Hello! I\'m Biya, your smart commute assistant! 🤖\n\nI can help you with:\n• Fare calculations 💰\n• Route information 🗺️\n• Arrival times ⏰\n• Emergency contacts 🚨\n\nAsk me anything in English or Tagalog!',
                timestamp: new Date(),
              }
            ]);
            setShowQuickQuestions(true);
          }
        }
      ]
    );
  };

  const toggleLanguage = () => {
    const newLang = currentLanguage === 'en' ? 'tl' : 'en';
    setCurrentLanguage(newLang);
    if (biyaBotService) {
      const questions = biyaBotService.getQuickQuestions(newLang);
      setQuickQuestions(questions);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.botIcon}>🤖</Text>
            <View>
              <Text style={styles.headerTitle}>BiyaBot</Text>
              <Text style={styles.headerSubtitle}>
                {isTyping ? 'Typing...' : 'Smart Commute Assistant'}
              </Text>
            </View>
          </View>
          
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.languageButton}
              onPress={toggleLanguage}
            >
              <Text style={styles.languageText}>
                {currentLanguage === 'en' ? 'EN' : 'TL'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={handleClearChat}
            >
              <Ionicons name="trash-outline" size={20} color={COLORS.gray600} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Chat Messages */}
        <Animated.View style={[styles.chatContainer, { opacity: fadeAnim }]}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={scrollToBottom}
          >
            {messages.map((message, index) => (
              <ChatMessageComponent
                key={index}
                message={message}
                isTyping={isTyping && index === messages.length - 1}
              />
            ))}
            
            {isTyping && (
              <View style={styles.typingContainer}>
                <View style={styles.botAvatar}>
                  <Text style={styles.botAvatarText}>🤖</Text>
                </View>
                <View style={styles.typingBubble}>
                  <View style={styles.typingDots}>
                    <View style={styles.typingDot} />
                    <View style={styles.typingDot} />
                    <View style={styles.typingDot} />
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        </Animated.View>

        {/* Floating Quick Questions */}
        <FloatingQuickQuestions
          questions={quickQuestions}
          onQuestionPress={handleQuickQuestionPress}
          isVisible={showQuickQuestions && messages.length <= 1}
          isUserTyping={inputMessage.length > 0} // Hide when user is typing
        />

        {/* Chat Input */}
        <ChatInput
          value={inputMessage}
          onChangeText={setInputMessage}
          onSend={handleSendMessage}
          placeholder={
            currentLanguage === 'tl' 
              ? 'Type your message...' 
              : 'Type your message...'
          }
          isTyping={isTyping}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray50,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  botIcon: {
    fontSize: 24,
    marginRight: SPACING.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.gray800,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.gray500,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
    marginRight: SPACING.sm,
  },
  languageText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  clearButton: {
    padding: SPACING.xs,
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: SPACING.md,
    maxWidth: '85%',
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
  typingBubble: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    marginLeft: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.gray400,
    marginHorizontal: 2,
  },
});
