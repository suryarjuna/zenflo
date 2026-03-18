import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Mode } from '../types';

interface ModeState {
  currentMode: Mode;
  setMode: (mode: Mode) => Promise<void>;
  loadMode: () => Promise<void>;
}

export const useModeStore = create<ModeState>((set) => ({
  currentMode: 'monk',
  setMode: async (mode) => {
    set({ currentMode: mode });
    await AsyncStorage.setItem('zenflo_mode', mode);
  },
  loadMode: async () => {
    const saved = await AsyncStorage.getItem('zenflo_mode');
    if (saved) set({ currentMode: saved as Mode });
  },
}));
