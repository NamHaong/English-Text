import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { WordItem } from '../types/vocabulary';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const requestNotificationPermissions = async (): Promise<boolean> => {
  if (Platform.OS === 'web') return false;
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  } catch (e) {
    console.warn('Error requesting notifications permission:', e);
    return false;
  }
};

/**
 * Push current word to notification / lock screen banner so user sees it even when outside the app
 */
export const updateLiveActivityWord = async (word: WordItem, totalMemorized: number) => {
  if (Platform.OS === 'web') return;

  try {
    // Remove the previous word so banners don't pile up in Notification Center
    await Notifications.dismissAllNotificationsAsync();
    // Schedule instant notification pinned on lockscreen / dynamic island banner
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🏝️ Dynamic Island • ${word.word.toUpperCase()} [${word.pos}]`,
        subtitle: `${word.ipa} - ${word.level}`,
        body: `👉 ${word.meaning}\n💡 "${word.example}"`,
        data: { wordId: word.id, word: word.word },
        sound: false,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // deliver immediately
    });
  } catch (error) {
    console.warn('Failed to update live notification banner:', error);
  }
};
