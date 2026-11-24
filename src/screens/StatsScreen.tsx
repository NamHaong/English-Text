import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WordItem, UserProgress } from '../types/vocabulary';
import { triggerHaptic } from '../services/haptics';
import { getAppVersionInfo, checkUpdatesManual } from '../services/updates';

interface StatsScreenProps {
  vocabulary: WordItem[];
  progress: UserProgress;
  onResetProgress: () => void;
}

export const StatsScreen: React.FC<StatsScreenProps> = ({
  vocabulary,
  progress,
  onResetProgress,
}) => {
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const versionInfo = getAppVersionInfo();

  const totalWords = vocabulary.length;
  const memorizedCount = progress.memorizedIds.length;
  const percentMemorized = totalWords > 0 ? ((memorizedCount / totalWords) * 100).toFixed(1) : '0';

  const accuracy =
    progress.totalTested > 0
      ? Math.round((progress.correctTested / progress.totalTested) * 100)
      : 0;

  // Breakdown by CEFR level
  const levels = ['A1', 'A2', 'B1', 'B2', 'C1'] as const;
  const memorizedSet = new Set(progress.memorizedIds);

  const levelStats = levels.map((lvl) => {
    const totalInLevel = vocabulary.filter((w) => w.level === lvl).length;
    const memorizedInLevel = vocabulary.filter(
      (w) => w.level === lvl && memorizedSet.has(w.id)
    ).length;
    const pct = totalInLevel > 0 ? Math.round((memorizedInLevel / totalInLevel) * 100) : 0;
    return {
      level: lvl,
      total: totalInLevel,
      memorized: memorizedInLevel,
      percent: pct,
    };
  });

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

  const handleConfirmReset = () => {
    triggerHaptic('warning');
    Alert.alert(
      'Đặt lại tiến độ?',
      'Hành động này sẽ xóa danh sách các từ đã thuộc và chuỗi học tập.',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Đặt lại', style: 'destructive', onPress: onResetProgress },
      ]
    );
  };

  const handleCheckUpdate = async () => {
    triggerHaptic('light');
    setCheckingUpdate(true);
    try {
      await checkUpdatesManual();
    } finally {
      setCheckingUpdate(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Hồ Sơ & Thống Kê</Text>
          <Text style={styles.headerSubtitle}>
            Hành trình chinh phục Oxford 5000
          </Text>
        </View>

        {/* Hero Progress Card */}
        <View style={styles.heroCardContainer}>
          <LinearGradient
            colors={['#6366F1', '#4F46E5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroTop}>
              <View>
                <Text style={styles.heroLabel}>TỔNG TIẾN ĐỘ THUỘC TỪ</Text>
                <Text style={styles.heroCount}>
                  {memorizedCount} <Text style={styles.heroTotal}>/ {totalWords}</Text>
                </Text>
              </View>

              <View style={styles.heroPercentCircle}>
                <Text style={styles.heroPercentText}>{percentMemorized}%</Text>
              </View>
            </View>

            {/* Progress bar */}
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.min(100, parseFloat(percentMemorized))}%` },
                ]}
              />
            </View>
          </LinearGradient>
        </View>

        {/* 2-Column Stat Cards */}
        <View style={styles.statGrid}>
          {/* Streak Card */}
          <View style={styles.miniCard}>
            <View style={[styles.miniIconBox, { backgroundColor: '#FFEDD5' }]}>
              <Ionicons name="flame" size={24} color="#EA580C" />
            </View>
            <Text style={styles.miniValue}>{progress.streakDays} Ngày</Text>
            <Text style={styles.miniLabel}>Chuỗi học liên tục</Text>
          </View>

          {/* Test Accuracy */}
          <View style={styles.miniCard}>
            <View style={[styles.miniIconBox, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="checkmark-done" size={24} color="#16A34A" />
            </View>
            <Text style={styles.miniValue}>{accuracy}%</Text>
            <Text style={styles.miniLabel}>
              Độ chính xác ({progress.correctTested}/{progress.totalTested})
            </Text>
          </View>
        </View>

        {/* Oxford CEFR Level Breakdown */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Phân Bổ Theo Cấp Độ CEFR</Text>

          {levelStats.map((item) => (
            <View key={item.level} style={styles.levelRow}>
              <View style={styles.levelRowLeft}>
                <View
                  style={[
                    styles.levelPill,
                    { backgroundColor: getLevelColor(item.level) },
                  ]}
                >
                  <Text style={styles.levelPillText}>{item.level}</Text>
                </View>
                <Text style={styles.levelCountText}>
                  {item.memorized} / {item.total} từ
                </Text>
              </View>

              <View style={styles.levelRowRight}>
                <View style={styles.levelBarTrack}>
                  <View
                    style={[
                      styles.levelBarFill,
                      {
                        width: `${item.percent}%`,
                        backgroundColor: getLevelColor(item.level),
                      },
                    ]}
                  />
                </View>
                <Text style={styles.levelPctText}>{item.percent}%</Text>
              </View>
            </View>
          ))}
        </View>

        {/* OTA Update Card */}
        <View style={styles.updateCard}>
          <View style={styles.updateCardTop}>
            <View style={styles.updateIconBox}>
              <Ionicons name="cloud-download-outline" size={24} color="#0284C7" />
            </View>
            <View style={styles.updateInfoBox}>
              <Text style={styles.updateTitle}>Cập Nhật Trực Tuyến (OTA)</Text>
              <Text style={styles.updateSubtitle}>
                Phiên bản: v{versionInfo.version} • Kênh: {versionInfo.channel}
              </Text>
            </View>
          </View>

          <Text style={styles.updateDesc}>
            Mỗi khi cập nhật, mã nguồn mới sẽ được đẩy trực tiếp lên đám mây Expo và nâng số phiên bản. Ứng dụng tự động tải bản mới nhất khi khởi động!
          </Text>

          <TouchableOpacity
            style={styles.checkUpdateBtn}
            onPress={handleCheckUpdate}
            disabled={checkingUpdate}
            activeOpacity={0.8}
          >
            {checkingUpdate ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="sync-outline" size={18} color="#FFFFFF" />
                <Text style={styles.checkUpdateBtnText}>Kiểm tra bản cập nhật mới</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Feature Explanations */}
        <View style={styles.featureInfoCard}>
          <View style={styles.featureItem}>
            <Ionicons name="hardware-chip-outline" size={22} color="#4F46E5" />
            <View style={styles.featureTextWrap}>
              <Text style={styles.featureTitle}>Dynamic Island & Live Activities</Text>
              <Text style={styles.featureDesc}>
                Hiển thị trực tiếp trên phần khuyết Dynamic Island của camera iPhone thật để bạn học thuộc từ vựng mọi lúc mọi nơi ngay cả khi đang dùng ứng dụng khác.
              </Text>
            </View>
          </View>

          <View style={styles.featureDivider} />

          <View style={styles.featureItem}>
            <Ionicons name="checkbox-outline" size={22} color="#10B981" />
            <View style={styles.featureTextWrap}>
              <Text style={styles.featureTitle}>Chế Độ Ôn Lại Với Gợi Ý Gạch Dưới</Text>
              <Text style={styles.featureDesc}>
                Kiểm tra lại từ đã thuộc bằng cách gõ nghĩa tiếng Việt với số lượng chữ cái tương ứng dấu gạch dưới, hỗ trợ gõ tiếng Việt có dấu mượt mà.
              </Text>
            </View>
          </View>
        </View>

        {/* Reset button */}
        <TouchableOpacity
          style={styles.resetBtn}
          onPress={handleConfirmReset}
        >
          <Ionicons name="refresh-outline" size={18} color="#EF4444" />
          <Text style={styles.resetBtnText}>Đặt lại toàn bộ tiến độ</Text>
        </TouchableOpacity>
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
    paddingBottom: 50,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
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
    marginTop: 2,
  },
  heroCardContainer: {
    paddingHorizontal: 16,
    marginVertical: 10,
  },
  heroCard: {
    borderRadius: 24,
    padding: 22,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#C7D2FE',
    letterSpacing: 0.8,
  },
  heroCount: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2,
  },
  heroTotal: {
    fontSize: 18,
    fontWeight: '600',
    color: '#A5B4FC',
  },
  heroPercentCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  heroPercentText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  statGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginVertical: 6,
  },
  miniCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  miniIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  miniValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 2,
  },
  miniLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 16,
  },
  levelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  levelRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: 130,
  },
  levelPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  levelPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  levelCountText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  levelRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  levelBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  levelBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  levelPctText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    width: 36,
    textAlign: 'right',
  },
  updateCard: {
    backgroundColor: '#F0F9FF',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  updateCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  updateIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  updateInfoBox: {
    flex: 1,
  },
  updateTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0369A1',
  },
  updateSubtitle: {
    fontSize: 12,
    color: '#0284C7',
    fontWeight: '600',
    marginTop: 2,
  },
  updateDesc: {
    fontSize: 12,
    color: '#0369A1',
    lineHeight: 18,
    marginBottom: 14,
  },
  checkUpdateBtn: {
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  checkUpdateBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  featureInfoCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  featureItem: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  featureTextWrap: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  featureDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    gap: 6,
  },
  resetBtnText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 13,
  },
});
