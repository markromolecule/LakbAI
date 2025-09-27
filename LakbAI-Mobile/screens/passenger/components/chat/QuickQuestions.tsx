import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Animated } from 'react-native';
import { SPACING } from '../../../../shared/styles/spacing';
import { COLORS } from '../../../../shared/themes/colors';
import { QuickQuestion } from '../../../../shared/types';

interface QuickQuestionsProps {
  questions: QuickQuestion[];
  onQuestionPress: (question: string) => void;
  isVisible?: boolean;
}

export const QuickQuestions: React.FC<QuickQuestionsProps> = ({
  questions,
  onQuestionPress,
  isVisible = true
}) => {
  if (!isVisible || questions.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>💡 Quick Questions</Text>
      <View style={styles.questionsContainer}>
        {questions.map((question, index) => (
          <TouchableOpacity
            key={question.id}
            style={[
              styles.questionButton,
              { backgroundColor: getCategoryColor(question.category) }
            ]}
            onPress={() => onQuestionPress(question.text)}
            activeOpacity={0.8}
          >
            <Text style={styles.questionText} numberOfLines={2}>
              {question.text}
            </Text>
            <Text style={styles.categoryIcon}>
              {getCategoryIcon(question.category)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const getCategoryColor = (category?: string): string => {
  switch (category) {
    case 'fare':
      return COLORS.primary;
    case 'route':
      return '#4CAF50';
    case 'time':
      return '#FF9800';
    case 'emergency':
      return '#F44336';
    default:
      return COLORS.primary;
  }
};

const getCategoryIcon = (category?: string): string => {
  switch (category) {
    case 'fare':
      return '💰';
    case 'route':
      return '🗺️';
    case 'time':
      return '⏰';
    case 'emergency':
      return '🚨';
    default:
      return '❓';
  }
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  headerText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray700,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  questionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  questionButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    margin: 2,
    minWidth: 100,
    maxWidth: 150,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  questionText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    flex: 1,
    lineHeight: 16,
  },
  categoryIcon: {
    fontSize: 14,
    marginLeft: SPACING.xs,
  },
});