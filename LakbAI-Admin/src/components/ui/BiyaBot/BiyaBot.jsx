import React, { useState, useRef, useEffect } from 'react';
import { Button, Card, Form, InputGroup, Badge } from 'react-bootstrap';
import styles from './BiyaBot.module.css';
import biyaBotService from '../../../services/biyabotService';

const BiyaBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hi! I'm Biya!, your smart commute assistant. How can I help you today?\n\nKumusta! Ako si Biya, ang inyong matalinong commute assistant. Paano ko kayo matutulungan ngayon?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('auto'); // auto, en, tl
  const [routes, setRoutes] = useState([]);
  const [checkpoints, setCheckpoints] = useState([]);
  const [quickQuestions, setQuickQuestions] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Load initial data when component mounts
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // Load routes using service
      const routesData = await biyaBotService.getRoutes();
      if (routesData.status === 'success') {
        setRoutes(routesData.routes || []);
      }

      // Load checkpoints using service
      const checkpointsData = await biyaBotService.getAllCheckpoints();
      if (checkpointsData.status === 'success') {
        setCheckpoints(checkpointsData.checkpoints || []);
      }

      // Set up quick questions
      setQuickQuestions([
        { id: 1, text: 'What are the available routes?', tagalog: 'Ano ang mga available na ruta?', type: 'routes' },
        { id: 2, text: 'How much is the fare?', tagalog: 'Magkano ang pamasahe?', type: 'fare' },
        { id: 3, text: 'What are the checkpoints?', tagalog: 'Ano ang mga checkpoint?', type: 'checkpoints' },
        { id: 4, text: 'How to use QR code?', tagalog: 'Paano gamitin ang QR code?', type: 'qr' },
        { id: 5, text: 'What are the schedules?', tagalog: 'Ano ang mga schedule?', type: 'schedule' }
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  // Language detection function
  const detectLanguage = (text) => {
    const tagalogWords = ['kumusta', 'salamat', 'paano', 'ano', 'saan', 'kailan', 'bakit', 'magkano', 'pamasahe', 'ruta', 'checkpoint', 'qr', 'code', 'tulong', 'sched', 'oras', 'jeepney', 'lakbai'];
    const lowerText = text.toLowerCase();
    const tagalogCount = tagalogWords.filter(word => lowerText.includes(word)).length;
    return tagalogCount > 0 ? 'tl' : 'en';
  };

  // Get response based on detected language
  const getLocalizedResponse = (englishText, tagalogText, detectedLang) => {
    if (detectedLang === 'tl') {
      return tagalogText;
    }
    return englishText;
  };

  // Enhanced AI-like response system
  const getEnhancedResponse = async (userMessage, detectedLang) => {
    const message = userMessage.toLowerCase();
    
    // System status queries
    if (message.includes('status') || message.includes('system') || message.includes('stats')) {
      try {
        const stats = await biyaBotService.getSystemStats();
        if (stats.status === 'success') {
          const englishResponse = `🚌 LakbAI System Status:\n• Active Routes: ${stats.stats.totalRoutes}\n• Total Jeepneys: ${stats.stats.totalJeepneys}\n• Fare Matrix: Active\n• Real-time Tracking: Enabled\n\nEverything is running smoothly! ✨`;
          const tagalogResponse = `🚌 LakbAI System Status:\n• Active na Ruta: ${stats.stats.totalRoutes}\n• Kabuuang Jeepney: ${stats.stats.totalJeepneys}\n• Fare Matrix: Active\n• Real-time Tracking: Naka-enable\n\nLahat ay tumatakbo nang maayos! ✨`;
          return getLocalizedResponse(englishResponse, tagalogResponse, detectedLang);
        }
      } catch (error) {
        console.error('Error fetching system stats:', error);
      }
    }

    // Real-time jeepney location queries
    if (message.includes('location') || message.includes('where') || message.includes('saan') || message.includes('nasa')) {
      if (routes.length > 0) {
        try {
          const routeId = routes[0].id; // Get first route for demo
          const locations = await biyaBotService.getDriverLocationsForRoute(routeId);
          if (locations.status === 'success' && locations.drivers && locations.drivers.length > 0) {
            const englishResponse = `🚌 Real-time Jeepney Locations:\n\n${locations.drivers.map(driver => 
              `• ${driver.jeepney_number} - ${driver.driver_name}\n  Current: ${driver.current_checkpoint}\n  ETA: ${driver.estimated_arrival}`
            ).join('\n\n')}\n\n📍 Use our QR system for live updates!`;
            const tagalogResponse = `🚌 Real-time na Lokasyon ng Jeepney:\n\n${locations.drivers.map(driver => 
              `• ${driver.jeepney_number} - ${driver.driver_name}\n  Kasalukuyan: ${driver.current_checkpoint}\n  ETA: ${driver.estimated_arrival}`
            ).join('\n\n')}\n\n📍 Gamitin ang aming QR system para sa live updates!`;
            return getLocalizedResponse(englishResponse, tagalogResponse, detectedLang);
          }
        } catch (error) {
          console.error('Error fetching driver locations:', error);
        }
      }
    }

    // Fare calculation with specific checkpoints
    if (message.includes('calculate') || message.includes('kalkulahin') || message.includes('compute')) {
      const checkpointNames = checkpoints.map(cp => cp.checkpoint_name.toLowerCase());
      const mentionedCheckpoints = checkpointNames.filter(name => 
        message.includes(name) || message.includes(name.replace(/\s+/g, ''))
      );
      
      if (mentionedCheckpoints.length >= 2) {
        try {
          const fareResult = await biyaBotService.calculateFareByNames(
            mentionedCheckpoints[0], 
            mentionedCheckpoints[1]
          );
          
          if (fareResult.status === 'success') {
            const fareInfo = fareResult.fare_info;
            const englishResponse = `💰 Fare Calculation:\n\nFrom: ${fareInfo.from_checkpoint}\nTo: ${fareInfo.to_checkpoint}\nRoute: ${fareInfo.route_name}\n\n💵 Fare Amount: ₱${fareInfo.fare_amount}\n\nThis is calculated using our smart fare matrix system! 🎯`;
            const tagalogResponse = `💰 Pagkalkula ng Pamasahe:\n\nMula: ${fareInfo.from_checkpoint}\nPapunta: ${fareInfo.to_checkpoint}\nRuta: ${fareInfo.route_name}\n\n💵 Halaga ng Pamasahe: ₱${fareInfo.fare_amount}\n\nIto ay kinakalkula gamit ang aming matalinong fare matrix system! 🎯`;
            return getLocalizedResponse(englishResponse, tagalogResponse, detectedLang);
          }
        } catch (error) {
          console.error('Error calculating fare:', error);
        }
      }
    }

    // Smart suggestions based on context
    if (message.includes('suggest') || message.includes('recommend') || message.includes('suggest') || message.includes('payo')) {
      const englishResponse = `💡 Smart Suggestions:\n\n• Use QR codes for real-time tracking\n• Check peak hours (6AM-9AM, 5PM-8PM)\n• Plan your route using our checkpoint system\n• Save time with our fare calculator\n• Get live updates on jeepney arrivals\n\n🎯 What would you like to know more about?`;
      const tagalogResponse = `💡 Matalinong Payo:\n\n• Gamitin ang QR codes para sa real-time tracking\n• Tingnan ang peak hours (6AM-9AM, 5PM-8PM)\n• Planuhin ang inyong ruta gamit ang checkpoint system\n• Makatipid ng oras sa aming fare calculator\n• Makakuha ng live updates sa pagdating ng jeepney\n\n🎯 Ano ang gusto ninyong malaman pa?`;
      return getLocalizedResponse(englishResponse, tagalogResponse, detectedLang);
    }

    return null; // No enhanced response found
  };

  const getBotResponse = async (userMessage) => {
    const message = userMessage.toLowerCase();
    const detectedLang = detectLanguage(userMessage);
    
    // Enhanced AI-like response with context awareness
    const enhancedResponse = await getEnhancedResponse(userMessage, detectedLang);
    if (enhancedResponse) {
      return enhancedResponse;
    }
    
    // Fare-related queries with specific checkpoint detection
    if (message.includes('fare') || message.includes('price') || message.includes('cost') || message.includes('pamasahe') || message.includes('magkano')) {
      // Try to extract specific checkpoint names from the message
      const checkpointNames = checkpoints.map(cp => cp.checkpoint_name.toLowerCase());
      const mentionedCheckpoints = [];
      
      // Simple and reliable checkpoint detection
      for (const checkpoint of checkpoints) {
        const checkpointName = checkpoint.checkpoint_name.toLowerCase();
        
        // Check for exact match first
        if (message.includes(checkpointName)) {
          mentionedCheckpoints.push(checkpointName);
          continue;
        }
        
        // Check for match without spaces
        const checkpointNoSpaces = checkpointName.replace(/\s+/g, '');
        if (message.includes(checkpointNoSpaces)) {
          mentionedCheckpoints.push(checkpointName);
          continue;
        }
        
        // Check for partial matches with word boundaries
        const checkpointWords = checkpointName.split(' ');
        if (checkpointWords.length > 1) {
          // Check if at least 2 significant words are present
          const significantWords = checkpointWords.filter(word => word.length > 2);
          const foundWords = significantWords.filter(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'i');
            return regex.test(message);
          });
          
          // If we found at least 2 significant words, consider it a match
          if (foundWords.length >= 2) {
            mentionedCheckpoints.push(checkpointName);
          }
        }
      }
      
      console.log('Mentioned checkpoints:', mentionedCheckpoints);
      
      if (mentionedCheckpoints.length >= 2) {
        // Try to determine the correct order based on the user's message
        let fromCheckpoint, toCheckpoint;
        
        // Look for directional words to determine order
        const fromWords = ['from', 'mula', 'sa', 'galing'];
        const toWords = ['to', 'papunta', 'hanggang', 'destinasyon', 'papuntang', 'tungo'];
        
        const messageLower = message.toLowerCase();
        let fromIndex = -1, toIndex = -1;
        
        // Find the position of directional words
        for (const word of fromWords) {
          const index = messageLower.indexOf(word);
          if (index !== -1 && (fromIndex === -1 || index < fromIndex)) {
            fromIndex = index;
          }
        }
        
        for (const word of toWords) {
          const index = messageLower.indexOf(word);
          if (index !== -1 && (toIndex === -1 || index < toIndex)) {
            toIndex = index;
          }
        }
        
        console.log('Directional word positions - From:', fromIndex, 'To:', toIndex);
        
        // Handle different word orders (English: from...to, Tagalog: to...from)
        if (fromIndex !== -1 && toIndex !== -1) {
          if (fromIndex < toIndex) {
            // English order: "from A to B"
            const fromPart = messageLower.substring(0, toIndex);
            const toPart = messageLower.substring(toIndex);
            
            fromCheckpoint = mentionedCheckpoints.find(cp => fromPart.includes(cp.toLowerCase()));
            toCheckpoint = mentionedCheckpoints.find(cp => toPart.includes(cp.toLowerCase()));
          } else {
            // Tagalog order: "papunta B mula A" (to B from A)
            const toPart = messageLower.substring(0, fromIndex);
            const fromPart = messageLower.substring(fromIndex);
            
            toCheckpoint = mentionedCheckpoints.find(cp => toPart.includes(cp.toLowerCase()));
            fromCheckpoint = mentionedCheckpoints.find(cp => fromPart.includes(cp.toLowerCase()));
          }
        }
        
        // If we couldn't determine order from directional words, use the order they appear in the message
        if (!fromCheckpoint || !toCheckpoint) {
          const firstCheckpointIndex = messageLower.indexOf(mentionedCheckpoints[0]);
          const secondCheckpointIndex = messageLower.indexOf(mentionedCheckpoints[1]);
          
          if (firstCheckpointIndex < secondCheckpointIndex) {
            fromCheckpoint = mentionedCheckpoints[0];
            toCheckpoint = mentionedCheckpoints[1];
          } else {
            fromCheckpoint = mentionedCheckpoints[1];
            toCheckpoint = mentionedCheckpoints[0];
          }
        }
        
        console.log('Determined order - From:', fromCheckpoint, 'To:', toCheckpoint);
        
        // User mentioned specific checkpoints, try to calculate fare
        try {
          const fareResult = await biyaBotService.calculateFareByNames(
            fromCheckpoint, 
            toCheckpoint
          );
          
          if (fareResult.status === 'success') {
            const fareInfo = fareResult.fare_info;
            const englishResponse = `💰 Fare Calculation:\n\nFrom: ${fareInfo.from_checkpoint}\nTo: ${fareInfo.to_checkpoint}\nRoute: ${fareInfo.route_name}\n\n💵 Fare Amount: ₱${fareInfo.fare_amount}\n\nThis is calculated using our smart fare matrix system! 🎯`;
            const tagalogResponse = `💰 Pagkalkula ng Pamasahe:\n\nMula: ${fareInfo.from_checkpoint}\nPapunta: ${fareInfo.to_checkpoint}\nRuta: ${fareInfo.route_name}\n\n💵 Halaga ng Pamasahe: ₱${fareInfo.fare_amount}\n\nIto ay kinakalkula gamit ang aming matalinong fare matrix system! 🎯`;
            return getLocalizedResponse(englishResponse, tagalogResponse, detectedLang);
          }
        } catch (error) {
          console.error('Error calculating fare:', error);
        }
      }
      
      // If only one checkpoint mentioned, provide more specific help
      if (mentionedCheckpoints.length === 1) {
        const englishResponse = `I found "${mentionedCheckpoints[0]}" in your message. To calculate the exact fare, please also mention your destination checkpoint. For example: "How much is the fare from ${mentionedCheckpoints[0]} to [destination]?"`;
        const tagalogResponse = `Nakita ko ang "${mentionedCheckpoints[0]}" sa inyong mensahe. Para kalkulahin ang eksaktong pamasahe, sabihin din ninyo ang inyong destinasyon. Halimbawa: "Magkano ang pamasahe mula ${mentionedCheckpoints[0]} papunta [destinasyon]?"`;
        return getLocalizedResponse(englishResponse, tagalogResponse, detectedLang);
      }
      
      // Fallback to general fare information
      const englishResponse = "Jeepney fares range from ₱13-50 depending on your destination. I can help you calculate the exact fare between any two checkpoints. Just tell me your starting and destination points!";
      const tagalogResponse = "Ang pamasahe ng jeepney ay mula ₱13-50 depende sa inyong destinasyon. Makatutulong ako na kalkulahin ang eksaktong pamasahe sa pagitan ng dalawang checkpoint. Sabihin lang ninyo ang inyong starting point at destinasyon!";
      return getLocalizedResponse(englishResponse, tagalogResponse, detectedLang);
    }
    
    // Route-related queries
    if (message.includes('route') || message.includes('checkpoint') || message.includes('stop') || message.includes('ruta')) {
      const routeNames = routes.map(route => route.route_name).join(', ');
      
      // If user asks specifically about checkpoints, show them
      if (message.includes('checkpoint') || message.includes('stop')) {
        const checkpointNames = checkpoints.map(cp => cp.checkpoint_name).join(', ');
        const englishResponse = `📍 Available Checkpoints:\n\n${checkpointNames}\n\nWe have ${routes.length} active routes: ${routeNames}. You can ask me to calculate fares between any of these checkpoints!`;
        const tagalogResponse = `📍 Available na Checkpoints:\n\n${checkpointNames}\n\nMayroon kaming ${routes.length} active na ruta: ${routeNames}. Maaari ninyong itanong sa akin na kalkulahin ang pamasahe sa pagitan ng alinman sa mga checkpoint na ito!`;
        return getLocalizedResponse(englishResponse, tagalogResponse, detectedLang);
      }
      
      const englishResponse = `We have ${routes.length} active routes: ${routeNames}. Each route has multiple checkpoints. Which specific route or checkpoint are you looking for?`;
      const tagalogResponse = `Mayroon kaming ${routes.length} active na ruta: ${routeNames}. Bawat ruta ay may maraming checkpoint. Aling specific na ruta o checkpoint ang hinahanap ninyo?`;
      return getLocalizedResponse(englishResponse, tagalogResponse, detectedLang);
    }
    
    // Schedule-related queries
    if (message.includes('time') || message.includes('schedule') || message.includes('arrival') || message.includes('oras') || message.includes('sched')) {
      const englishResponse = "Jeepneys typically run every 10-15 minutes during peak hours (6AM-9AM, 5PM-8PM) and every 20-30 minutes during off-peak hours. For real-time arrivals, scan the QR code inside any jeepney to get live updates.";
      const tagalogResponse = "Ang mga jeepney ay tumatakbo tuwing 10-15 minuto sa peak hours (6AM-9AM, 5PM-8PM) at tuwing 20-30 minuto sa off-peak hours. Para sa real-time arrivals, i-scan ang QR code sa loob ng jeepney para sa live updates.";
      return getLocalizedResponse(englishResponse, tagalogResponse, detectedLang);
    }
    
    // QR code queries
    if (message.includes('qr') || message.includes('scan') || message.includes('code')) {
      const englishResponse = "To use our smart system, simply scan the QR code you'll find inside any LakbAI jeepney. This will give you access to fare calculation, real-time arrivals, and route information. It's free and easy to use!";
      const tagalogResponse = "Para gamitin ang aming smart system, i-scan lang ang QR code na makikita ninyo sa loob ng kahit anong LakbAI jeepney. Makakakuha kayo ng fare calculation, real-time arrivals, at route information. Libre at madaling gamitin!";
      return getLocalizedResponse(englishResponse, tagalogResponse, detectedLang);
    }
    
    // Help queries
    if (message.includes('help') || message.includes('how') || message.includes('tulong') || message.includes('paano')) {
      const englishResponse = "I can help you with:\n• Fare calculations between checkpoints\n• Route information and checkpoints\n• Jeepney schedules and arrivals\n• How to use the QR system\n• Finding the nearest jeepney\n\nWhat would you like to know?";
      const tagalogResponse = "Makatutulong ako sa:\n• Pagkalkula ng pamasahe sa pagitan ng checkpoints\n• Impormasyon tungkol sa ruta at checkpoints\n• Schedule at arrivals ng jeepney\n• Paano gamitin ang QR system\n• Paghahanap ng pinakamalapit na jeepney\n\nAno ang gusto ninyong malaman?";
      return getLocalizedResponse(englishResponse, tagalogResponse, detectedLang);
    }
    
    // Greeting queries
    if (message.includes('hi') || message.includes('hello') || message.includes('good') || message.includes('kumusta') || message.includes('kamusta')) {
      const englishResponse = "Hello! Welcome to LakbAI. I'm here to help make your jeepney commute easier and smarter. What can I assist you with today?";
      const tagalogResponse = "Kumusta! Maligayang pagdating sa LakbAI. Nandito ako para makatulong na gawing mas madali at matalino ang inyong jeepney commute. Paano ko kayo matutulungan ngayon?";
      return getLocalizedResponse(englishResponse, tagalogResponse, detectedLang);
    }
    
    // Thank you queries
    if (message.includes('thank') || message.includes('thanks') || message.includes('salamat')) {
      const englishResponse = "You're welcome! Happy to help make your commute smoother and more convenient. Have a safe trip! 🚌✨";
      const tagalogResponse = "Walang anuman! Masaya akong makatulong para gawing mas smooth at convenient ang inyong commute. Mag-ingat sa biyahe! 🚌✨";
      return getLocalizedResponse(englishResponse, tagalogResponse, detectedLang);
    }
    
    // Checkpoint-specific queries
    const checkpointMatch = checkpoints.find(cp => 
      message.includes(cp.checkpoint_name.toLowerCase()) ||
      message.includes(cp.checkpoint_name.toLowerCase().replace(/\s+/g, ''))
    );
    
    if (checkpointMatch) {
      const routeInfo = routes.find(r => r.id === checkpointMatch.route_id);
      const routeName = routeInfo ? routeInfo.route_name : `Route ${checkpointMatch.route_id}`;
      
      const englishResponse = `I found information about ${checkpointMatch.checkpoint_name}. This checkpoint is part of ${routeName} and is at sequence ${checkpointMatch.sequence_order}. The fare from origin is ₱${checkpointMatch.fare_from_origin}. Would you like to know more about this checkpoint or calculate a fare from here?`;
      const tagalogResponse = `Nakita ko ang impormasyon tungkol sa ${checkpointMatch.checkpoint_name}. Ang checkpoint na ito ay bahagi ng ${routeName} at nasa sequence ${checkpointMatch.sequence_order}. Ang pamasahe mula sa origin ay ₱${checkpointMatch.fare_from_origin}. Gusto ninyo bang malaman pa tungkol sa checkpoint na ito o kalkulahin ang pamasahe mula dito?`;
      return getLocalizedResponse(englishResponse, tagalogResponse, detectedLang);
    }

    // Fare calculation queries with specific checkpoints
    const fareCalculationMatch = message.match(/(?:fare|pamasahe|magkano).*(?:from|mula|sa|to|papunta|hanggang)/i);
    if (fareCalculationMatch) {
      // Try to extract checkpoint names from the message
      const checkpointNames = checkpoints.map(cp => cp.checkpoint_name.toLowerCase());
      const mentionedCheckpoints = checkpointNames.filter(name => 
        message.includes(name) || message.includes(name.replace(/\s+/g, ''))
      );
      
      if (mentionedCheckpoints.length >= 2) {
        const englishResponse = `I can help you calculate the fare between ${mentionedCheckpoints[0]} and ${mentionedCheckpoints[1]}. Let me get the exact fare for you...`;
        const tagalogResponse = `Makatutulong ako na kalkulahin ang pamasahe sa pagitan ng ${mentionedCheckpoints[0]} at ${mentionedCheckpoints[1]}. Hayaan ninyong kunin ko ang eksaktong pamasahe para sa inyo...`;
        return getLocalizedResponse(englishResponse, tagalogResponse, detectedLang);
      }
    }
    
    // Default response
    const englishResponse = "I'd be happy to help! I can provide information about jeepney fares, routes, schedules, and how to use our QR system. You can also ask me about specific checkpoints or calculate fares between any two points. What specific information are you looking for?";
    const tagalogResponse = "Masaya akong makatulong! Maaari kong bigyan kayo ng impormasyon tungkol sa pamasahe ng jeepney, mga ruta, schedule, at kung paano gamitin ang QR system. Maaari rin ninyong itanong sa akin ang tungkol sa specific na checkpoints o kalkulahin ang pamasahe sa pagitan ng dalawang punto. Anong specific na impormasyon ang hinahanap ninyo?";
    return getLocalizedResponse(englishResponse, tagalogResponse, detectedLang);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (inputMessage.trim() === '') return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Get bot response with real-time data
    try {
      const botResponseText = await getBotResponse(inputMessage);

    // Simulate bot typing delay
    setTimeout(() => {
      const botResponse = {
        id: Date.now() + 1,
          text: botResponseText,
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000); // Random delay between 1-2 seconds
    } catch (error) {
      console.error('Error getting bot response:', error);
      const errorResponse = {
        id: Date.now() + 1,
        text: "Sorry, I'm having trouble connecting to the database right now. Please try again in a moment.",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
      setIsTyping(false);
    }
  };

  const handleQuickQuestion = (question) => {
    const detectedLang = detectLanguage(question.text);
    const questionText = detectedLang === 'tl' ? question.tagalog : question.text;
    setInputMessage(questionText);
    // Auto-send the quick question
    setTimeout(() => {
      const fakeEvent = { preventDefault: () => {} };
      setInputMessage(questionText);
      handleSendMessage(fakeEvent);
    }, 100);
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const toggleLanguage = () => {
    setCurrentLanguage(prev => {
      if (prev === 'auto') return 'en';
      if (prev === 'en') return 'tl';
      return 'auto';
    });
  };

  return (
    <div className={styles.biyaBotContainer}>
      {/* Chat Widget */}
      {isOpen && (
        <Card className={styles.chatWidget}>
          <Card.Header className={styles.chatHeader}>
            <div className={styles.headerContent}>
              <div className={styles.botInfo}>
                <div className={styles.botAvatar}>
                  <i className="bi bi-robot"></i>
                </div>
                <div className={styles.botDetails}>
                  <h6 className="mb-0">BiyaBot</h6>
                  <small className="text-muted">Online • Smart Assistant</small>
                </div>
              </div>
              <div className={styles.headerActions}>
                <Button 
                  variant="link" 
                  size="sm" 
                  onClick={toggleLanguage}
                  className={styles.languageBtn}
                  title={`Current: ${currentLanguage === 'auto' ? 'Auto-detect' : currentLanguage === 'en' ? 'English' : 'Tagalog'}`}
                >
                  <i className={`bi ${currentLanguage === 'auto' ? 'bi-translate' : currentLanguage === 'en' ? 'bi-flag' : 'bi-flag-fill'}`}></i>
                </Button>
              <Button 
                variant="link" 
                size="sm" 
                onClick={toggleChat}
                className={styles.closeBtn}
              >
                <i className="bi bi-x-lg"></i>
              </Button>
              </div>
            </div>
          </Card.Header>
          
          <Card.Body className={styles.chatBody}>
            <div className={styles.messagesContainer}>
              {messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`${styles.message} ${styles[message.sender]}`}
                >
                  <div className={styles.messageContent}>
                    <div className={styles.messageText}>
                      {message.text}
                    </div>
                    <div className={styles.messageTime}>
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className={`${styles.message} ${styles.bot}`}>
                  <div className={styles.messageContent}>
                    <div className={styles.typingIndicator}>
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
            
            {/* Quick Questions Section */}
            {messages.length <= 1 && (
              <div className={styles.quickQuestions}>
                <div className={styles.quickQuestionsHeader}>
                  <small className="text-muted">Quick Questions:</small>
                </div>
                <div className={styles.quickQuestionsList}>
                  {quickQuestions.map((question) => (
                    <Button
                      key={question.id}
                      variant="outline-primary"
                      size="sm"
                      className={styles.quickQuestionBtn}
                      onClick={() => handleQuickQuestion(question)}
                    >
                      {question.text}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </Card.Body>
          
          <Card.Footer className={styles.chatFooter}>
            <Form onSubmit={handleSendMessage}>
              <InputGroup>
                <Form.Control
                  ref={inputRef}
                  type="text"
                  placeholder={currentLanguage === 'tl' ? 'Mag-type ng mensahe...' : 'Type your message...'}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  className={styles.messageInput}
                />
                <Button 
                  type="submit" 
                  variant="primary"
                  disabled={inputMessage.trim() === ''}
                  className={styles.sendBtn}
                >
                  <i className="bi bi-send"></i>
                </Button>
              </InputGroup>
            </Form>
            <div className={styles.footerInfo}>
              <small className="text-muted">
                <i className="bi bi-lightning-charge"></i> Smart Assistant • 
                <i className="bi bi-database"></i> Real-time Data • 
                <i className="bi bi-translate"></i> Multi-language
              </small>
            </div>
          </Card.Footer>
        </Card>
      )}

      {/* Chat Toggle Button */}
      <Button 
        className={styles.chatToggle}
        onClick={toggleChat}
        variant="primary"
      >
        {isOpen ? (
          <i className="bi bi-x-lg"></i>
        ) : (
          <>
            <i className="bi bi-chat-dots-fill"></i>
            <span className={styles.chatLabel}>BiyaBot</span>
          </>
        )}
      </Button>
    </div>
  );
};

export default BiyaBot;
