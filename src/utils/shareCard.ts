import React from 'react';
import { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

export async function shareViewAsImage(viewRef: React.RefObject<View>): Promise<void> {
  try {
    if (!viewRef.current) return;
    const uri = await captureRef(viewRef, {
      format: 'png',
      quality: 1,
    });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri);
    }
  } catch (error) {
    console.error('Share failed:', error);
  }
}
