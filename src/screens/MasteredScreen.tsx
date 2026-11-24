import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WordItem } from '../types/vocabulary';
import { UnderscoreHint } from '../components/UnderscoreHint';
import { speakWord } from '../services/speech';
import { triggerHaptic } from '../services/haptics';

interface MasteredScreenProps {
  vocabulary: WordItem[];
  memorizedIds: string[];
  onUnmarkMemorized: (id: string) => void;
  onRecordTest: (isCorrect: boolean) => void;
}

const shuffle = <T,>(items: T[]): T[] => {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

/** Lowercase, NFC, strip Vietnamese diacritics so "nha" matches "nhà". */
const foldText = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

export const MasteredScreen: React.FC<MasteredScreenProps> = ({
  vocabulary,
  memorizedIds,
  onUnmarkMemorized,
  onRecordTest,
}) => {
  const [activeTab, setActiveTab] = useState<'test' | 'list'>('test');
  const [testIndex, setTestIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  // Get full list of memorized word items
  const memorizedWords = useMemo(() => {
    const map = new Map(vocabulary.map((w) => [w.id, w]));
    return memorizedIds.map((id) => map.get(id)).filter(Boolean) as WordItem[];
  }, [vocabulary, memorizedIds]);

  // Quiz order is shuffled; reshuffled each time the round loops back
  const testWords = useMemo(
    () => shuffle(memorizedWords),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [memorizedWords, shuffleSeed]
  );

  // Clamp: words can be removed from the list tab, shrinking the array under testIndex
  const safeTestIndex =
    testWords.length === 0 ? 0 : Math.min(testIndex, testWords.length - 1);
  const currentTestWord = testWords[safeTestIndex] || null;

  // Clean and check answer
  const checkAnswer = () => {
    if (!currentTestWord || !userAnswer.trim()) return;

    const normalize = foldText;
    const input = normalize(userAnswer);
    const cleanTarget = normalize(currentTestWord.meaning);

    // Check against full meaning, or split meanings by commas / semicolons / slashes
    const acceptableAnswers = cleanTarget
      .split(/[,;/]/)
      .map((s) => s.trim())
      .filter(Boolean);

    // Exact match with any alternative meaning, or the answer contains one of them.
    // A partial answer only counts when it covers most of an alternative (prevents "a" matching everything).
    const match = acceptableAnswers.some(
      (ans) =>
        ans === input ||
        input.includes(ans) ||
        (input.length >= 3 && ans.includes(input) && input.length >= ans.length * 0.6)
    );

    setIsCorrect(match);
    setIsAnswerChecked(true);

    if (match) {
      triggerHaptic('success');
      onRecordTest(true);
      setScore((prev) => ({ correct: prev.correct + 1, total: prev.total + 1 }));
    } else {
      triggerHaptic('error');
      onRecordTest(false);
      setScore((prev) => ({ correct: prev.correct, total: prev.total + 1 }));
    }
  };

  const nextTestWord = () => {
    triggerHaptic('light');
    setUserAnswer('');
    setIsAnswerChecked(false);
    setIsCorrect(false);
    setRevealed(false);

    if (safeTestIndex < testWords.length - 1) {
      setTestIndex(safeTestIndex + 1);
    } else {
      setTestIndex(0); // loop back with a new random order
      setShuffleSeed((n) => n + 1);
    }
  };

  const handleAudio = () => {
    if (currentTestWord) {
      triggerHaptic('light');
      speakWord(currentTestWord.word);
    }
  };

  // If no words memorized yet
  if (memorizedWords.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mục Đã Thuộc</Text>
          <Text style={styles.headerSubtitle}>Ôn tập & kiểm tra trí nhớ</Text>
        </View>

        <View style={styles.emptyCard}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="checkmark-done-circle" size={56} color="#10B981" />
          </View>
          <Text style={styles.emptyTitle}>Chưa có từ nào đã thuộc</Text>
          <Text style={styles.emptyDesc}>
            Hãy sang màn hình Học Từ Vựng và nhấn nút tích màu xanh [✓ Đã thuộc]
            khi bạn đã nhớ một từ. Từ đó sẽ tự động xuất hiện ở đây để bạn kiểm tra lại!
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* Top Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Mục Đã Thuộc</Text>
            <Text style={styles.headerSubtitle}>
              Đã thuộc {memorizedWords.length} từ vựng
            </Text>
          </View>

          {/* Mode Switcher */}
          <View style={styles.tabSwitchContainer}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'test' && styles.tabBtnActive]}
              onPress={() => {
                triggerHaptic('light');
                setActiveTab('test');
              }}
            >
              <Ionicons
                name="school"
                size={16}
                color={activeTab === 'test' ? '#FFFFFF' : '#64748B'}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'test' && styles.tabBtnTextActive,
                ]}
              >
                Kiểm tra
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'list' && styles.tabBtnActive]}
              onPress={() => {
                triggerHaptic('light');
                setActiveTab('list');
              }}
            >
              <Ionicons
                name="list"
                size={16}
                color={activeTab === 'list' ? '#FFFFFF' : '#64748B'}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'list' && styles.tabBtnTextActive,
                ]}
              >
                Danh sách
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {activeTab === 'test' ? (
          /* TEST / QUIZ MODE */
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.testScroll}
          >
            {/* Score & Progress banner */}
            <View style={styles.quizProgressBar}>
              <View style={styles.quizProgressLeft}>
                <Text style={styles.quizProgressText}>
                  Từ {safeTestIndex + 1} / {memorizedWords.length}
                </Text>
              </View>
              <View style={styles.quizProgressRight}>
                <Ionicons name="trophy" size={15} color="#F59E0B" />
                <Text style={styles.quizScoreText}>
                  Đúng {score.correct}/{score.total}
                </Text>
              </View>
            </View>

            {/* Test Card: Displays ONLY English word */}
            {currentTestWord ? (
              <View style={styles.testCard}>
                <LinearGradient
                  colors={['#FFFFFF', '#F8FAFC']}
                  style={styles.testCardGradient}
                >
                  <View style={styles.testWordHeader}>
                    <View style={styles.testLevelPill}>
                      <Text style={styles.testLevelPillText}>
                        {currentTestWord.level}
                      </Text>
                    </View>
                    <Text style={styles.testPosText}>{currentTestWord.pos}</Text>
                    <TouchableOpacity
                      onPress={handleAudio}
                      style={styles.testAudioBtn}
                    >
                      <Ionicons name="volume-high" size={20} color="#2563EB" />
                    </TouchableOpacity>
                  </View>

                  {/* ONLY English Word Shown */}
                  <Text style={styles.testEnWord}>{currentTestWord.word}</Text>
                  <Text style={styles.testIpaText}>{currentTestWord.ipa}</Text>

                  {/* Underscore Hint matching the Vietnamese length */}
                  <UnderscoreHint
                    targetMeaning={currentTestWord.meaning}
                    userInput={userAnswer}
                  />

                  {/* Input field */}
                  <View style={styles.inputArea}>
                    <TextInput
                      style={[
                        styles.inputField,
                        isAnswerChecked &&
                          (isCorrect ? styles.inputCorrect : styles.inputIncorrect),
                      ]}
                      placeholder="Nhập nghĩa tiếng Việt tại đây..."
                      placeholderTextColor="#94A3B8"
                      value={userAnswer}
                      onChangeText={setUserAnswer}
                      editable={!isAnswerChecked}
                      autoCapitalize="none"
                      autoCorrect={false}
                      onSubmitEditing={checkAnswer}
                    />

                    {!isAnswerChecked ? (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        style={[
                          styles.checkBtn,
                          !userAnswer.trim() && styles.checkBtnDisabled,
                        ]}
                        disabled={!userAnswer.trim()}
                        onPress={checkAnswer}
                      >
                        <Text style={styles.checkBtnText}>Kiểm tra kết quả</Text>
                      </TouchableOpacity>
                    ) : (
                      /* RESULT FEEDBACK */
                      <View style={styles.resultBox}>
                        <View
                          style={[
                            styles.resultHeader,
                            isCorrect ? styles.resultHeaderCorrect : styles.resultHeaderWrong,
                          ]}
                        >
                          <Ionicons
                            name={isCorrect ? 'checkmark-circle' : 'close-circle'}
                            size={24}
                            color={isCorrect ? '#10B981' : '#EF4444'}
                          />
                          <Text
                            style={[
                              styles.resultTitle,
                              { color: isCorrect ? '#065F46' : '#991B1B' },
                            ]}
                          >
                            {isCorrect
                              ? 'Chính xác! Bạn nhớ rất tốt 🎉'
                              : 'Chưa chính xác!'}
                          </Text>
                        </View>

                        {/* Accurate Meaning Display */}
                        <View style={styles.targetMeaningBox}>
                          <Text style={styles.targetMeaningLabel}>Đáp án chuẩn:</Text>
                          <Text style={styles.targetMeaningValue}>
                            {currentTestWord.meaning}
                          </Text>
                        </View>

                        <TouchableOpacity
                          style={styles.nextWordBtn}
                          onPress={nextTestWord}
                        >
                          <Text style={styles.nextWordBtnText}>
                            Kiểm tra từ tiếp theo ➔
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Reveal Button if user is stuck */}
                    {!isAnswerChecked && !revealed ? (
                      <TouchableOpacity
                        style={styles.revealBtn}
                        onPress={() => {
                          triggerHaptic('light');
                          setRevealed(true);
                        }}
                      >
                        <Ionicons name="eye-outline" size={16} color="#64748B" />
                        <Text style={styles.revealBtnText}>Xem gợi ý đáp án</Text>
                      </TouchableOpacity>
                    ) : null}

                    {revealed && !isAnswerChecked ? (
                      <View style={styles.revealedBox}>
                        <Text style={styles.revealedText}>
                          💡 Đáp án: {currentTestWord.meaning}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </LinearGradient>
              </View>
            ) : null}
          </ScrollView>
        ) : (
          /* BROWSE LIST MODE */
          <FlatList
            data={memorizedWords}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listScroll}
            initialNumToRender={15}
            windowSize={7}
            renderItem={({ item }) => (
              <View style={styles.listItem}>
                <View style={styles.listItemLeft}>
                  <View style={styles.listLevelBadge}>
                    <Text style={styles.listLevelText}>{item.level}</Text>
                  </View>
                  <View style={styles.listInfoWrap}>
                    <View style={styles.listWordRow}>
                      <Text style={styles.listWordText}>{item.word}</Text>
                      <Text style={styles.listPosText}>{item.pos}</Text>
                    </View>
                    <Text style={styles.listMeaningText}>{item.meaning}</Text>
                  </View>
                </View>

                <View style={styles.listItemRight}>
                  <TouchableOpacity
                    style={styles.listAudioBtn}
                    onPress={() => {
                      triggerHaptic('light');
                      speakWord(item.word);
                    }}
                  >
                    <Ionicons name="volume-medium" size={20} color="#3B82F6" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.listRemoveBtn}
                    onPress={() => {
                      triggerHaptic('warning');
                      onUnmarkMemorized(item.id);
                    }}
                  >
                    <Ionicons name="trash-outline" size={18} color="#94A3B8" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  tabSwitchContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    padding: 3,
    borderRadius: 14,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 11,
    gap: 4,
  },
  tabBtnActive: {
    backgroundColor: '#2563EB',
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
  },
  testScroll: {
    padding: 16,
    paddingBottom: 50,
  },
  quizProgressBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 6,
  },
  quizProgressLeft: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  quizProgressText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  quizProgressRight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  quizScoreText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B45309',
  },
  testCard: {
    borderRadius: 28,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    overflow: 'hidden',
  },
  testCardGradient: {
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 28,
    alignItems: 'center',
  },
  testWordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  testLevelPill: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  testLevelPillText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 11,
  },
  testPosText: {
    color: '#64748B',
    fontSize: 13,
    fontStyle: 'italic',
  },
  testAudioBtn: {
    backgroundColor: '#EFF6FF',
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  testEnWord: {
    fontSize: 34,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
    marginTop: 4,
  },
  testIpaText: {
    fontSize: 16,
    color: '#64748B',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 4,
    marginBottom: 8,
  },
  inputArea: {
    width: '100%',
    marginTop: 8,
  },
  inputField: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 17,
    color: '#0F172A',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 12,
  },
  inputCorrect: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  inputIncorrect: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  checkBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  checkBtnDisabled: {
    opacity: 0.5,
  },
  checkBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  resultBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  resultHeaderCorrect: {
    backgroundColor: '#D1FAE5',
  },
  resultHeaderWrong: {
    backgroundColor: '#FEE2E2',
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  targetMeaningBox: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  targetMeaningLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 2,
  },
  targetMeaningValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  nextWordBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  nextWordBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  revealBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  revealBtnText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  revealedBox: {
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: 12,
    marginTop: 10,
    alignItems: 'center',
  },
  revealedText: {
    color: '#92400E',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    marginHorizontal: 20,
    marginTop: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 21,
  },
  listScroll: {
    padding: 16,
    paddingBottom: 60,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 18,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  listLevelBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  listLevelText: {
    color: '#2563EB',
    fontWeight: '800',
    fontSize: 11,
  },
  listInfoWrap: {
    flex: 1,
  },
  listWordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  listWordText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  listPosText: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  listMeaningText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  listItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  listAudioBtn: {
    padding: 6,
  },
  listRemoveBtn: {
    padding: 6,
  },
});
