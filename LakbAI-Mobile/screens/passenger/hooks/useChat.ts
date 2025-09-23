import { useCallback, useState } from 'react';
import { ChatMessage } from '../../../shared/types';
import { biyaBotService, BotResponse } from '../../../shared/services/biyaBotService';

const INITIAL_MESSAGE: ChatMessage = {
  type: 'bot',
  message: "Hello! I'm Biya, your LakbAI assistant! 😊 I can help you with fares, routes, and schedules in English or Tagalog! Just ask me anything! 🤗",
  timestamp: new Date()
};

export const useChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages(prev => [...prev, { ...message, timestamp: new Date() }]);
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const userMessage: ChatMessage = {
      type: 'user',
      message: text,
      timestamp: new Date()
    };

    addMessage(userMessage);
    setIsLoading(true);

    try {
      console.log('🤖 Processing user message:', text);
      
      // Process message with smart bot service
      const botResponse: BotResponse = await biyaBotService.processMessage(text);
      
      console.log('🤖 Bot response:', botResponse);

      const botMessage: ChatMessage = {
        type: 'bot',
        message: botResponse.message,
        timestamp: new Date()
      };

      addMessage(botMessage);

      // Add suggestions if available
      if (botResponse.suggestions && botResponse.suggestions.length > 0) {
        setTimeout(() => {
          const suggestionMessage: ChatMessage = {
            type: 'bot',
            message: `💡 Quick suggestions:\n${botResponse.suggestions.map(s => `• ${s}`).join('\n')}`,
            timestamp: new Date()
          };
          addMessage(suggestionMessage);
        }, 500);
      }

    } catch (error) {
      console.error('❌ Chat error:', error);
      
      const errorMessage: ChatMessage = {
        type: 'bot',
        message: 'Sorry, I encountered an error. Please try again or ask me something else!',
        timestamp: new Date()
      };

      addMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [addMessage]);

  return {
    messages,
    sendMessage,
    addMessage,
    isLoading
  };
};