import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated } from 'react-native';
import { QuickQuestion } from '../../../../shared/types';
import { COLORS, SPACING } from '../../../../shared/styles';

interface FloatingQuickQuestionsProps {
  questions: QuickQuestion[];
  onQuestionPress: (question: string) => void;
}

export const FloatingQuickQuestions: React.FC<FloatingQuickQuestionsProps> = ({
  questions,
  onQuestionPress
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.header}>
        <Text style={styles.title}>💡 Quick Questions</Text>
        <Text style={styles.subtitle}>Tap to ask Biya</Text>
      </View>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.questionsContainer}
      >
        {questions.map((question) => (
          <TouchableOpacity
            key={question.id}
            style={styles.questionButton}
            onPress={() => onQuestionPress(question.text)}
            activeOpacity={0.8}
          >
            <Text style={styles.questionText} numberOfLines={2}>
              {question.text}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 120, // Position above the input area
    left: SPACING.md,
    right: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: SPACING.lg,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    maxHeight: 140,
  },
  header: {
    marginBottom: SPACING.sm,
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.gray800,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.gray500,
    fontStyle: 'italic',
  },
  questionsContainer: {
    paddingHorizontal: SPACING.xs,
  },
  questionButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: SPACING.lg,
    marginRight: SPACING.sm,
    minWidth: 120,
    maxWidth: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
  },
});
