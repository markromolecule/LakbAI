import React, { useState, useEffect, useRef } from 'react';
import { ScrollView, Text, View, ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChatInput } from '../components/chat/ChatInput';
import { ChatMessage } from '../components/chat/ChatMessage';
import { FloatingQuickQuestions } from '../components/chat/FloatingQuickQuestions';
import { QUICK_QUESTIONS } from '../../../constants/quickQuestions';
import { useChat } from '../hooks/useChat';
import styles from '../styles/ChatScreen.styles';

export const ChatScreen: React.FC = () => {
  const { messages, sendMessage, isLoading } = useChat();
  const [inputText, setInputText] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [showQuickQuestions, setShowQuickQuestions] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);

  // Handle keyboard visibility
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (event) => {
        setKeyboardVisible(true);
        setKeyboardHeight(event.endCoordinates.height);
        // Auto-scroll to bottom when keyboard appears
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 150);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSend = () => {
    if (inputText.trim()) {
      sendMessage(inputText);
      setInputText('');
      // Auto-scroll after sending
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const toggleQuickQuestions = () => {
    setShowQuickQuestions(!showQuickQuestions);
  };


  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <View style={styles.chatHeader}>
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <Text style={styles.chatHeaderTitle}>BiyaBot</Text>
            <Text style={styles.chatHeaderSubtitle}>Ask me about fares, routes, and schedules</Text>
          </View>
          <TouchableOpacity 
            style={styles.toggleButton} 
            onPress={toggleQuickQuestions}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={showQuickQuestions ? "eye-off" : "eye"} 
              size={20} 
              color="#ffffff" 
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map((message, index) => (
          <ChatMessage key={index} message={message} />
        ))}
        {isLoading && (
          <View style={{ padding: 16, alignItems: 'center' }}>
            <ActivityIndicator size="small" color="#22C55E" />
            <Text style={{ marginTop: 8, color: '#666', fontSize: 12 }}>
              Biya is thinking...
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={[
        styles.inputContainer,
        keyboardVisible && styles.inputContainerKeyboardVisible,
        keyboardVisible && { marginBottom: keyboardHeight > 0 ? 0 : 0 }
      ]}>
        <ChatInput
          value={inputText}
          onChangeText={setInputText}
          onSend={handleSend}
        />
      </View>

      {/* Floating quick questions - visible when enabled and keyboard is not shown */}
      {!keyboardVisible && showQuickQuestions && (
        <FloatingQuickQuestions
          questions={QUICK_QUESTIONS}
          onQuestionPress={sendMessage}
        />
      )}
    </KeyboardAvoidingView>
  );      
};