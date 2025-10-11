import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated } from 'react-native';
import { QuickQuestion } from '../../../../shared/types';
import { COLORS, SPACING } from '../../../../shared/styles';

interface FloatingQuickQuestionsProps {
  questions: QuickQuestion[];
  onQuestionPress: (question: string) => void;
  isVisible?: boolean;
  isUserTyping?: boolean; // New prop to hide when user is typing
}

export const FloatingQuickQuestions: React.FC<FloatingQuickQuestionsProps> = ({
  questions,
  onQuestionPress,
  isVisible = true,
  isUserTyping = false
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Hide when user is typing, show when not typing and visible
    const shouldShow = isVisible && !isUserTyping;
    
    if (shouldShow) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 50,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [fadeAnim, slideAnim, isVisible, isUserTyping]);

  if ((!isVisible || isUserTyping) && questions.length === 0) {
    return null;
  }

  return (
    <Animated.View style={[
      styles.container, 
      { 
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }]
      }
    ]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.botIcon}>🤖</Text>
          <Text style={styles.title}>BiyaBot</Text>
        </View>
        <Text style={styles.subtitle}>Quick questions to get started</Text>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.questionsContainer}
        decelerationRate="fast"
        snapToInterval={140}
        snapToAlignment="start"
      >
        {questions.map((question, index) => (
          <TouchableOpacity
            key={question.id}
            style={styles.questionButton}
            onPress={() => onQuestionPress(question.text)}
            activeOpacity={0.8}
          >
            <Text style={styles.categoryIcon}>
              {getCategoryIcon(question.category)}
            </Text>
            <Text style={styles.questionText} numberOfLines={2}>
              {question.text}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Animated.View>
  );
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
    position: 'absolute',
    bottom: 120,
    left: SPACING.md,
    right: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    maxHeight: 160,
  },
  header: {
    marginBottom: SPACING.sm,
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  botIcon: {
    fontSize: 20,
    marginRight: SPACING.xs,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.gray800,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.gray500,
    fontStyle: 'italic',
  },
  questionsContainer: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.xs,
  },
  questionButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 16,
    marginRight: SPACING.sm,
    minWidth: 120,
    maxWidth: 180,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    backgroundColor: COLORS.primary, // Single color for all questions
  },
  categoryIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  questionText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
  },
});
