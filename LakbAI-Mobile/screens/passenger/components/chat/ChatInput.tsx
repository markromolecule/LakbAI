import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, Keyboard, Animated } from 'react-native';
import { COLORS, SPACING } from '../../../../shared/styles';

interface ChatInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  placeholder?: string;
  isTyping?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChangeText,
  onSend,
  placeholder = "Type your message...",
  isTyping = false
}) => {
  const textInputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleSend = () => {
    if (value.trim()) {
      // Animate send button
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        })
      ]).start();
      
      onSend();
      Keyboard.dismiss();
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  return (
    <View style={styles.container}>
      <View style={[
        styles.inputContainer,
        isFocused && styles.inputContainerFocused
      ]}>
        <TextInput
          ref={textInputRef}
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.gray400}
          multiline
          returnKeyType="send"
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
          textAlignVertical="top"
          onFocus={handleFocus}
          onBlur={handleBlur}
          maxLength={500}
        />
        
        {value.length > 0 && (
          <View style={styles.characterCount}>
            <Text style={styles.characterCountText}>
              {value.length}/500
            </Text>
          </View>
        )}
      </View>
      
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity 
          style={[
            styles.sendButton, 
            !value.trim() && styles.sendButtonDisabled,
            isFocused && styles.sendButtonFocused
          ]} 
          onPress={handleSend}
          disabled={!value.trim()}
          activeOpacity={0.8}
        >
          <Ionicons 
            name="send" 
            size={20} 
            color={value.trim() ? COLORS.white : COLORS.gray400} 
          />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
  },
  inputContainer: {
    flex: 1,
    borderWidth: 2,
    borderColor: COLORS.gray200,
    borderRadius: 25,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginRight: SPACING.sm,
    maxHeight: 120,
    minHeight: 50,
    backgroundColor: COLORS.gray50,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputContainerFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  input: {
    fontSize: 16,
    color: COLORS.gray800,
    lineHeight: 20,
    maxHeight: 80,
    minHeight: 20,
  },
  characterCount: {
    position: 'absolute',
    bottom: 4,
    right: 8,
  },
  characterCountText: {
    fontSize: 10,
    color: COLORS.gray400,
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: 25,
    minWidth: 50,
    minHeight: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  sendButtonFocused: {
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.gray200,
    shadowOpacity: 0.1,
    elevation: 1,
  },
});