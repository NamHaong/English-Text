import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WordItem, CEFRLevel } from '../types/vocabulary';
import { DynamicIslandSimulator } from '../components/DynamicIslandSimulator';
import { WordCard } from '../components/WordCard';
import { LevelFilter } from '../components/LevelFilter';
import { updateLiveActivityWord } from '../services/liveActivity';
import { triggerHaptic } from '../services/haptics';

interface LearnScreenProps {
  vocabulary: WordItem[];
  currentIndex: number;
  memorizedIds: string[];
  streakDays: number;
  onUpdateIndex: (index: number) => void;
  onMarkMemorized: (id: string) => void;
  onUnmarkMemorized: (id: string) => void;
}

export const LearnScreen: React.FC<LearnScreenProps> = ({
  vocabulary,
  currentIndex,
  memorizedIds,
  streakDays,
  onUpdateIndex,
  onMarkMemorized,
  onUnmarkMemorized,
}) => {
  const [selectedLevel, setSelectedLevel] = useState<CEFRLevel | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Filtered vocabulary list based on level and search
  const filteredWords = useMemo(() => {
    return vocabulary.filter((item) => {
      const matchLevel =
        selectedLevel === 'ALL' || item.level === selectedLevel;
      const matchSearch =
        !searchQuery.trim() ||
        item.word.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        item.meaning.toLowerCase().includes(searchQuery.toLowerCase().trim());
      return matchLevel && matchSearch;
    });
  }, [vocabulary, selectedLevel, searchQuery]);

  // Level counts
  const levelCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: vocabulary.length };
    vocabulary.forEach((w) => {
      counts[w.level] = (counts[w.level] || 0) + 1;
    });
    return counts;
  }, [vocabulary]);

  // Safe index within filtered words
  const safeIndex = useMemo(() => {
    if (filteredWords.length === 0) return 0;
    if (currentIndex >= filteredWords.length) return 0;
    return currentIndex;
  }, [currentIndex, filteredWords.length]);

  const currentWord = filteredWords[safeIndex] || null;
  const isMemorized = currentWord ? memorizedIds.includes(currentWord.id) : false;

  // Whenever current word changes, update Live Activity
  useEffect(() => {
    if (currentWord) {
      updateLiveActivityWord(currentWord, memorizedIds.length);
    }
    // Only re-notify when the word changes, not when the memorized count changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWord?.id]);

  // Pending auto-advance after ticking a word; cleared on unmount / manual navigation
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
  }, []);

  const handleNextWord = () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    if (safeIndex < filteredWords.length - 1) {
      onUpdateIndex(safeIndex + 1);
    } else {
      onUpdateIndex(0); // loop back
    }
  };

  const handlePrevWord = () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    if (safeIndex > 0) {
      onUpdateIndex(safeIndex - 1);
    }
  };

  // When user ticks: mark memorized & immediately advance to next word!
  const handleToggleMemorize = () => {
    if (!currentWord) return;
    if (!isMemorized) {
      onMarkMemorized(currentWord.id);
      // Auto move down to next word
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
      advanceTimer.current = setTimeout(handleNextWord, 350);
    } else {
      onUnmarkMemorized(currentWord.id);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Dynamic Island Header Simulator */}
      <DynamicIslandSimulator
        currentWord={currentWord}
        totalMemorized={memorizedIds.length}
        onMemorizeCurrent={handleToggleMemorize}
        onNextWord={handleNextWord}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* App Top Brand Bar */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.appTitle}>Eng Text</Text>
            <Text style={styles.appSubtitle}>
              Oxford 5000 • Học từ vựng thông minh
            </Text>
          </View>

          <View style={styles.topRightIcons}>
            {/* Streak badge */}
            <View style={styles.streakBadge}>
              <Ionicons name="flame" size={17} color="#F97316" />
              <Text style={styles.streakText}>{streakDays} ngày</Text>
            </View>

            {/* Search toggle */}
            <TouchableOpacity
              style={styles.iconCircle}
              onPress={() => {
                triggerHaptic('light');
                setShowSearch(!showSearch);
              }}
            >
              <Ionicons
                name={showSearch ? 'close' : 'search'}
                size={18}
                color="#475569"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar if expanded */}
        {showSearch ? (
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm từ vựng hoặc nghĩa tiếng Việt..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                onUpdateIndex(0); // result list changes, so restart from the first match
              }}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 ? (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  onUpdateIndex(0);
                }}
              >
                <Ionicons name="close-circle" size={18} color="#94A3B8" />
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {/* CEFR Level filter chips */}
        <LevelFilter
          selectedLevel={selectedLevel}
          onSelectLevel={(level) => {
            setSelectedLevel(level);
            onUpdateIndex(0);
          }}
          counts={levelCounts}
        />

        {/* Main Word Card */}
        {currentWord ? (
          <WordCard
            word={currentWord}
            isMemorized={isMemorized}
            onToggleMemorized={handleToggleMemorize}
            onNext={handleNextWord}
            onPrev={handlePrevWord}
            hasPrev={safeIndex > 0}
            hasNext={safeIndex < filteredWords.length - 1}
            currentIndex={safeIndex}
            totalCount={filteredWords.length}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color="#94A3B8" />
            <Text style={styles.emptyText}>Không tìm thấy từ vựng phù hợp</Text>
          </View>
        )}

        {/* Live Island Tip Banner */}
        <View style={styles.islandTipCard}>
          <View style={styles.tipIconWrap}>
            <Ionicons name="notifications-outline" size={22} color="#0284C7" />
          </View>
          <View style={styles.tipTextWrap}>
            <Text style={styles.tipTitle}>Dynamic Island & Khóa Màn Hình</Text>
            <Text style={styles.tipDesc}>
              Khi thoát ra màn hình chính, từ vựng sẽ tự động ghim trên Dynamic Island và thông báo để bạn học thuộc mọi lúc mọi nơi!
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 6,
    marginBottom: 8,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  topRightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 4,
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  streakText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#C2410C',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 10,
  },
  islandTipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    gap: 12,
  },
  tipIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipTextWrap: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0369A1',
    marginBottom: 2,
  },
  tipDesc: {
    fontSize: 12,
    color: '#0284C7',
    lineHeight: 17,
  },
});
