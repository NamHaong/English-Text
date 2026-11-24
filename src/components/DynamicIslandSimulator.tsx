import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WordItem } from '../types/vocabulary';
import { speakWord } from '../services/speech';
import { triggerHaptic } from '../services/haptics';

interface DynamicIslandProps {
  currentWord: WordItem | null;
  totalMemorized: number;
  onMemorizeCurrent: () => void;
  onNextWord: () => void;
}

export const DynamicIslandSimulator: React.FC<DynamicIslandProps> = ({
  currentWord,
  totalMemorized,
  onMemorizeCurrent,
  onNextWord,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!currentWord) return null;

  const handleToggle = () => {
    triggerHaptic('light');
    setIsExpanded(!isExpanded);
  };

  const handleTick = (e: any) => {
    e.stopPropagation();
    triggerHaptic('success');
    onMemorizeCurrent();
  };

  const handleAudio = (e: any) => {
    e.stopPropagation();
    triggerHaptic('light');
    speakWord(currentWord.word);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'A1': return '#10B981';
      case 'A2': return '#06B6D4';
      case 'B1': return '#F59E0B';
      case 'B2': return '#EC4899';
      case 'C1': return '#8B5CF6';
      default: return '#3B82F6';
    }
  };

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handleToggle}
        style={[
          styles.islandContainer,
          isExpanded ? styles.islandExpanded : styles.islandCompact,
        ]}
      >
        {!isExpanded ? (
          /* COMPACT DYNAMIC ISLAND */
          <View style={styles.compactRow}>
            {/* Left: Indicator & Word */}
            <View style={styles.compactLeft}>
              <View
                style={[
                  styles.levelDot,
                  { backgroundColor: getLevelColor(currentWord.level) },
                ]}
              />
              <Text style={styles.compactWord} numberOfLines={1}>
                {currentWord.word}
              </Text>
            </View>

            {/* Camera cutout simulation hole */}
            <View style={styles.cameraHole} />

            {/* Right: Meaning & Tick action */}
            <View style={styles.compactRight}>
              <Text style={styles.compactMeaning} numberOfLines={1}>
                {currentWord.meaning}
              </Text>
              <TouchableOpacity
                style={styles.compactTickBtn}
                onPress={handleTick}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="checkmark-circle" size={22} color="#10B981" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* EXPANDED DYNAMIC ISLAND */
          <View style={styles.expandedContent}>
            {/* Top row */}
            <View style={styles.expandedTopRow}>
              <View style={styles.wordInfoRow}>
                <View
                  style={[
                    styles.levelBadge,
                    { backgroundColor: getLevelColor(currentWord.level) },
                  ]}
                >
                  <Text style={styles.levelBadgeText}>{currentWord.level}</Text>
                </View>
                <Text style={styles.posText}>{currentWord.pos}</Text>
                <Text style={styles.expandedTitle}>{currentWord.word}</Text>
                <TouchableOpacity onPress={handleAudio} style={styles.speakerBtn}>
                  <Ionicons name="volume-medium" size={18} color="#60A5FA" />
                </TouchableOpacity>
              </View>

              <View style={styles.statsBadge}>
                <Ionicons name="checkmark-done" size={13} color="#10B981" />
                <Text style={styles.statsBadgeText}>{totalMemorized}</Text>
              </View>
            </View>

            {/* Phonetic & Meaning */}
            <Text style={styles.expandedIpa}>{currentWord.ipa}</Text>
            <Text style={styles.expandedMeaning}>{currentWord.meaning}</Text>

            {/* Example sentence */}
            {currentWord.example ? (
              <View style={styles.exampleContainer}>
                <Text style={styles.exampleEn} numberOfLines={2}>
                  &quot;{currentWord.example}&quot;
                </Text>
                {currentWord.exampleVi ? (
                  <Text style={styles.exampleVi} numberOfLines={2}>
                    {currentWord.exampleVi}
                  </Text>
                ) : null}
              </View>
            ) : null}

            {/* Action buttons */}
            <View style={styles.expandedActionsRow}>
              <TouchableOpacity
                style={styles.nextMiniBtn}
                onPress={(e) => {
                  e.stopPropagation();
                  onNextWord();
                }}
              >
                <Ionicons name="arrow-forward" size={15} color="#94A3B8" />
                <Text style={styles.nextMiniText}>Từ tiếp</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.memorizedBtn}
                onPress={handleTick}
              >
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                <Text style={styles.memorizedBtnText}>Đã thuộc từ này ✓</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    zIndex: 999,
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
    marginBottom: 8,
  },
  islandContainer: {
    backgroundColor: '#090A0F',
    borderRadius: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  islandCompact: {
    width: '92%',
    maxWidth: 380,
    height: 48,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  islandExpanded: {
    width: '94%',
    maxWidth: 400,
    padding: 16,
    borderRadius: 28,
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 6,
  },
  levelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  compactWord: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  cameraHole: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#000000',
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  compactRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1.3,
    justifyContent: 'flex-end',
  },
  compactMeaning: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '600',
    marginRight: 8,
    flexShrink: 1,
    textAlign: 'right',
  },
  compactTickBtn: {
    padding: 2,
  },
  expandedContent: {
    width: '100%',
  },
  expandedTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  wordInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  levelBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  posText: {
    color: '#94A3B8',
    fontSize: 12,
    fontStyle: 'italic',
  },
  expandedTitle: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '800',
    marginLeft: 2,
  },
  speakerBtn: {
    backgroundColor: 'rgba(96, 165, 250, 0.15)',
    padding: 6,
    borderRadius: 12,
    marginLeft: 4,
  },
  statsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statsBadgeText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '700',
  },
  expandedIpa: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 2,
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  expandedMeaning: {
    color: '#38BDF8',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  exampleContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#38BDF8',
  },
  exampleEn: {
    color: '#E2E8F0',
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 2,
  },
  exampleVi: {
    color: '#94A3B8',
    fontSize: 12,
  },
  expandedActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  nextMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 4,
  },
  nextMiniText: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600',
  },
  memorizedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  memorizedBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
