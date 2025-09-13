import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '@/src/utils/constants';

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
  stepTitles?: string[];
  showStepNames?: boolean;
}

export function OnboardingProgress({ 
  currentStep, 
  totalSteps, 
  stepTitles = [],
  showStepNames = false 
}: OnboardingProgressProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      {/* Step Dots */}
      <View style={styles.dotsContainer}>
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber <= currentStep;
          const isCurrent = stepNumber === currentStep;
          
          return (
            <View
              key={stepNumber}
              style={[
                styles.dot,
                isActive && styles.dotActive,
                isCurrent && styles.dotCurrent,
              ]}
            >
              <Text style={[
                styles.dotText,
                isActive && styles.dotTextActive,
              ]}>
                {stepNumber}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Step Info */}
      <View style={styles.stepInfo}>
        <Text style={styles.stepText}>
          Step {currentStep} of {totalSteps}
        </Text>
        {showStepNames && stepTitles[currentStep - 1] && (
          <Text style={styles.stepTitle}>
            {stepTitles[currentStep - 1]}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 2,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 2,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotActive: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  dotCurrent: {
    backgroundColor: 'white',
    borderColor: COLORS.PRIMARY,
    borderWidth: 3,
  },
  dotText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999999',
  },
  dotTextActive: {
    color: 'white',
  },
  stepInfo: {
    alignItems: 'center',
  },
  stepText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  stepTitle: {
    fontSize: 16,
    color: COLORS.DARK,
    fontWeight: '600',
    marginTop: 4,
  },
});