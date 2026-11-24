import React, { useState, useMemo, useCallback } from 'react';
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
    .replace(/[^\w\s]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

export const MasteredScreen: React.FC<MasteredScreenProps> = ({
  vocabulary,
  memorizedIds,
  onUnmarkMemorized,
  onRecordTest,
}) => {
  const [activeTab, setActiveTab] = useState<'test' | 'game' | 'list'>('test');

  // Master memorized word list
  const memorizedWords = useMemo(() => {
    const map = new Map(vocabulary.map((w) => [w.id, w]));
    return memorizedIds.map((id) => map.get(id)).filter(Boolean) as WordItem[];
  }, [vocabulary, memorizedIds]);

  // ==========================================
  // 1. QUIZ / TEST MODE STATE (STABLE QUEUE)
  // ==========================================
  const [quizQueue, setQuizQueue] = useState<WordItem[]>(() => shuffle(memorizedWords));
  const [testIndex, setTestIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  // Use quizQueue if populated, fallback to memorizedWords
  const activeQuizList = quizQueue.length > 0 ? quizQueue : memorizedWords;
  const safeTestIndex = Math.min(testIndex, Math.max(0, activeQuizList.length - 1));
  const currentTestWord = activeQuizList[safeTestIndex] || null;

  const handleAudio = (wordText?: string) => {
    const w = wordText || currentTestWord?.word;
    if (w) {
      triggerHaptic('light');
      speakWord(w);
    }
  };

  const checkAnswer = () => {
    if (!currentTestWord || !userAnswer.trim()) return;

    const inputRaw = userAnswer.trim().toLowerCase();
    const inputFolded = foldText(userAnswer);

    const targetRaw = currentTestWord.meaning.toLowerCase();
    const targetFolded = foldText(currentTestWord.meaning);

    // Split target into alternative acceptable sub-meanings (by comma, semicolon, slash)
    const rawOptions = targetRaw.split(/[,;/]/).map((s) => s.trim()).filter(Boolean);
    const foldedOptions = targetFolded.split(/[,;/]/).map((s) => foldText(s)).filter(Boolean);

    // Check exact or folded match
    const match =
      rawOptions.some((opt) => opt === inputRaw || inputRaw.includes(opt) || (inputRaw.length >= 3 && opt.includes(inputRaw))) ||
      foldedOptions.some((opt) => opt === inputFolded || inputFolded.includes(opt) || (inputFolded.length >= 3 && opt.includes(inputFolded))) ||
      inputFolded === targetFolded;

    setIsCorrect(match);
    setIsAnswerChecked(true);

    if (match) {
      triggerHaptic('success');
      onRecordTest(true);
      setScore((prev) => ({ correct: prev.correct + 1, total: prev.total + 1 }));
      speakWord(currentTestWord.word);
    } else {
      triggerHaptic('error');
      onRecordTest(false);
      setScore((prev) => ({ correct: prev.correct, total: prev.total + 1 }));
    }
  };

  const retryCurrentWord = () => {
    triggerHaptic('light');
    setUserAnswer('');
    setIsAnswerChecked(false);
    setIsCorrect(false);
  };

  const nextTestWord = () => {
    triggerHaptic('light');
    setUserAnswer('');
    setIsAnswerChecked(false);
    setIsCorrect(false);

    if (testIndex < quizQueue.length - 1) {
      setTestIndex(testIndex + 1);
    } else {
      // Finished round: reshuffle new round
      setQuizQueue(shuffle(memorizedWords));
      setTestIndex(0);
    }
  };

  // ==========================================
  // 2. WORD MATCHING MINI-GAME STATE
  // ==========================================
  // 10 pairs: Left Column = Vietnamese, Right Column = English
  interface MatchingItem {
    id: string; // word id
    text: string;
    wordId: string;
    isMatched: boolean;
  }

  const [gameEnglishList, setGameEnglishList] = useState<MatchingItem[]>(() => {
    const samplePool = shuffle(memorizedWords).slice(0, 10);
    return shuffle(
      samplePool.map((item) => ({
        id: `en-${item.id}`,
        text: item.word,
        wordId: item.id,
        isMatched: false,
      }))
    );
  });
  const [gameVietnameseList, setGameVietnameseList] = useState<MatchingItem[]>(() => {
    const samplePool = shuffle(memorizedWords).slice(0, 10);
    return shuffle(
      samplePool.map((item) => ({
        id: `vi-${item.id}`,
        text: item.meaning.split(/[,;/]/)[0].trim(),
        wordId: item.id,
        isMatched: false,
      }))
    );
  });
  const [selectedEnglishId, setSelectedEnglishId] = useState<string | null>(null);
  const [selectedVietnameseId, setSelectedVietnameseId] = useState<string | null>(null);
  const [matchedPairsCount, setMatchedPairsCount] = useState(0);
  const [gameMistakes, setGameMistakes] = useState(0);
  const [isGameCompleted, setIsGameCompleted] = useState(false);
  const [wrongPair, setWrongPair] = useState<{ enId: string; viId: string } | null>(null);

  // Start new matching game round
  const startNewGame = useCallback(() => {
    if (memorizedWords.length === 0) return;

    // Pick up to 10 random words from memorized
    const samplePool = shuffle(memorizedWords).slice(0, 10);

    const enItems: MatchingItem[] = samplePool.map((item) => ({
      id: `en-${item.id}`,
      text: item.word,
      wordId: item.id,
      isMatched: false,
    }));

    const viItems: MatchingItem[] = samplePool.map((item) => ({
      id: `vi-${item.id}`,
      text: item.meaning.split(/[,;/]/)[0].trim(),
      wordId: item.id,
      isMatched: false,
    }));

    setGameEnglishList(shuffle(enItems));
    setGameVietnameseList(shuffle(viItems));
    setSelectedEnglishId(null);
    setSelectedVietnameseId(null);
    setMatchedPairsCount(0);
    setGameMistakes(0);
    setIsGameCompleted(false);
    setWrongPair(null);
  }, [memorizedWords]);

  // Handle tap on English item (Right column)
  const handleSelectEnglish = (item: MatchingItem) => {
    if (item.isMatched) return;
    triggerHaptic('light');
    speakWord(item.text);

    if (selectedVietnameseId) {
      // Evaluate match with currently selected Vietnamese item
      evaluatePair(item.wordId, selectedVietnameseId, item.id);
    } else {
      setSelectedEnglishId(item.id);
    }
  };

  // Handle tap on Vietnamese item (Left column)
  const handleSelectVietnamese = (item: MatchingItem) => {
    if (item.isMatched) return;
    triggerHaptic('light');

    if (selectedEnglishId) {
      // Find the English item's wordId
      const enItem = gameEnglishList.find((x) => x.id === selectedEnglishId);
      if (enItem) {
        evaluatePair(enItem.wordId, item.wordId, selectedEnglishId, item.id);
      }
    } else {
      setSelectedVietnameseId(item.wordId);
    }
  };

  // Check if chosen pair matches
  const evaluatePair = (
    enWordId: string,
    viWordId: string,
    enIdParam?: string,
    viIdParam?: string
  ) => {
    const enId = enIdParam || selectedEnglishId || `en-${enWordId}`;
    const isMatch = enWordId === viWordId;

    if (isMatch) {
      triggerHaptic('success');
      setGameEnglishList((prev) =>
        prev.map((it) => (it.wordId === enWordId ? { ...it, isMatched: true } : it))
      );
      setGameVietnameseList((prev) =>
        prev.map((it) => (it.wordId === viWordId ? { ...it, isMatched: true } : it))
      );

      const nextMatched = matchedPairsCount + 1;
      setMatchedPairsCount(nextMatched);
      setSelectedEnglishId(null);
      setSelectedVietnameseId(null);
      setWrongPair(null);

      // Check if finished
      if (nextMatched >= gameEnglishList.length) {
        setIsGameCompleted(true);
        triggerHaptic('warning');
      }
    } else {
      triggerHaptic('error');
      setGameMistakes((n) => n + 1);
      setWrongPair({ enId, viId: `vi-${viWordId}` });
      setTimeout(() => {
        setWrongPair(null);
        setSelectedEnglishId(null);
        setSelectedVietnameseId(null);
      }, 400);
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
            Hãy sang màn hình Học Từ và nhấn dấu tích [✓ Đã thuộc] khi bạn nhớ một từ.
            Các từ đã thuộc sẽ tập trung ở đây để bạn kiểm tra trí nhớ và chơi trò nối chữ!
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
              {memorizedWords.length} từ đã chinh phục
            </Text>
          </View>

          {/* Mode Switcher: Kiểm tra | Trò chơi | Danh sách */}
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
                size={15}
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
              style={[styles.tabBtn, activeTab === 'game' && styles.tabBtnActive]}
              onPress={() => {
                triggerHaptic('light');
                setActiveTab('game');
                if (gameEnglishList.length === 0) {
                  startNewGame();
                }
              }}
            >
              <Ionicons
                name="game-controller"
                size={15}
                color={activeTab === 'game' ? '#FFFFFF' : '#64748B'}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'game' && styles.tabBtnTextActive,
                ]}
              >
                Nối chữ
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
                size={15}
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

        {/* ==================================================== */}
        {/* TAB 1: TEST / QUIZ MODE                              */}
        {/* ==================================================== */}
        {activeTab === 'test' && (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.testScroll}
          >
            {/* Score & Progress banner */}
            <View style={styles.quizProgressBar}>
              <View style={styles.quizProgressLeft}>
                <Text style={styles.quizProgressText}>
                  Từ {testIndex + 1} / {quizQueue.length}
                </Text>
              </View>
              <View style={styles.quizProgressRight}>
                <Ionicons name="trophy" size={15} color="#F59E0B" />
                <Text style={styles.quizScoreText}>
                  Đúng {score.correct}/{score.total}
                </Text>
              </View>
            </View>

            {/* Test Card */}
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
                      onPress={() => handleAudio()}
                      style={styles.testAudioBtn}
                    >
                      <Ionicons name="volume-high" size={20} color="#2563EB" />
                    </TouchableOpacity>
                  </View>

                  {/* ONLY English Word Shown */}
                  <Text style={styles.testEnWord}>{currentTestWord.word}</Text>
                  <Text style={styles.testIpaText}>{currentTestWord.ipa}</Text>

                  {/* Underscore Hint */}
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
                      /* RESULT NOTIFICATION & FEEDBACK */
                      <View style={styles.resultBox}>
                        <View
                          style={[
                            styles.resultHeader,
                            isCorrect ? styles.resultHeaderCorrect : styles.resultHeaderWrong,
                          ]}
                        >
                          <Ionicons
                            name={isCorrect ? 'checkmark-circle' : 'close-circle'}
                            size={28}
                            color={isCorrect ? '#10B981' : '#EF4444'}
                          />
                          <View style={styles.resultHeaderTexts}>
                            <Text
                              style={[
                                styles.resultTitle,
                                { color: isCorrect ? '#065F46' : '#991B1B' },
                              ]}
                            >
                              {isCorrect
                                ? 'CHÍNH XÁC XUẤT SẮC! 🎉'
                                : 'CHƯA CHÍNH XÁC RỒI! 💪'}
                            </Text>
                            <Text
                              style={[
                                styles.resultSubTitle,
                                { color: isCorrect ? '#047857' : '#B91C1C' },
                              ]}
                            >
                              {isCorrect
                                ? 'Bạn đã ghi nhớ rất chuẩn nghĩa của từ này.'
                                : 'Đừng nản lòng! Hãy xem đáp án chuẩn và ghi nhớ nhé.'}
                            </Text>
                          </View>
                        </View>

                        {/* Comparison Box */}
                        <View style={styles.comparisonBox}>
                          <View style={styles.comparisonRow}>
                            <Text style={styles.comparisonLabel}>
                              {isCorrect ? '✅ Bạn đã trả lời:' : '❌ Bạn đã nhập:'}
                            </Text>
                            <Text
                              style={[
                                styles.comparisonUserText,
                                isCorrect
                                  ? styles.comparisonUserCorrect
                                  : styles.comparisonUserWrong,
                              ]}
                            >
                              {`"${userAnswer.trim()}"`}
                            </Text>
                          </View>

                          <View style={styles.comparisonDivider} />

                          <View style={styles.comparisonRow}>
                            <Text style={styles.comparisonLabel}>📖 Đáp án chuẩn:</Text>
                            <Text style={styles.comparisonTargetText}>
                              {currentTestWord.meaning}
                            </Text>
                          </View>
                        </View>

                        {/* Action buttons */}
                        <View style={styles.resultActionRow}>
                          {!isCorrect ? (
                            <TouchableOpacity
                              style={styles.retryBtn}
                              onPress={retryCurrentWord}
                            >
                              <Ionicons name="refresh" size={18} color="#475569" />
                              <Text style={styles.retryBtnText}>Thử gõ lại</Text>
                            </TouchableOpacity>
                          ) : null}

                          <TouchableOpacity
                            style={styles.nextWordBtn}
                            onPress={nextTestWord}
                          >
                            <Text style={styles.nextWordBtnText}>
                              {testIndex < quizQueue.length - 1
                                ? 'Từ tiếp theo →'
                                : 'Vòng mới ↺'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                </LinearGradient>
              </View>
            ) : null}
          </ScrollView>
        )}

        {/* ==================================================== */}
        {/* TAB 2: MINI GAME - WORD MATCHING (TRÒ CHƠI NỐI CHỮ) */}
        {/* ==================================================== */}
        {activeTab === 'game' && (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.gameContainer}
          >
            {/* Game Info Bar */}
            <View style={styles.gameInfoBar}>
              <View>
                <Text style={styles.gameTitle}>🎮 Nối Từ Tiếng Anh & Nghĩa</Text>
                <Text style={styles.gameSubtitle}>
                  Chọn 1 từ Tiếng Anh (Cột Phải) và nối với Nghĩa Tiếng Việt (Cột Trái)
                </Text>
              </View>

              <TouchableOpacity
                style={styles.gameRestartBtn}
                onPress={startNewGame}
                activeOpacity={0.7}
              >
                <Ionicons name="shuffle" size={16} color="#0284C7" />
                <Text style={styles.gameRestartBtnText}>10 từ mới</Text>
              </TouchableOpacity>
            </View>

            {/* Score & Progress pills */}
            <View style={styles.gameScoreRow}>
              <View style={styles.gameScorePill}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={styles.gameScorePillText}>
                  Đã nối: {matchedPairsCount} / {gameEnglishList.length}
                </Text>
              </View>

              <View style={styles.gameScorePill}>
                <Ionicons name="alert-circle" size={16} color="#F59E0B" />
                <Text style={styles.gameScorePillText}>
                  Sai: {gameMistakes}
                </Text>
              </View>
            </View>

            {/* Victory banner when completed */}
            {isGameCompleted ? (
              <View style={styles.victoryCard}>
                <LinearGradient
                  colors={['#ECFDF5', '#D1FAE5']}
                  style={styles.victoryGradient}
                >
                  <Ionicons name="trophy" size={48} color="#F59E0B" />
                  <Text style={styles.victoryTitle}>🎉 XUẤT SẮC! HOÀN THÀNH!</Text>
                  <Text style={styles.victorySubtitle}>
                    Bạn đã nối đúng toàn bộ {gameEnglishList.length} cặp từ vựng!
                  </Text>
                  <TouchableOpacity
                    style={styles.victoryBtn}
                    onPress={startNewGame}
                  >
                    <Text style={styles.victoryBtnText}>Chơi 10 từ khác</Text>
                    <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            ) : null}

            {/* Two Column Grid */}
            <View style={styles.gameColumnsRow}>
              {/* Left Column: Vietnamese Meanings */}
              <View style={styles.columnBox}>
                <View style={styles.columnHeader}>
                  <Text style={styles.columnHeaderText}>🇻🇳 Cột Trái (Tiếng Việt)</Text>
                </View>

                {gameVietnameseList.map((item) => {
                  const isSelected = selectedVietnameseId === item.wordId;
                  const isWrong = wrongPair?.viId === `vi-${item.wordId}`;

                  return (
                    <TouchableOpacity
                      key={item.id}
                      activeOpacity={0.7}
                      disabled={item.isMatched}
                      onPress={() => handleSelectVietnamese(item)}
                      style={[
                        styles.matchCard,
                        styles.matchCardVi,
                        isSelected && styles.matchCardSelected,
                        item.isMatched && styles.matchCardDone,
                        isWrong && styles.matchCardWrong,
                      ]}
                    >
                      <Text
                        style={[
                          styles.matchCardText,
                          isSelected && styles.matchCardTextSelected,
                          item.isMatched && styles.matchCardTextDone,
                        ]}
                        numberOfLines={2}
                      >
                        {item.text}
                      </Text>
                      {item.isMatched && (
                        <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Right Column: English Words */}
              <View style={styles.columnBox}>
                <View style={styles.columnHeader}>
                  <Text style={styles.columnHeaderText}>🇬🇧 Cột Phải (Tiếng Anh)</Text>
                </View>

                {gameEnglishList.map((item) => {
                  const isSelected = selectedEnglishId === item.id;
                  const isWrong = wrongPair?.enId === item.id;

                  return (
                    <TouchableOpacity
                      key={item.id}
                      activeOpacity={0.7}
                      disabled={item.isMatched}
                      onPress={() => handleSelectEnglish(item)}
                      style={[
                        styles.matchCard,
                        styles.matchCardEn,
                        isSelected && styles.matchCardSelected,
                        item.isMatched && styles.matchCardDone,
                        isWrong && styles.matchCardWrong,
                      ]}
                    >
                      <Text
                        style={[
                          styles.matchCardText,
                          styles.matchCardTextEn,
                          isSelected && styles.matchCardTextSelected,
                          item.isMatched && styles.matchCardTextDone,
                        ]}
                      >
                        {item.text}
                      </Text>
                      {item.isMatched ? (
                        <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                      ) : (
                        <TouchableOpacity
                          onPress={() => handleAudio(item.text)}
                          style={{ padding: 2 }}
                        >
                          <Ionicons name="volume-high" size={15} color="#2563EB" />
                        </TouchableOpacity>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        )}

        {/* ==================================================== */}
        {/* TAB 3: LIST OF MEMORIZED WORDS                       */}
        {/* ==================================================== */}
        {activeTab === 'list' && (
          <FlatList
            data={memorizedWords}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            renderItem={({ item }) => (
              <View style={styles.listCard}>
                <View style={styles.listLeft}>
                  <View style={styles.listWordRow}>
                    <Text style={styles.listWordText}>{item.word}</Text>
                    <View style={styles.listLevelTag}>
                      <Text style={styles.listLevelText}>{item.level}</Text>
                    </View>
                    <Text style={styles.listPosText}>{item.pos}</Text>
                    <TouchableOpacity onPress={() => handleAudio(item.word)}>
                      <Ionicons name="volume-high" size={18} color="#2563EB" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.listIpaText}>{item.ipa}</Text>
                  <Text style={styles.listMeaningText}>{item.meaning}</Text>
                </View>

                <TouchableOpacity
                  style={styles.unmarkBtn}
                  onPress={() => {
                    triggerHaptic('light');
                    onUnmarkMemorized(item.id);
                  }}
                >
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
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
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
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
  tabSwitchContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 3,
    gap: 2,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 9,
    gap: 4,
  },
  tabBtnActive: {
    backgroundColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  tabBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 30,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  testScroll: {
    paddingBottom: 40,
  },
  quizProgressBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quizProgressLeft: {},
  quizProgressText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  quizProgressRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quizScoreText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F59E0B',
  },
  testCard: {
    marginHorizontal: 16,
    borderRadius: 24,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  testCardGradient: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  testWordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  testLevelPill: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  testLevelPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  testPosText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    flex: 1,
  },
  testAudioBtn: {
    padding: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
  },
  testEnWord: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  testIpaText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  inputArea: {
    marginTop: 10,
  },
  inputField: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '700',
    textAlign: 'center',
  },
  inputCorrect: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  inputIncorrect: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  checkBtn: {
    backgroundColor: '#2563EB',
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  checkBtnDisabled: {
    opacity: 0.5,
  },
  checkBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  resultBox: {
    marginTop: 14,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    gap: 10,
    marginBottom: 12,
  },
  resultHeaderCorrect: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  resultHeaderWrong: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  resultHeaderTexts: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  resultSubTitle: {
    fontSize: 11,
    marginTop: 2,
  },
  comparisonBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  comparisonLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '700',
  },
  comparisonUserText: {
    fontSize: 14,
    fontWeight: '800',
  },
  comparisonUserCorrect: {
    color: '#059669',
  },
  comparisonUserWrong: {
    color: '#DC2626',
    textDecorationLine: 'line-through',
  },
  comparisonDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 8,
  },
  comparisonTargetText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  resultActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  retryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    gap: 6,
  },
  retryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  nextWordBtn: {
    flex: 2,
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextWordBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  // GAME STYLES
  gameContainer: {
    paddingHorizontal: 12,
    paddingBottom: 40,
  },
  gameInfoBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    marginTop: 6,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  gameTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  gameSubtitle: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
    maxWidth: 240,
  },
  gameRestartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  gameRestartBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  gameScoreRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  gameScorePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  gameScorePillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  victoryCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 12,
  },
  victoryGradient: {
    alignItems: 'center',
    padding: 20,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 20,
  },
  victoryTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#065F46',
    marginTop: 8,
  },
  victorySubtitle: {
    fontSize: 13,
    color: '#047857',
    marginTop: 2,
    marginBottom: 14,
  },
  victoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 6,
  },
  victoryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  gameColumnsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  columnBox: {
    flex: 1,
  },
  columnHeader: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 6,
  },
  columnHeaderText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
  },
  matchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 12,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    minHeight: 52,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  matchCardVi: {
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  matchCardEn: {
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  matchCardSelected: {
    borderColor: '#0284C7',
    backgroundColor: '#F0F9FF',
    transform: [{ scale: 1.02 }],
  },
  matchCardDone: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
    opacity: 0.85,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  matchCardWrong: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  matchCardText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    lineHeight: 16,
  },
  matchCardTextEn: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  matchCardTextSelected: {
    color: '#0284C7',
    fontWeight: '900',
  },
  matchCardTextDone: {
    color: '#059669',
  },

  // LIST STYLES
  listContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  listLeft: {
    flex: 1,
  },
  listWordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  listWordText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  listLevelTag: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  listLevelText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  listPosText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  listIpaText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  listMeaningText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '700',
    marginTop: 4,
  },
  unmarkBtn: {
    padding: 8,
    marginLeft: 8,
  },
});
