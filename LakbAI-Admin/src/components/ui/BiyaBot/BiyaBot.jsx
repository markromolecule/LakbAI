import React, { useState, useRef, useEffect } from 'react';
import { Button, Card, Form, InputGroup } from 'react-bootstrap';
import styles from './BiyaBot.module.css';

const BiyaBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hi! I'm Biya!, your smart commute assistant. How can I help you today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
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

  const getBotResponse = (userMessage) => {
    const message = userMessage.toLowerCase();
    
    // Simple rule-based responses for BiyaBot
    if (message.includes('fare') || message.includes('price') || message.includes('cost')) {
      return "Jeepney fares range from ₱13-25 depending on your destination. You can use our fare calculator to get the exact fare for your trip from any checkpoint to another.";
    }
    
    if (message.includes('route') || message.includes('checkpoint') || message.includes('stop')) {
      return "Our jeepney route covers Tejero → Pala-pala with 15 checkpoints including Robinson Tejero, Malabon, Riverside, Lancaster New City, and Robinson Pala-pala. Which specific checkpoint are you looking for?";
    }
    
    if (message.includes('time') || message.includes('schedule') || message.includes('arrival')) {
      return "Jeepneys typically run every 10-15 minutes during peak hours and every 20-30 minutes during off-peak hours. For real-time arrivals, scan the QR code inside any jeepney to get live updates.";
    }
    
    if (message.includes('qr') || message.includes('scan')) {
      return "To use our smart system, simply scan the QR code you'll find inside any LakbAI jeepney. This will give you access to fare calculation, real-time arrivals, and route information.";
    }
    
    if (message.includes('help') || message.includes('how')) {
      return "I can help you with:\n• Fare calculations\n• Route information and checkpoints\n• Jeepney schedules and arrivals\n• How to use the QR system\n\nWhat would you like to know?";
    }
    
    if (message.includes('hi') || message.includes('hello') || message.includes('good')) {
      return "Hello! Welcome to LakbAI. I'm here to help make your jeepney commute easier. What can I assist you with today?";
    }
    
    if (message.includes('thank') || message.includes('thanks')) {
      return "You're welcome! Happy to help make your commute smoother. Have a safe trip! 🚌";
    }
    
    // Default response
    return "I'd be happy to help! I can provide information about jeepney fares, routes, schedules, and how to use our QR system. What specific information are you looking for?";
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

    // Simulate bot typing delay
    setTimeout(() => {
      const botResponse = {
        id: Date.now() + 1,
        text: getBotResponse(inputMessage),
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000); // Random delay between 1-2 seconds
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
                  <small className="text-muted">Online</small>
                </div>
              </div>
              <Button 
                variant="link" 
                size="sm" 
                onClick={toggleChat}
                className={styles.closeBtn}
              >
                <i className="bi bi-x-lg"></i>
              </Button>
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
          </Card.Body>
          
          <Card.Footer className={styles.chatFooter}>
            <Form onSubmit={handleSendMessage}>
              <InputGroup>
                <Form.Control
                  ref={inputRef}
                  type="text"
                  placeholder="Type your message..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  className={styles.messageInput}
                />
                <Button 
                  type="submit" 
                  variant="primary"
                  disabled={inputMessage.trim() === ''}
                >
                  <i className="bi bi-send"></i>
                </Button>
              </InputGroup>
            </Form>
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
