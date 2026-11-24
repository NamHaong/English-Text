import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Platform,
  ListRenderItem,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WordItem, CEFRLevel } from '../types/vocabulary';
import { speakWord } from '../services/speech';
import { triggerHaptic } from '../services/haptics';

interface ListScreenProps {
  vocabulary: WordItem[];
  memorizedIds: string[];
  onToggleMemorized: (id: string) => void;
  onSelectWordToLearn?: (index: number) => void;
}

const LEVEL_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  A1: { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' },
  A2: { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' },
  B1: { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A' },
  B2: { bg: '#FDF2F8', text: '#DB2777', border: '#FBCFE8' },
  C1: { bg: '#F5F3FF', text: '#7C3AED', border: '#DDD6FE' },
};

export const ListScreen: React.FC<ListScreenProps> = ({
  vocabulary,
  memorizedIds,
  onToggleMemorized,
  onSelectWordToLearn,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<CEFRLevel | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNMEMORIZED' | 'MEMORIZED'>('ALL');

  // Set of memorized IDs for fast O(1) lookup
  const memorizedSet = useMemo(() => new Set(memorizedIds), [memorizedIds]);

  // Filtered vocabulary preserving difficulty order
  const filteredWords = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return vocabulary
      .map((item, originalIndex) => ({ ...item, originalIndex }))
      .filter((item) => {
        // Search filter
        if (q) {
          const matchWord = item.word.toLowerCase().includes(q);
          const matchMeaning = item.meaning.toLowerCase().includes(q);
          if (!matchWord && !matchMeaning) return false;
        }

        // Level filter
        if (levelFilter !== 'ALL' && item.level !== levelFilter) {
          return false;
        }

        // Status filter
        const isMem = memorizedSet.has(item.id);
        if (statusFilter === 'MEMORIZED' && !isMem) return false;
        if (statusFilter === 'UNMEMORIZED' && isMem) return false;

        return true;
      });
  }, [vocabulary, searchQuery, levelFilter, statusFilter, memorizedSet]);

  const handleSpeak = useCallback((wordText: string) => {
    triggerHaptic('light');
    speakWord(wordText);
  }, []);

  const handleToggle = useCallback(
    (id: string) => {
      triggerHaptic('light');
      onToggleMemorized(id);
    },
    [onToggleMemorized]
  );

  const renderItem: ListRenderItem<WordItem & { originalIndex: number }> = useCallback(
    ({ item }) => {
      const isMem = memorizedSet.has(item.id);
      const colorScheme = LEVEL_COLORS[item.level] || LEVEL_COLORS.A1;

      return (
        <View style={styles.card}>
          {/* Header row: Index rank, CEFR Badge, Part of Speech, Memorized status */}
          <View style={styles.cardHeader}>
            <View style={styles.rankBadge}>
              <Text style={styles.rankText}>#{item.originalIndex + 1}</Text>
            </View>

            <View
              style={[
                styles.levelBadge,
                { backgroundColor: colorScheme.bg, borderColor: colorScheme.border },
              ]}
            >
              <Text style={[styles.levelBadgeText, { color: colorScheme.text }]}>
                {item.level}
              </Text>
            </View>

            <View style={styles.posBadge}>
              <Text style={styles.posText}>{item.pos}</Text>
            </View>

            <View style={styles.spacer} />

            <TouchableOpacity
              onPress={() => handleToggle(item.id)}
              style={[
                styles.statusBtn,
                isMem ? styles.statusBtnActive : styles.statusBtnInactive,
              ]}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isMem ? 'checkmark-circle' : 'checkmark-circle-outline'}
                size={16}
                color={isMem ? '#059669' : '#94A3B8'}
              />
              <Text
                style={[
                  styles.statusText,
                  isMem ? styles.statusTextActive : styles.statusTextInactive,
                ]}
              >
                {isMem ? 'Đã thuộc' : 'Chưa thuộc'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Main word content */}
          <View style={styles.wordRow}>
            <View style={styles.wordInfo}>
              <View style={styles.wordTitleLine}>
                <Text style={styles.wordText}>{item.word}</Text>
                <TouchableOpacity
                  onPress={() => handleSpeak(item.word)}
                  style={styles.audioIconBtn}
                  activeOpacity={0.7}
                >
                  <Ionicons name="volume-high" size={20} color="#2563EB" />
                </TouchableOpacity>
              </View>
              <Text style={styles.ipaText}>{item.ipa}</Text>
            </View>

            {onSelectWordToLearn ? (
              <TouchableOpacity
                onPress={() => onSelectWordToLearn(item.originalIndex)}
                style={styles.learnNowBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.learnNowText}>Học từ này</Text>
                <Ionicons name="arrow-forward" size={14} color="#2563EB" />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Meaning */}
          <View style={styles.meaningContainer}>
            <Text style={styles.meaningText}>{item.meaning}</Text>
          </View>

          {/* Example snippet if available */}
          {item.example ? (
            <View style={styles.exampleContainer}>
              <Text style={styles.exampleText} numberOfLines={2}>
                &quot;{item.example}&quot;
              </Text>
            </View>
          ) : null}
        </View>
      );
    },
    [memorizedSet, handleSpeak, handleToggle, onSelectWordToLearn]
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.headerTitle}>Danh Sách Từ Vựng</Text>
          <Text style={styles.headerSubtitle}>
            Toàn bộ {vocabulary.length} từ xếp theo độ khó Oxford 5000
          </Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{filteredWords.length} từ</Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color="#94A3B8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm từ tiếng Anh, nghĩa tiếng Việt..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="#94A3B8" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Level Filter Chips */}
      <View style={styles.filterRow}>
        {(['ALL', 'A1', 'A2', 'B1', 'B2', 'C1'] as const).map((lvl) => {
          const isSelected = levelFilter === lvl;
          return (
            <TouchableOpacity
              key={lvl}
              onPress={() => {
                triggerHaptic('light');
                setLevelFilter(lvl);
              }}
              style={[styles.filterChip, isSelected && styles.filterChipActive]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  isSelected && styles.filterChipTextActive,
                ]}
              >
                {lvl === 'ALL' ? 'Tất cả' : lvl}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Status Segment Filter (Tất cả / Chưa thuộc / Đã thuộc) */}
      <View style={styles.statusSegment}>
        <TouchableOpacity
          onPress={() => {
            triggerHaptic('light');
            setStatusFilter('ALL');
          }}
          style={[
            styles.segmentBtn,
            statusFilter === 'ALL' && styles.segmentBtnActive,
          ]}
        >
          <Text
            style={[
              styles.segmentText,
              statusFilter === 'ALL' && styles.segmentTextActive,
            ]}
          >
            Tất cả ({vocabulary.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            triggerHaptic('light');
            setStatusFilter('UNMEMORIZED');
          }}
          style={[
            styles.segmentBtn,
            statusFilter === 'UNMEMORIZED' && styles.segmentBtnActive,
          ]}
        >
          <Text
            style={[
              styles.segmentText,
              statusFilter === 'UNMEMORIZED' && styles.segmentTextActive,
            ]}
          >
            Chưa thuộc ({vocabulary.length - memorizedIds.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            triggerHaptic('light');
            setStatusFilter('MEMORIZED');
          }}
          style={[
            styles.segmentBtn,
            statusFilter === 'MEMORIZED' && styles.segmentBtnActive,
          ]}
        >
          <Text
            style={[
              styles.segmentText,
              statusFilter === 'MEMORIZED' && styles.segmentTextActive,
            ]}
          >
            Đã thuộc ({memorizedIds.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Virtualized Word List */}
      <FlatList
        data={filteredWords}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        initialNumToRender={15}
        maxToRenderPerBatch={20}
        windowSize={10}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={48} color="#94A3B8" />
            <Text style={styles.emptyText}>Không tìm thấy từ vựng nào</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 6,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  countBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563EB',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 8,
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
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  filterChip: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  statusSegment: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 3,
    borderRadius: 12,
    gap: 3,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 9,
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  segmentTextActive: {
    color: '#0F172A',
    fontWeight: '800',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  rankBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  rankText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    fontVariant: ['tabular-nums'],
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  levelBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  posBadge: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  posText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  spacer: {
    flex: 1,
  },
  statusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBtnActive: {
    backgroundColor: '#ECFDF5',
  },
  statusBtnInactive: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTextActive: {
    color: '#059669',
  },
  statusTextInactive: {
    color: '#94A3B8',
  },
  wordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  wordInfo: {
    flex: 1,
  },
  wordTitleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  wordText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  audioIconBtn: {
    padding: 4,
  },
  ipaText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  learnNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  learnNowText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  meaningContainer: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 4,
  },
  meaningText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  exampleContainer: {
    marginTop: 6,
    paddingLeft: 4,
  },
  exampleText: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 10,
  },
});
