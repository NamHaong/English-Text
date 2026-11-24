import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useVocab } from '../../context/VocabContext';
import { ListScreen } from '../../screens/ListScreen';

export default function ListTab() {
  const router = useRouter();
  const {
    vocabulary,
    progress,
    isLoading,
    updateIndex,
    toggleMemorized,
  } = useVocab();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  const handleSelectWord = (index: number) => {
    updateIndex(index);
    router.push('/');
  };

  return (
    <ListScreen
      vocabulary={vocabulary}
      memorizedIds={progress.memorizedIds}
      onToggleMemorized={toggleMemorized}
      onSelectWordToLearn={handleSelectWord}
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
