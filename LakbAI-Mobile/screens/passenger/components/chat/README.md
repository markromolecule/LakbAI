# BiyaBot Mobile - Enhanced Chat Components

## Overview

The BiyaBot mobile implementation provides a modern, intelligent chatbot experience for the LakbAI mobile app. It features smart language detection, database integration, and a beautiful, responsive UI.

## Features

### 🤖 Smart BiyaBot
- **Language Detection**: Automatically detects English and Tagalog
- **Database Integration**: Real-time fare calculations and route information
- **Contextual Responses**: Intelligent responses based on user queries
- **Multi-language Support**: Seamless switching between English and Tagalog

### 💬 Modern Chat UI
- **Message Bubbles**: Modern chat bubble design with avatars
- **Typing Indicators**: Animated typing indicators for better UX
- **Timestamps**: Message timestamps for conversation history
- **Smooth Animations**: Fade-in and slide animations for better feel

### ⚡ Quick Questions
- **Floating Quick Questions**: Contextual quick questions that appear when needed
- **Category-based Design**: Color-coded questions by category (fare, route, time, emergency)
- **Smart Visibility**: Auto-hide when conversation starts
- **Horizontal Scrolling**: Smooth horizontal scrolling with snap-to behavior

### 📱 Enhanced Input
- **Modern Input Design**: Rounded input with focus states
- **Character Counter**: Real-time character count (500 max)
- **Send Button Animation**: Animated send button with scale effects
- **Keyboard Handling**: Proper keyboard avoidance and dismissal

## Components

### ChatMessage
Modern message component with:
- User and bot message differentiation
- Avatar support (🤖 for bot, 👤 for user)
- Timestamp display
- Shadow effects and modern styling
- Responsive bubble design

### ChatInput
Enhanced input component with:
- Focus state animations
- Character counter
- Send button animations
- Keyboard handling
- Multiline support

### QuickQuestions
Static quick questions component with:
- Category-based color coding
- Icon support for each category
- Responsive button design
- Flexible layout

### FloatingQuickQuestions
Floating quick questions with:
- Slide and fade animations
- Horizontal scrolling
- Snap-to behavior
- Auto-hide functionality
- Modern card design

### BiyaBotScreen
Main chat screen featuring:
- Complete chat interface
- Language switching
- Clear chat functionality
- Typing indicators
- Keyboard avoidance
- Integration with biyabotService

## Usage

### Basic Implementation

```tsx
import { BiyaBotScreen } from './screens/passenger/BiyaBotScreen';

// In your navigation or screen
<BiyaBotScreen />
```

### Custom Implementation

```tsx
import { 
  ChatMessage, 
  ChatInput, 
  QuickQuestions, 
  FloatingQuickQuestions 
} from './components/chat';

// Use individual components
<ChatMessage message={message} />
<ChatInput 
  value={input} 
  onChangeText={setInput} 
  onSend={handleSend} 
/>
<QuickQuestions 
  questions={questions} 
  onQuestionPress={handleQuestion} 
/>
```

## Service Integration

The components integrate with the existing `biyabotService` which provides:

- **Language Detection**: Automatic English/Tagalog detection
- **Fare Calculation**: Real-time fare calculations from database
- **Route Information**: Available routes and checkpoints
- **Smart Responses**: Contextual responses based on query type

## Styling

All components use the shared design system:
- **Colors**: `COLORS` from shared styles
- **Spacing**: `SPACING` constants for consistent spacing
- **Typography**: Consistent font sizes and weights
- **Shadows**: Modern shadow effects for depth
- **Animations**: Smooth transitions and micro-interactions

## Responsive Design

The components are designed to work across different screen sizes:
- **Small Screens**: Optimized button sizes and spacing
- **Large Screens**: Proper scaling and layout
- **Keyboard Handling**: Proper keyboard avoidance
- **Safe Areas**: Support for device safe areas

## Accessibility

- **Touch Targets**: Minimum 44px touch targets
- **Color Contrast**: Proper contrast ratios
- **Screen Reader**: Proper accessibility labels
- **Keyboard Navigation**: Full keyboard support

## Performance

- **Optimized Animations**: Using native driver for smooth animations
- **Efficient Rendering**: Proper use of React.memo and useCallback
- **Memory Management**: Proper cleanup of animations and listeners
- **Lazy Loading**: Components load efficiently

## Future Enhancements

- **Voice Input**: Speech-to-text integration
- **Rich Media**: Support for images and files
- **Push Notifications**: Real-time notifications
- **Offline Support**: Cached responses for offline use
- **Analytics**: User interaction tracking
- **Themes**: Dark mode and custom themes

## Dependencies

- React Native
- Expo Vector Icons
- Shared LakbAI styles and types
- biyabotService for backend integration

## File Structure

```
screens/passenger/
├── BiyaBotScreen.tsx          # Main chat screen
├── BiyaBotDemo.tsx           # Demo screen
└── components/chat/
    ├── ChatMessage.tsx       # Message component
    ├── ChatInput.tsx         # Input component
    ├── QuickQuestions.tsx    # Static quick questions
    ├── FloatingQuickQuestions.tsx # Floating quick questions
    ├── index.ts              # Exports
    └── README.md             # This file
```

## Getting Started

1. Import the BiyaBotScreen component
2. Add it to your navigation stack
3. The service will automatically handle language detection and responses
4. Customize the quick questions as needed
5. Test with different languages and query types

The BiyaBot mobile implementation provides a complete, modern chatbot experience that's both functional and beautiful! 🚀
