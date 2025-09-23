import { Ionicons } from '@expo/vector-icons';
import React, { useRef } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View, Keyboard } from 'react-native';
import { COLORS, SPACING } from '../../../../shared/styles';

interface ChatInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChangeText,
  onSend,
  placeholder = "Type your message..."
}) => {
  const textInputRef = useRef<TextInput>(null);

  const handleSend = () => {
    if (value.trim()) {
      onSend();
      // Dismiss keyboard after sending
      Keyboard.dismiss();
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        ref={textInputRef}
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        multiline
        returnKeyType="send"
        onSubmitEditing={handleSend}
        blurOnSubmit={false}
        textAlignVertical="top"
      />
      <TouchableOpacity 
        style={[styles.sendButton, !value.trim() && styles.sendButtonDisabled]} 
        onPress={handleSend}
        disabled={!value.trim()}
      >
        <Ionicons name="send" size={20} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.gray300,
    borderRadius: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginRight: SPACING.sm,
    maxHeight: 100,
    minHeight: 40,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: SPACING.md,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.gray300,
    opacity: 0.6,
  },
});