import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useVocab } from '../../context/VocabContext';
import { LearnScreen } from '../../screens/LearnScreen';

export default function LearnTab() {
  const {
    vocabulary,
    progress,
    isLoading,
    updateIndex,
    markMemorized,
    unmarkMemorized,
  } = useVocab();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <LearnScreen
      vocabulary={vocabulary}
      currentIndex={progress.currentIndex}
      memorizedIds={progress.memorizedIds}
      streakDays={progress.streakDays}
      onUpdateIndex={updateIndex}
      onMarkMemorized={markMemorized}
      onUnmarkMemorized={unmarkMemorized}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
});
