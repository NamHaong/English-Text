import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { WordItem, UserProgress } from '../types/vocabulary';
import {
  getStoredProgress,
  markWordMemorized,
  unmarkWordMemorized,
  updateCurrentIndex,
  saveProgress,
  recordTestResult,
  createDefaultProgress,
} from '../services/storage';
import { requestNotificationPermissions } from '../services/liveActivity';

import { loadVocabulary } from '../data/loadVocabulary';

const rawVocab = loadVocabulary(require('../data/vocabulary.json'));

interface VocabContextType {
  vocabulary: WordItem[];
  progress: UserProgress;
  isLoading: boolean;
  updateIndex: (index: number) => Promise<void>;
  markMemorized: (id: string) => Promise<void>;
  unmarkMemorized: (id: string) => Promise<void>;
  recordTest: (isCorrect: boolean) => Promise<void>;
  resetProgress: () => Promise<void>;
}

const VocabContext = createContext<VocabContextType | null>(null);

export const VocabProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [vocabulary] = useState<WordItem[]>(rawVocab);
  const [progress, setProgress] = useState<UserProgress>(createDefaultProgress);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        await requestNotificationPermissions();
        const saved = await getStoredProgress();
        setProgress(saved);
      } catch (err) {
        console.error('Failed to init VocabContext:', err);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const updateIndex = useCallback(async (index: number) => {
    setProgress((prev) => ({ ...prev, currentIndex: index }));
    await updateCurrentIndex(index);
  }, []);

  const markMemorized = useCallback(async (id: string) => {
    const updated = await markWordMemorized(id);
    setProgress({ ...updated });
  }, []);

  const unmarkMemorized = useCallback(async (id: string) => {
    const updated = await unmarkWordMemorized(id);
    setProgress({ ...updated });
  }, []);

  const recordTest = useCallback(async (isCorrect: boolean) => {
    const updated = await recordTestResult(isCorrect);
    setProgress({ ...updated });
  }, []);

  const resetProgress = useCallback(async () => {
    const fresh = createDefaultProgress();
    await saveProgress(fresh);
    setProgress(fresh);
  }, []);

  const value = useMemo(
    () => ({
      vocabulary,
      progress,
      isLoading,
      updateIndex,
      markMemorized,
      unmarkMemorized,
      recordTest,
      resetProgress,
    }),
    [vocabulary, progress, isLoading, updateIndex, markMemorized, unmarkMemorized, recordTest, resetProgress]
  );

  return <VocabContext.Provider value={value}>{children}</VocabContext.Provider>;
};

export const useVocab = () => {
  const context = useContext(VocabContext);
  if (!context) {
    throw new Error('useVocab must be used within a VocabProvider');
  }
  return context;
};
