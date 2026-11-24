import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useVocab } from '../../context/VocabContext';
import { StatsScreen } from '../../screens/StatsScreen';

export default function StatsTab() {
  const { vocabulary, progress, isLoading, resetProgress } = useVocab();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  return (
    <StatsScreen
      vocabulary={vocabulary}
      progress={progress}
      onResetProgress={resetProgress}
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
