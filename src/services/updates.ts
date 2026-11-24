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
      'Chế độ Phát triển (__DEV__)',
      'Hệ thống cập nhật OTA chỉ hoạt động trên bản cài đặt thật (IPA/APK), không chạy trong chế độ Debug / Expo Go.'
    );
    return {
      available: false,
      message: 'Đang ở môi trường Dev',
    };
  }

  if (!Updates.isEnabled) {
    Alert.alert(
      'Chưa Kích Hoạt OTA Trên Bản Cài Này',
      `Bản cài đặt hiện tại trên máy chưa được liên kết với kênh cập nhật Expo (Updates.isEnabled = false).\n\n• Kênh máy: ${Updates.channel || 'Chưa thiết lập'}\n• Runtime: ${Updates.runtimeVersion || 'Chưa thiết lập'}\n\n👉 Để sử dụng OTA, hãy cài bản build IPA mới (đã được cấu hình sẵn kênh 'preview'). Sau khi cài một lần, từ các lần sau mã nguồn sẽ tự động cập nhật trực tuyến!`
    );
    return {
      available: false,
      message: 'expo-updates is disabled in this binary',
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
        `Ứng dụng đang chạy phiên bản mới nhất trên kênh '${Updates.channel || 'preview'}'.\n(Runtime: ${Updates.runtimeVersion || '1.0.0'})`
      );
      return { available: false, message: 'Đã là bản mới nhất' };
    }
  } catch (error: any) {
    Alert.alert(
      'Chi Tiết Kiểm Tra Cập Nhật',
      `Lỗi từ hệ thống Expo:\n${error?.message || error}\n\n• Kênh máy: ${Updates.channel || 'Chưa thiết lập'}\n• Runtime: ${Updates.runtimeVersion || 'Chưa thiết lập'}`
    );
    return {
      available: false,
      message: error?.message || 'Lỗi kết nối',
    };
  }
};
