import { useCallback, useState } from 'react';
import { ChatMessage } from '../../../shared/types';

const INITIAL_MESSAGE: ChatMessage = {
  type: 'bot',
  message: "Hello! I'm your LakbAI assistant. How can I help you today?",
  timestamp: new Date()
};

export const useChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages(prev => [...prev, { ...message, timestamp: new Date() }]);
  }, []);

  const sendMessage = useCallback((text: string) => {
    if (!text.trim()) return;

    const userMessage: ChatMessage = {
      type: 'user',
      message: text,
      timestamp: new Date()
    };

    addMessage(userMessage);

    // Simulate bot response
    setTimeout(() => {
      let botResponse = '';
      const lowerText = text.toLowerCase();

      if (lowerText.includes('fare')) {
        botResponse = 'To calculate your fare, please tell me your pickup and destination points.';
      } else if (lowerText.includes('time') || lowerText.includes('arrive')) {
        botResponse = 'Based on current traffic, the estimated arrival time is 5-7 minutes.';
      } else if (lowerText.includes('route')) {
        botResponse = 'This jeepney follows the Tejero - Pala-pala route';
      } else if (lowerText.includes('emergency')) {
        botResponse = 'Emergency contacts: Police 117, Fire 116, Medical 911. Jeepney dispatch: (046) 123-4567';
      } else {
        botResponse = "I'm here to help with fare calculations, route information, and arrival times. What would you like to know?";
      }

      const botMessage: ChatMessage = {
        type: 'bot',
        message: botResponse,
        timestamp: new Date()
      };

      addMessage(botMessage);
    }, 1000);
  }, [addMessage]);

  return {
    messages,
    sendMessage,
    addMessage
  };
};