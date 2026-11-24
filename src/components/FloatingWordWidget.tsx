import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WordItem } from '../types/vocabulary';
import { speakWord } from '../services/speech';
import { triggerHaptic } from '../services/haptics';

interface FloatingWordWidgetProps {
  currentWord: WordItem | null;
  isMemorized: boolean;
  onToggleMemorized: () => void;
  onNextWord: () => void;
  visible: boolean;
  onClose: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const FloatingWordWidget: React.FC<FloatingWordWidgetProps> = ({
  currentWord,
  isMemorized,
  onToggleMemorized,
  onNextWord,
  visible,
  onClose,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);

  // Position animated value using state instead of ref to satisfy React Compiler
  const [pan] = useState(
    () => new Animated.ValueXY({ x: SCREEN_WIDTH - 240, y: SCREEN_HEIGHT - 320 })
  );

  // PanResponder to allow dragging the floating card/bubble anywhere on the screen
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          pan.setOffset({
            x: (pan.x as any)._value,
            y: (pan.y as any)._value,
          });
          pan.setValue({ x: 0, y: 0 });
        },
        onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
          useNativeDriver: false,
        }),
        onPanResponderRelease: () => {
          pan.flattenOffset();
        },
      }),
    [pan]
  );

  if (!visible || !currentWord) return null;

  const handleAudio = () => {
    triggerHaptic('light');
    speakWord(currentWord.word);
  };

  const handleTick = () => {
    triggerHaptic('success');
    onToggleMemorized();
  };

  const handleNext = () => {
    triggerHaptic('light');
    onNextWord();
  };

  return (
    <Animated.View
      style={[styles.floatingContainer, pan.getLayout()]}
      {...panResponder.panHandlers}
    >
      {isMinimized ? (
        /* MINIMIZED BUBBLE */
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            triggerHaptic('light');
            setIsMinimized(false);
          }}
          style={styles.minimizedBubble}
        >
          <Ionicons name="sparkles" size={20} color="#FFFFFF" />
          <Text style={styles.minimizedWord} numberOfLines={1}>
            {currentWord.word}
          </Text>
        </TouchableOpacity>
      ) : (
        /* EXPANDED FLOATING CARD */
        <View style={styles.expandedCard}>
          {/* Header Bar */}
          <View style={styles.cardHeader}>
            <View style={styles.dragHandle}>
              <View style={styles.dragBar} />
            </View>

            <View style={styles.cardHeaderActions}>
              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('light');
                  setIsMinimized(true);
                }}
                style={styles.headerIconBtn}
              >
                <Ionicons name="remove" size={18} color="#64748B" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('light');
                  onClose();
                }}
                style={styles.headerIconBtn}
              >
                <Ionicons name="close" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Word & Audio */}
          <View style={styles.wordRow}>
            <View style={styles.wordInfo}>
              <Text style={styles.wordText} numberOfLines={1}>
                {currentWord.word}
              </Text>
              <Text style={styles.ipaText}>{currentWord.ipa}</Text>
            </View>
            <TouchableOpacity onPress={handleAudio} style={styles.audioBtn}>
              <Ionicons name="volume-high" size={18} color="#2563EB" />
            </TouchableOpacity>
          </View>

          {/* Vietnamese Meaning */}
          <View style={styles.meaningBox}>
            <Text style={styles.meaningText} numberOfLines={2}>
              {currentWord.meaning}
            </Text>
          </View>

          {/* Action Footer */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              onPress={handleTick}
              style={[
                styles.actionBtn,
                isMemorized ? styles.actionBtnDone : styles.actionBtnMemorize,
              ]}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isMemorized ? 'checkmark-circle' : 'checkmark-circle-outline'}
                size={16}
                color="#FFFFFF"
              />
              <Text style={styles.actionBtnText}>
                {isMemorized ? 'Đã thuộc' : 'Thuộc'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleNext}
              style={styles.nextBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.nextBtnText}>Từ sau</Text>
              <Ionicons name="arrow-forward" size={14} color="#334155" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    zIndex: 9999,
  },
  minimizedBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1.5,
    borderColor: '#93C5FD',
  },
  minimizedWord: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
    maxWidth: 100,
  },
  expandedCard: {
    width: 230,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  dragHandle: {
    flex: 1,
    height: 16,
    justifyContent: 'center',
  },
  dragBar: {
    width: 32,
    height: 4,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
  },
  cardHeaderActions: {
    flexDirection: 'row',
    gap: 4,
  },
  headerIconBtn: {
    padding: 4,
  },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  wordInfo: {
    flex: 1,
  },
  wordText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  ipaText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  audioBtn: {
    padding: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
  },
  meaningBox: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    marginVertical: 6,
  },
  meaningText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    lineHeight: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 10,
    gap: 4,
  },
  actionBtnMemorize: {
    backgroundColor: '#2563EB',
  },
  actionBtnDone: {
    backgroundColor: '#10B981',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 7,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    gap: 2,
  },
  nextBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
});
