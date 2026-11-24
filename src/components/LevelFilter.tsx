import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { CEFRLevel } from '../types/vocabulary';
import { triggerHaptic } from '../services/haptics';

interface LevelFilterProps {
  selectedLevel: CEFRLevel | 'ALL';
  onSelectLevel: (level: CEFRLevel | 'ALL') => void;
  counts: Record<string, number>;
}

export const LevelFilter: React.FC<LevelFilterProps> = ({
  selectedLevel,
  onSelectLevel,
  counts,
}) => {
  const levels: { key: CEFRLevel | 'ALL'; label: string; color: string }[] = [
    { key: 'ALL', label: 'Tất cả', color: '#6366F1' },
    { key: 'A1', label: 'A1 Cơ bản', color: '#10B981' },
    { key: 'A2', label: 'A2 Sơ cấp', color: '#06B6D4' },
    { key: 'B1', label: 'B1 Trung cấp', color: '#F59E0B' },
    { key: 'B2', label: 'B2 Nâng cao', color: '#EC4899' },
    { key: 'C1', label: 'C1 Thành thạo', color: '#8B5CF6' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {levels.map((item) => {
          const isSelected = selectedLevel === item.key;
          const count = counts[item.key] || 0;

          return (
            <TouchableOpacity
              key={item.key}
              activeOpacity={0.8}
              onPress={() => {
                triggerHaptic('light');
                onSelectLevel(item.key);
              }}
              style={[
                styles.filterChip,
                isSelected && { backgroundColor: item.color, borderColor: item.color },
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  isSelected && styles.filterTextActive,
                ]}
              >
                {item.label}
              </Text>
              <View
                style={[
                  styles.countBadge,
                  isSelected && styles.countBadgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.countBadgeText,
                    isSelected && { color: item.color },
                  ]}
                >
                  {count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  countBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeActive: {
    backgroundColor: '#FFFFFF',
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
  },
});
