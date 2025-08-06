import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SPACING } from '../../../../shared/styles/spacing';
import { COLORS } from '../../../../shared/themes/colors';
import { QuickQuestion } from '../../../../shared/types';

interface QuickQuestionsProps {
  questions: QuickQuestion[];
  onQuestionPress: (question: string) => void;
}

export const QuickQuestions: React.FC<QuickQuestionsProps> = ({
  questions,
  onQuestionPress
}) => {
  return (
    <View style={styles.container}>
      {questions.map((question) => (
        <TouchableOpacity
          key={question.id}
          style={styles.question}
          onPress={() => onQuestionPress(question.text)}
        >
          <Text style={styles.questionText}>{question.text}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.md,
  },
  question: {
    backgroundColor: COLORS.gray100,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: SPACING.sm,
    margin: 2,
  },
  questionText: {
    color: COLORS.gray700,
    fontSize: 12,
  },
});