import * as Updates from 'expo-updates';
import Constants from 'expo-constants';
import { Alert, Platform } from 'react-native';

export interface AppVersionInfo {
  version: string;
  runtimeVersion: string;
  channel: string;
  updateId: string;
  isEmbeddedLaunch: boolean;
}

export const getAppVersionInfo = (): AppVersionInfo => {
  const version = Constants.expoConfig?.version || '1.0.0';
  const runtimeVersion =
    typeof Updates.runtimeVersion === 'string'
      ? Updates.runtimeVersion
      : (Constants.expoConfig?.runtimeVersion as any)?.policy || 'appVersion';
  const channel = Updates.channel || 'development';
  const updateId = Updates.updateId || 'embedded';
  const isEmbeddedLaunch = Updates.isEmbeddedLaunch;

  return {
    version,
    runtimeVersion,
    channel,
    updateId,
    isEmbeddedLaunch,
  };
};

/**
 * Automatically check and apply updates silently in the background
 */
export const checkAndApplyUpdatesAuto = async (): Promise<boolean> => {
  if (__DEV__ || Platform.OS === 'web') return false;

  try {
    const check = await Updates.checkForUpdateAsync();
    if (check.isAvailable) {
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
      return true;
    }
  } catch (error) {
    // In dev or offline, fail silently
    console.log('[expo-updates] Auto update check note:', error);
  }
  return false;
};

/**
 * Manual check triggered by user in Settings/Stats screen
 */
export const checkUpdatesManual = async (): Promise<{
  available: boolean;
  message: string;
}> => {
  if (__DEV__) {
    Alert.alert(
      'Môi trường Phát Triển (Dev)',
      'Hệ thống cập nhật OTA chỉ chạy trên bản build thực tế (Preview / Production), không chạy trong Expo Go.'
    );
    return {
      available: false,
      message: 'Đang ở môi trường Dev',
    };
  }

  try {
    const check = await Updates.checkForUpdateAsync();
    if (check.isAvailable) {
      Alert.alert(
        'Có Bản Cập Nhật Mới! 🚀',
        'Đã tìm thấy phiên bản mới trên máy chủ Expo. Bạn có muốn tải về và khởi động lại ngay không?',
        [
          { text: 'Để sau', style: 'cancel' },
          {
            text: 'Cập nhật ngay',
            onPress: async () => {
              try {
                await Updates.fetchUpdateAsync();
                await Updates.reloadAsync();
              } catch (e: any) {
                Alert.alert('Lỗi tải cập nhật', e?.message || 'Vui lòng thử lại sau.');
              }
            },
          },
        ]
      );
      return { available: true, message: 'Có bản cập nhật mới' };
    } else {
      Alert.alert(
        'Đã Cập Nhật Mới Nhất ✅',
        'Ứng dụng đang chạy phiên bản mới nhất, không có bản cập nhật nào trên máy chủ.'
      );
      return { available: false, message: 'Đã là bản mới nhất' };
    }
  } catch (error: any) {
    Alert.alert(
      'Không thể kiểm tra cập nhật',
      'Vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau.'
    );
    return {
      available: false,
      message: error?.message || 'Lỗi kết nối',
    };
  }
};
