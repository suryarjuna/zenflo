import { requireOptionalNativeModule, Platform } from 'expo-modules-core';

const isIOS = Platform.OS === 'ios';

interface WidgetSyncNativeModule {
  setWidgetData(jsonString: string): Promise<void>;
  clearWidgetData(): Promise<void>;
}

const nativeModule = isIOS
  ? requireOptionalNativeModule<WidgetSyncNativeModule>('WidgetSync')
  : null;

export async function setWidgetData(jsonString: string): Promise<void> {
  if (!nativeModule) return;
  return nativeModule.setWidgetData(jsonString);
}

export async function clearWidgetData(): Promise<void> {
  if (!nativeModule) return;
  return nativeModule.clearWidgetData();
}
