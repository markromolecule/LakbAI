import { useCallback, useState, useEffect } from 'react';
import { ChatMessage } from '../../../shared/types';

// Try dynamic import to avoid potential circular dependency issues
let biyaBotService: any = null;

// Fallback mock service
const createMockService = () => ({
  async processMessage(userMessage: string) {
    console.log('🤖 Mock service processing:', userMessage);
    return {
      message: `Mock response for: ${userMessage}. (Note: Using fallback service - real service couldn't be loaded)`,
      type: 'text' as const,
      suggestions: ['Calculate fare', 'Show routes', 'Help']
    };
  }
});

// Dynamic import function
const loadBiyaBotService = async () => {
  try {
    console.log('🔍 Attempting to load biyabotService module...');
    const module = await import('../../../shared/services/biyabotService');
    console.log('🔍 Module loaded successfully');
    console.log('🔍 Module keys:', Object.keys(module));
    console.log('🔍 Module.biyaBotService:', module.biyaBotService);
    console.log('🔍 Module.default:', module.default);
    console.log('🔍 Module.biyaBotService type:', typeof module.biyaBotService);
    console.log('🔍 Module.default type:', typeof module.default);
    
    // Try both named export and default export
    biyaBotService = module.biyaBotService || module.default;
    
    console.log('🔍 Final biyaBotService:', biyaBotService);
    console.log('🔍 Final biyaBotService type:', typeof biyaBotService);
    console.log('🔍 Final biyaBotService.processMessage:', typeof biyaBotService?.processMessage);
    
    if (!biyaBotService || typeof biyaBotService.processMessage !== 'function') {
      console.log('⚠️ biyaBotService is invalid, using fallback mock');
      console.log('⚠️ biyaBotService:', biyaBotService);
      console.log('⚠️ processMessage type:', typeof biyaBotService?.processMessage);
      biyaBotService = createMockService();
    }
    
    console.log('✅ BiyaBot service loaded dynamically:', typeof biyaBotService);
    return true;
  } catch (error) {
    console.error('❌ Failed to load BiyaBot service:', error);
    console.log('🔄 Using fallback mock service');
    biyaBotService = createMockService();
    return true;
  }
};

const INITIAL_MESSAGE: ChatMessage = {
  type: 'bot',
  message: "Hello! I'm Biya, your LakbAI assistant! 😊 I can help you with fares, routes, and schedules in English or Tagalog! Just ask me anything! 🤗",
  timestamp: new Date()
};

export const useChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [serviceLoaded, setServiceLoaded] = useState(false);

  // Load the service on mount
  useEffect(() => {
    loadBiyaBotService().then(loaded => {
      setServiceLoaded(loaded);
    });
  }, []);

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
      console.log('🤖 Service loaded:', serviceLoaded);
      console.log('🤖 biyaBotService:', biyaBotService);
      
      // Ensure service is available (load if needed)
      if (!biyaBotService || typeof biyaBotService.processMessage !== 'function') {
        console.log('🔄 Service not available, attempting to load...');
        await loadBiyaBotService();
        // loadBiyaBotService now always provides a fallback, so this should never fail
        if (!biyaBotService || typeof biyaBotService.processMessage !== 'function') {
          throw new Error('BiyaBot service is not available (this should not happen)');
        }
      }
      
      // Process message with smart bot service
      const botResponse = await biyaBotService.processMessage(text);
      
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
            message: `💡 Quick suggestions:\n${botResponse.suggestions!.map((s: string) => `• ${s}`).join('\n')}`,
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
    isLoading,
    serviceLoaded
  };
};