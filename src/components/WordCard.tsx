import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { WordItem } from '../types/vocabulary';
import { speakWord } from '../services/speech';
import { triggerHaptic } from '../services/haptics';

interface WordCardProps {
  word: WordItem;
  isMemorized: boolean;
  onToggleMemorized: () => void;
  onNext: () => void;
  onPrev: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  currentIndex: number;
  totalCount: number;
}

export const WordCard: React.FC<WordCardProps> = ({
  word,
  isMemorized,
  onToggleMemorized,
  onNext,
  onPrev,
  hasPrev,
  hasNext,
  currentIndex,
  totalCount,
}) => {
  const handlePlayAudio = () => {
    triggerHaptic('light');
    speakWord(word.word);
  };

  const handleTick = () => {
    triggerHaptic('success');
    onToggleMemorized();
  };

  const getGradientColors = (level: string): readonly [string, string, ...string[]] => {
    switch (level) {
      case 'A1':
        return ['#ECFDF5', '#D1FAE5'] as const;
      case 'A2':
        return ['#EFF6FF', '#DBEAFE'] as const;
      case 'B1':
        return ['#FFFBEB', '#FEF3C7'] as const;
      case 'B2':
        return ['#FDF2F8', '#FCE7F3'] as const;
      case 'C1':
        return ['#F5F3FF', '#EDE9FE'] as const;
      default:
        return ['#F8FAFC', '#F1F5F9'] as const;
    }
  };

  const getThemeColor = (level: string) => {
    switch (level) {
      case 'A1': return '#059669';
      case 'A2': return '#2563EB';
      case 'B1': return '#D97706';
      case 'B2': return '#DB2777';
      case 'C1': return '#7C3AED';
      default: return '#475569';
    }
  };

  const themeColor = getThemeColor(word.level);

  return (
    <View style={styles.cardContainer}>
      <LinearGradient
        colors={getGradientColors(word.level)}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        {/* Top Header inside Card */}
        <View style={styles.cardHeader}>
          <View style={styles.badgeRow}>
            <View style={[styles.levelTag, { backgroundColor: themeColor }]}>
              <Text style={styles.levelTagText}>{word.level}</Text>
            </View>
            <View style={styles.posTag}>
              <Text style={[styles.posTagText, { color: themeColor }]}>
                {word.pos}
              </Text>
            </View>
          </View>

          <Text style={styles.counterText}>
            {currentIndex + 1} / {totalCount}
          </Text>
        </View>

        {/* Word and Audio */}
        <View style={styles.wordSection}>
          <View style={styles.wordTitleRow}>
            <Text style={styles.wordText}>{word.word}</Text>
            <TouchableOpacity
              onPress={handlePlayAudio}
              style={[styles.audioButton, { backgroundColor: themeColor + '20' }]}
              activeOpacity={0.7}
            >
              <Ionicons name="volume-high" size={24} color={themeColor} />
            </TouchableOpacity>
          </View>

          <Text style={styles.ipaText}>{word.ipa}</Text>
        </View>

        {/* Meaning in Vietnamese */}
        <View style={styles.meaningBox}>
          <Text style={styles.meaningLabel}>Ý NGHĨA TIẾNG VIỆT</Text>
          <Text style={[styles.meaningText, { color: themeColor }]}>
            {word.meaning}
          </Text>
        </View>

        {/* Example Sentence */}
        {word.example ? (
          <View style={styles.exampleCard}>
            <View style={styles.exampleHeader}>
              <Ionicons name="bulb-outline" size={16} color="#64748B" />
              <Text style={styles.exampleLabel}>Ví dụ mẫu:</Text>
            </View>
            <Text style={styles.exampleEnText}>&quot;{word.example}&quot;</Text>
            {word.exampleVi ? (
              <Text style={styles.exampleViText}>👉 {word.exampleVi}</Text>
            ) : null}
          </View>
        ) : null}

        {/* Big Cute Tick / Memorized Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleTick}
          style={[
            styles.tickButton,
            isMemorized ? styles.tickButtonActive : styles.tickButtonInactive,
          ]}
        >
          <LinearGradient
            colors={
              isMemorized
                ? (['#10B981', '#059669'] as const)
                : (['#3B82F6', '#2563EB'] as const)
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.tickGradient}
          >
            <Ionicons
              name={isMemorized ? 'checkmark-circle' : 'checkmark-circle-outline'}
              size={24}
              color="#FFFFFF"
            />
            <Text style={styles.tickButtonText}>
              {isMemorized ? 'Đã thuộc từ này ✓' : 'Đánh dấu đã thuộc'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Previous & Next Controls */}
        <View style={styles.navRow}>
          <TouchableOpacity
            style={[styles.navBtn, !hasPrev && styles.navBtnDisabled]}
            disabled={!hasPrev}
            onPress={() => {
              triggerHaptic('light');
              onPrev();
            }}
          >
            <Ionicons
              name="chevron-back"
              size={20}
              color={hasPrev ? '#334155' : '#CBD5E1'}
            />
            <Text
              style={[
                styles.navBtnText,
                !hasPrev && { color: '#CBD5E1' },
              ]}
            >
              Từ trước
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navBtn, !hasNext && styles.navBtnDisabled]}
            disabled={!hasNext}
            onPress={() => {
              triggerHaptic('light');
              onNext();
            }}
          >
            <Text
              style={[
                styles.navBtnText,
                !hasNext && { color: '#CBD5E1' },
              ]}
            >
              Từ tiếp theo
            </Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={hasNext ? '#334155' : '#CBD5E1'}
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    paddingHorizontal: 16,
    marginVertical: 10,
  },
  cardGradient: {
    borderRadius: 28,
    padding: 22,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  levelTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  levelTagText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  posTag: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  posTagText: {
    fontWeight: '700',
    fontSize: 12,
  },
  counterText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    fontVariant: ['tabular-nums'],
  },
  wordSection: {
    marginBottom: 16,
  },
  wordTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wordText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  audioButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ipaText: {
    fontSize: 17,
    color: '#64748B',
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '500',
  },
  meaningBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  meaningLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  meaningText: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
  },
  exampleCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#94A3B8',
  },
  exampleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  exampleLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  exampleEnText: {
    fontSize: 14,
    color: '#1E293B',
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: 4,
  },
  exampleViText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  tickButton: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  tickButtonActive: {
    shadowColor: '#10B981',
  },
  tickButtonInactive: {},
  tickGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 10,
  },
  tickButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    gap: 4,
  },
  navBtnDisabled: {
    opacity: 0.5,
  },
  navBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
});
