import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useVocab } from '../../context/VocabContext';
import { MasteredScreen } from '../../screens/MasteredScreen';

export default function MasteredTab() {
  const { vocabulary, progress, isLoading, unmarkMemorized, recordTest } = useVocab();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <MasteredScreen
      vocabulary={vocabulary}
      memorizedIds={progress.memorizedIds}
      onUnmarkMemorized={unmarkMemorized}
      onRecordTest={recordTest}
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
