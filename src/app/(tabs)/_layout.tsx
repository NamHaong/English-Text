import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { useVocab } from '../../context/VocabContext';

export default function TabLayout() {
  const { progress } = useVocab();
  const memorizedCount = progress?.memorizedIds?.length || 0;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F1F5F9',
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 10,
          paddingTop: 8,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      {/* Tab 1: Học từ */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Học Từ',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'sparkles' : 'sparkles-outline'}
              size={22}
              color={focused ? '#2563EB' : (color as string) || '#94A3B8'}
            />
          ),
        }}
      />

      {/* Tab 2: Đã thuộc */}
      <Tabs.Screen
        name="mastered"
        options={{
          title: 'Đã Thuộc',
          tabBarBadge:
            memorizedCount > 0
              ? memorizedCount > 99
                ? '99+'
                : memorizedCount
              : undefined,
          tabBarBadgeStyle: {
            backgroundColor: '#10B981',
            color: '#FFFFFF',
            fontSize: 10,
            lineHeight: 12,
          },
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'checkmark-circle' : 'checkmark-circle-outline'}
              size={23}
              color={focused ? '#10B981' : (color as string) || '#94A3B8'}
            />
          ),
        }}
      />

      {/* Tab 3: Thống kê */}
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Thống Kê',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'stats-chart' : 'stats-chart-outline'}
              size={22}
              color={focused ? '#8B5CF6' : (color as string) || '#94A3B8'}
            />
          ),
        }}
      />
    </Tabs>
  );
}
