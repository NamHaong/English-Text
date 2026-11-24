import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WordItem } from '../types/vocabulary';
import { WordCard } from '../components/WordCard';
import {
  updateRealDynamicIsland,
  stopRealDynamicIsland,
  getDynamicIslandSetting,
  setDynamicIslandSetting,
} from '../services/liveActivity';
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
  const [islandEnabled, setIslandEnabled] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Initialize Dynamic Island setting from storage
  useEffect(() => {
    let isMounted = true;
    getDynamicIslandSetting().then((val) => {
      if (isMounted) setIslandEnabled(val);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Filtered words for instant search lookup (if searching)
  const displayWords = useMemo(() => {
    if (!searchQuery.trim()) return vocabulary;
    const q = searchQuery.toLowerCase().trim();
    return vocabulary.filter(
      (w) => w.word.toLowerCase().includes(q) || w.meaning.toLowerCase().includes(q)
    );
  }, [vocabulary, searchQuery]);

  // Safe index within display words
  const safeIndex = useMemo(() => {
    if (displayWords.length === 0) return 0;
    if (currentIndex >= displayWords.length) return 0;
    return currentIndex;
  }, [currentIndex, displayWords.length]);

  const currentWord = displayWords[safeIndex] || null;
  const isMemorized = currentWord ? memorizedIds.includes(currentWord.id) : false;

  // Sync with real iOS Dynamic Island whenever current word changes or island state changes
  useEffect(() => {
    if (currentWord && islandEnabled) {
      updateRealDynamicIsland(
        currentWord,
        safeIndex + 1,
        memorizedIds.length,
        isMemorized
      );
    }
  }, [currentWord, islandEnabled, safeIndex, memorizedIds.length, isMemorized]);

  // Toggle Dynamic Island setting
  const handleToggleIsland = async (val: boolean) => {
    triggerHaptic('light');
    setIslandEnabled(val);
    await setDynamicIslandSetting(val);
    if (!val) {
      await stopRealDynamicIsland();
    } else if (currentWord) {
      await updateRealDynamicIsland(
        currentWord,
        safeIndex + 1,
        memorizedIds.length,
        isMemorized
      );
    }
  };

  // Pending auto-advance timer after ticking
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
  }, []);

  const handleNextWord = () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    if (safeIndex < displayWords.length - 1) {
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

  // When user ticks: mark memorized & auto advance down to next word
  const handleToggleMemorize = () => {
    if (!currentWord) return;
    if (!isMemorized) {
      onMarkMemorized(currentWord.id);
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
      advanceTimer.current = setTimeout(handleNextWord, 350);
    } else {
      onUnmarkMemorized(currentWord.id);
    }
  };

  // Calculate difficulty progress percentage
  const difficultyProgress = useMemo(() => {
    if (vocabulary.length === 0) return 0;
    return Math.min(100, Math.round(((safeIndex + 1) / vocabulary.length) * 100));
  }, [safeIndex, vocabulary.length]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* App Top Bar */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.appTitle}>Eng Text</Text>
            <Text style={styles.appSubtitle}>Học 5000 từ theo thứ tự độ khó</Text>
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

        {/* Real Dynamic Island Header Banner on iPhone */}
        <View style={styles.islandHeaderBar}>
          <View style={styles.islandLeft}>
            <View style={styles.islandIconContainer}>
              <Ionicons name="hardware-chip-outline" size={20} color="#0284C7" />
            </View>
            <View style={styles.islandTextContainer}>
              <Text style={styles.islandTitle}>Dynamic Island iPhone</Text>
              <Text style={styles.islandSubtitle}>
                {Platform.OS === 'ios'
                  ? islandEnabled
                    ? 'Đang ghim trực tiếp trên camera iPhone'
                    : 'Đã tạm tắt Live Activity'
                  : 'Hỗ trợ hiển thị trên iPhone 14 Pro trở lên'}
              </Text>
            </View>
          </View>

          <Switch
            value={islandEnabled}
            onValueChange={handleToggleIsland}
            trackColor={{ false: '#CBD5E1', true: '#38BDF8' }}
            thumbColor={islandEnabled ? '#0284C7' : '#F1F5F9'}
          />
        </View>

        {/* Search Bar if expanded */}
        {showSearch ? (
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm từ tiếng Anh hoặc nghĩa tiếng Việt..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                onUpdateIndex(0);
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

        {/* Difficulty Ladder Bar (A1 -> A2 -> B1 -> B2 -> C1) */}
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>
              Thứ tự độ khó: #{safeIndex + 1} / {vocabulary.length}
            </Text>
            <Text style={styles.progressPercent}>{difficultyProgress}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View
              style={[styles.progressBarFill, { width: `${difficultyProgress}%` }]}
            />
          </View>
          <View style={styles.levelMilestones}>
            <Text style={[styles.milestoneText, safeIndex <= 14 && styles.milestoneActive]}>
              A1
            </Text>
            <Text style={styles.milestoneDivider}>→</Text>
            <Text
              style={[
                styles.milestoneText,
                safeIndex > 14 && safeIndex <= 24 && styles.milestoneActive,
              ]}
            >
              A2
            </Text>
            <Text style={styles.milestoneDivider}>→</Text>
            <Text
              style={[
                styles.milestoneText,
                safeIndex > 24 && safeIndex <= 29 && styles.milestoneActive,
              ]}
            >
              B1
            </Text>
            <Text style={styles.milestoneDivider}>→</Text>
            <Text
              style={[
                styles.milestoneText,
                safeIndex > 29 && safeIndex <= 728 && styles.milestoneActive,
              ]}
            >
              B2
            </Text>
            <Text style={styles.milestoneDivider}>→</Text>
            <Text style={[styles.milestoneText, safeIndex > 728 && styles.milestoneActive]}>
              C1
            </Text>
          </View>
        </View>

        {/* Main Word Card */}
        {currentWord ? (
          <WordCard
            word={currentWord}
            isMemorized={isMemorized}
            onToggleMemorized={handleToggleMemorize}
            onNext={handleNextWord}
            onPrev={handlePrevWord}
            hasPrev={safeIndex > 0}
            hasNext={safeIndex < displayWords.length - 1}
            currentIndex={safeIndex}
            totalCount={displayWords.length}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color="#94A3B8" />
            <Text style={styles.emptyText}>Không tìm thấy từ vựng</Text>
          </View>
        )}
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
    marginBottom: 10,
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
    marginTop: 1,
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
  islandHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0F9FF',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  islandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  islandIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  islandTextContainer: {
    flex: 1,
  },
  islandTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0369A1',
  },
  islandSubtitle: {
    fontSize: 11,
    color: '#0284C7',
    marginTop: 1,
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
  progressContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563EB',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 3,
  },
  levelMilestones: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  milestoneText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  milestoneActive: {
    color: '#2563EB',
    fontWeight: '900',
  },
  milestoneDivider: {
    fontSize: 11,
    color: '#CBD5E1',
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
});
