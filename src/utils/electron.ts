// Utility to detect if the app is running in Electron environment
interface ElectronAPI {
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  unmaximizeWindow: () => void;
  closeWindow: () => void;
  hideWindow: () => void;
  showWindow: () => void;
  isElectron: () => boolean;
}
declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

import { getWindow, getElectronAPI } from './isomorphic';

export const isElectron = (): boolean => {
  // Check if we're in a browser environment (not SSR)
  const windowObj = getWindow();
  if (!windowObj) {
    return false;
  }
  
  // Check if the electronAPI is available in the window object
  return !!windowObj?.electronAPI?.isElectron();
};

// Type-safe wrapper for Electron API calls
export const electronAPI = (): ElectronAPI | null => {
  if (!isElectron()) {
    return null;
  }

  return getElectronAPI();
};
