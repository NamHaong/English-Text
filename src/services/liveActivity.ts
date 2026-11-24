import { NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WordItem } from '../types/vocabulary';

const DYNAMIC_ISLAND_ENABLED_KEY = '@english_dynamic_island_enabled';

const { ActivityKitBridge } = NativeModules;

export const isLiveActivitySupported = async (): Promise<boolean> => {
  if (Platform.OS !== 'ios') return false;
  if (!ActivityKitBridge?.isSupported) return false;
  try {
    return await ActivityKitBridge.isSupported();
  } catch {
    return false;
  }
};

export const getDynamicIslandSetting = async (): Promise<boolean> => {
  try {
    const val = await AsyncStorage.getItem(DYNAMIC_ISLAND_ENABLED_KEY);
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
};

export const setDynamicIslandSetting = async (enabled: boolean): Promise<void> => {
  try {
    await AsyncStorage.setItem(DYNAMIC_ISLAND_ENABLED_KEY, enabled ? 'true' : 'false');
  } catch (e) {
    console.warn('Failed to save dynamic island setting', e);
  }
};

/**
 * Start or update the real native iOS Dynamic Island on physical iPhone
 */
export const updateRealDynamicIsland = async (
  word: WordItem,
  currentIndex: number,
  totalMemorized: number,
  isMemorized: boolean = false
): Promise<boolean> => {
  if (Platform.OS !== 'ios') return false;

  const isEnabled = await getDynamicIslandSetting();
  if (!isEnabled) {
    await stopRealDynamicIsland();
    return false;
  }

  const payload = {
    word: word.word,
    ipa: word.ipa,
    meaning: word.meaning,
    level: word.level,
    pos: word.pos,
    example: word.example || '',
    currentIndex,
    totalMemorized,
    isMemorized,
  };

  if (ActivityKitBridge?.updateActivity) {
    try {
      const res = await ActivityKitBridge.updateActivity(payload);
      if (res?.success) return true;
      // If no active activity was running, start a new one
      if (ActivityKitBridge?.startActivity) {
        const startRes = await ActivityKitBridge.startActivity(payload);
        return !!startRes?.success;
      }
    } catch (e) {
      console.warn('ActivityKit bridge call error:', e);
    }
  }

  return false;
};

/**
 * End the native Live Activity on iPhone
 */
export const stopRealDynamicIsland = async (): Promise<void> => {
  if (Platform.OS !== 'ios') return;
  if (ActivityKitBridge?.endActivity) {
    try {
      await ActivityKitBridge.endActivity();
    } catch (e) {
      console.warn('Error ending ActivityKit session:', e);
    }
  }
};
